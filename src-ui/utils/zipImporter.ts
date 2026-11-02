import JSZip from 'jszip';
import { VersionIndexItem, ParsedImportData, ImportedFrameItem } from '../types';

export interface ValidationResult {
  ok: boolean;
  data?: ParsedImportData;
  error?: string;
}

const GLOBAL_VERSION_LIMIT = 10;

function normalizeVersionMeta(item: any): VersionIndexItem {
  const raw = item && item.metadata ? item.metadata : (item || {});
  return {
    version: raw.version || 'v1.0.0',
    label: raw.label || raw.version || 'v1.0.0',
    note: raw.note || '',
    author: raw.author || 'Anonymous',
    createdAt: raw.createdAt || new Date().toISOString(),
    cloneNodeId: raw.cloneNodeId,
    layerCount: raw.layerCount || (item?.snapshot?.nodes ? Object.keys(item.snapshot.nodes).length : 0),
    sizeKb: raw.sizeKb || 0
  };
}

function findSvgInZip(zip: JSZip, frameName: string, version: string): JSZip.JSZipObject | null {
  const safeUnderscore = frameName.replace(/[/\\?%*:|"<>]/g, '_');
  const safeKebab = frameName.toLowerCase().replace(/[^a-z0-9_-]/g, '-');

  // 1. Exact match with frame prefix
  let f = zip.file(`svg-vectors/${frameName}-${version}.svg`);
  if (f) return f;

  // 2. Safe underscore match
  f = zip.file(`svg-vectors/${safeUnderscore}-${version}.svg`);
  if (f) return f;

  // 3. Exact match with version only (single-frame backups)
  f = zip.file(`svg-vectors/${version}.svg`);
  if (f) return f;

  // 4. Safe kebab match
  f = zip.file(`svg-vectors/${safeKebab}-${version}.svg`);
  if (f) return f;

  // 5. Search all svg files matching frameName and version
  const allSvgs = zip.file(/^svg-vectors\/.*\.svg$/i);
  for (const svgFile of allSvgs) {
    const fn = svgFile.name.toLowerCase();
    if (fn.endsWith(`${version.toLowerCase()}.svg`)) {
      if (fn.includes(frameName.toLowerCase()) || fn.includes(safeUnderscore.toLowerCase()) || fn.includes(safeKebab)) {
        return svgFile;
      }
    }
  }

  // 6. Fallback: match by version suffix
  for (const svgFile of allSvgs) {
    if (svgFile.name.toLowerCase().endsWith(`${version.toLowerCase()}.svg`)) {
      return svgFile;
    }
  }

  return null;
}

function findPngInZip(zip: JSZip, frameName: string, version: string): JSZip.JSZipObject | null {
  const safeUnderscore = frameName.replace(/[/\\?%*:|"<>]/g, '_');
  const safeKebab = frameName.toLowerCase().replace(/[^a-z0-9_-]/g, '-');

  let f = zip.file(`png-preview/${frameName}-${version}.png`);
  if (f) return f;
  f = zip.file(`png-preview/${safeUnderscore}-${version}.png`);
  if (f) return f;
  f = zip.file(`png-preview/${version}.png`);
  if (f) return f;
  f = zip.file(`png-preview/${safeKebab}-${version}.png`);
  if (f) return f;

  const allPngs = zip.file(/^png-preview\/.*\.png$/i);
  for (const pngFile of allPngs) {
    const fn = pngFile.name.toLowerCase();
    if (fn.endsWith(`${version.toLowerCase()}.png`)) {
      if (fn.includes(frameName.toLowerCase()) || fn.includes(safeUnderscore.toLowerCase()) || fn.includes(safeKebab)) {
        return pngFile;
      }
    }
  }
  for (const pngFile of allPngs) {
    if (pngFile.name.toLowerCase().endsWith(`${version.toLowerCase()}.png`)) {
      return pngFile;
    }
  }
  return null;
}

async function processSingleFrameAssets(
  zip: JSZip,
  frameName: string,
  versionList: VersionIndexItem[],
  snapshotsMap: Record<string, any>
): Promise<{ ok: boolean; frame?: ImportedFrameItem; error?: string }> {
  const latestItem = versionList[versionList.length - 1];
  const latestVersion = latestItem.version;

  const latestSvgFile = findSvgInZip(zip, frameName, latestVersion);
  if (!latestSvgFile) {
    return {
      ok: false,
      error: `Incomplete backup: Missing vector graphic for "${frameName}" latest version (${latestVersion}.svg) in svg-vectors/.`
    };
  }

  let latestSvgText = '';
  try {
    latestSvgText = await latestSvgFile.async('text');
  } catch (err) {
    return {
      ok: false,
      error: `Failed to read vector graphic for "${frameName}" (${latestVersion}.svg).`
    };
  }

  const trimmedSvg = latestSvgText.trim().toLowerCase();
  if (!trimmedSvg.includes('<svg') || !trimmedSvg.includes('</svg>')) {
    return {
      ok: false,
      error: `Vector graphic for "${frameName}" (${latestVersion}.svg) is corrupted or not a valid SVG.`
    };
  }

  // Collect milestone SVGs for older versions
  const milestoneSvgs: Record<string, string> = {};
  for (const v of versionList) {
    if (v.version === latestVersion) continue;
    const svgF = findSvgInZip(zip, frameName, v.version);
    if (svgF) {
      try {
        const svgContent = await svgF.async('text');
        if (svgContent.toLowerCase().includes('<svg')) {
          milestoneSvgs[v.version] = svgContent;
        }
      } catch {}
    }
  }

  // Thumbnail preview
  let latestPngBase64: string | null = null;
  const pngF = findPngInZip(zip, frameName, latestVersion);
  if (pngF) {
    try {
      const base64Str = await pngF.async('base64');
      latestPngBase64 = `data:image/png;base64,${base64Str}`;
    } catch {}
  }

  return {
    ok: true,
    frame: {
      frameName,
      versions: versionList,
      snapshots: snapshotsMap,
      latestVersion,
      latestSvg: latestSvgText,
      milestoneSvgs,
      latestPngBase64
    }
  };
}

export async function parseAndValidateZip(
  file: File,
  currentFileVersionsCount: number
): Promise<ValidationResult> {
  // Level 1: Zip file format & decompression
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch (err: any) {
    return {
      ok: false,
      error: 'Invalid or corrupted ZIP archive. Please select a valid .zip file.'
    };
  }

  // Level 2: Manifest & DeltaLog Signature verification
  const historyFile = zip.file('history.json');
  if (!historyFile) {
    return {
      ok: false,
      error: 'Missing history.json. This archive is not a DeltaLog export package.'
    };
  }

  let historyData: any;
  try {
    const rawText = await historyFile.async('text');
    historyData = JSON.parse(rawText);
  } catch (err) {
    return {
      ok: false,
      error: 'Corrupted history.json file inside archive. Failed to parse JSON.'
    };
  }

  if (!historyData || historyData.app !== 'DeltaLog') {
    return {
      ok: false,
      error: 'Unrecognized backup signature. This file was not exported by DeltaLog.'
    };
  }

  const isDocumentScope = historyData.scope === 'document-file' || Array.isArray(historyData.frames);
  const framesList: ImportedFrameItem[] = [];

  // Parse frames based on archive structure
  if (isDocumentScope && Array.isArray(historyData.frames) && historyData.frames.length > 0) {
    // Format A: Structured multi-frame document export
    for (const rawFrame of historyData.frames) {
      if (!rawFrame) continue;
      const fName = rawFrame.frameName || rawFrame.name || 'Screen';
      const rawVers = Array.isArray(rawFrame.versions) ? rawFrame.versions : [];
      if (rawVers.length === 0) continue;

      const vList: VersionIndexItem[] = [];
      const snaps: Record<string, any> = rawFrame.snapshots || {};

      for (const vItem of rawVers) {
        if (!vItem) continue;
        const meta: VersionIndexItem = normalizeVersionMeta(vItem);
        if (meta && meta.version) {
          vList.push(meta);
          if (vItem.snapshot) {
            snaps[meta.version] = vItem.snapshot;
          }
        }
      }

      if (vList.length > 0) {
        const res = await processSingleFrameAssets(zip, fName, vList, snaps);
        if (!res.ok) return { ok: false, error: res.error };
        framesList.push(res.frame!);
      }
    }
  } else if (
    isDocumentScope &&
    Array.isArray(historyData.versions) &&
    historyData.versions.length > 0 &&
    (historyData.versions[0].frameName || historyData.versions[0].frameId)
  ) {
    // Format B: Flat document export grouped by frameName
    const grouped = new Map<string, any[]>();
    for (const vItem of historyData.versions) {
      const fName = vItem.frameName || 'Screen';
      if (!grouped.has(fName)) grouped.set(fName, []);
      grouped.get(fName)!.push(vItem);
    }

    for (const [fName, items] of grouped.entries()) {
      const vList: VersionIndexItem[] = [];
      const snaps: Record<string, any> = {};

      for (const vItem of items) {
        if (!vItem) continue;
        const meta: VersionIndexItem = normalizeVersionMeta(vItem);
        if (meta && meta.version) {
          vList.push(meta);
          if (vItem.snapshot) {
            snaps[meta.version] = vItem.snapshot;
          }
        }
      }

      if (vList.length > 0) {
        const res = await processSingleFrameAssets(zip, fName, vList, snaps);
        if (!res.ok) return { ok: false, error: res.error };
        framesList.push(res.frame!);
      }
    }
  } else {
    // Format C: Single frame export
    const fName = historyData.frameName || 'Imported Frame';
    const rawVers = Array.isArray(historyData.versions) ? historyData.versions : [];
    const vList: VersionIndexItem[] = [];
    const snaps: Record<string, any> = {};

    for (const item of rawVers) {
      if (!item) continue;
      const meta: VersionIndexItem = normalizeVersionMeta(item);
      if (meta && meta.version) {
        vList.push(meta);
        if (item.snapshot) {
          snaps[meta.version] = item.snapshot;
        }
      }
    }

    if (vList.length === 0) {
      return { ok: false, error: 'Backup contains no recorded version history.' };
    }

    const res = await processSingleFrameAssets(zip, fName, vList, snaps);
    if (!res.ok) return { ok: false, error: res.error };
    framesList.push(res.frame!);
  }

  if (framesList.length === 0) {
    return {
      ok: false,
      error: 'No valid tracked screens found in backup.'
    };
  }

  // Level 4: Capacity & Storage Quota Verification
  const totalIncomingVersions = framesList.reduce((acc, f) => acc + f.versions.length, 0);

  if (totalIncomingVersions > GLOBAL_VERSION_LIMIT) {
    return {
      ok: false,
      error: `Backup contains ${totalIncomingVersions} versions across ${framesList.length} ${framesList.length === 1 ? 'screen' : 'screens'}, which exceeds the max ${GLOBAL_VERSION_LIMIT}-version file limit.`
    };
  }

  if (currentFileVersionsCount + totalIncomingVersions > GLOBAL_VERSION_LIMIT) {
    const availableSlots = Math.max(0, GLOBAL_VERSION_LIMIT - currentFileVersionsCount);
    return {
      ok: false,
      error: `Import blocked: Backup contains ${totalIncomingVersions} versions (${framesList.length} ${framesList.length === 1 ? 'screen' : 'screens'}), but this file only has room for ${availableSlots} more (currently using ${currentFileVersionsCount}/${GLOBAL_VERSION_LIMIT} versions). Please delete old versions in History or clear history in Settings before importing.`
    };
  }

  const primaryFrame = framesList[0];

  return {
    ok: true,
    data: {
      scope: isDocumentScope ? 'document-file' : 'frame',
      frames: framesList,
      totalIncomingVersions,
      frameName: primaryFrame.frameName,
      versions: primaryFrame.versions,
      snapshots: primaryFrame.snapshots,
      latestVersion: primaryFrame.latestVersion,
      latestSvg: primaryFrame.latestSvg,
      milestoneSvgs: primaryFrame.milestoneSvgs,
      latestPngBase64: primaryFrame.latestPngBase64,
      incomingCount: totalIncomingVersions
    }
  };
}
