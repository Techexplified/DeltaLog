figma.showUI(__html__, { width: 360, height: 600, themeColors: true });

// Plugin Data storage keys
const DELTALOG_INDEX_KEY = "deltalog_index";
const DELTALOG_GLOBAL_KEY = "deltalog_global_versions";
const SNAPSHOTS_PAGE_NAME = "DeltaLog snapshots, do not edit";
const GLOBAL_VERSION_LIMIT = 10;

// Types
interface SnapshotNode {
  id: string;
  type: string;
  name: string;
  parentId: string | null;
  text: { characters: string; fontSize: number | string; fontFamily: string } | null;
  colour: { fills: string[]; strokes: string[] };
  layout: { x: number; y: number; w: number; h: number };
  effects: { opacity: number; cornerRadius: number | string; shadows: string[] };
  visibility: { visible: boolean };
}

interface VersionSnapshot {
  frameId: string;
  version: string;
  label: 'major' | 'minor' | 'patch' | 'base';
  note: string;
  author: string;
  createdAt: string;
  cloneNodeId?: string;
  nodes: Record<string, SnapshotNode>;
}

interface VersionIndexItem {
  version: string;
  label: 'major' | 'minor' | 'patch' | 'base';
  note: string;
  author: string;
  createdAt: string;
  cloneNodeId?: string;
  layerCount: number;
  sizeKb: number;
}

interface GlobalVersionEntry {
  frameId: string;
  version: string;
  createdAt: string;
  cloneNodeId?: string;
}

// Helpers
function hasHistory(node: SceneNode): boolean {
  try {
    const raw = node.getPluginData(DELTALOG_INDEX_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
}

function getFrameVersions(node: SceneNode): VersionIndexItem[] {
  try {
    const raw = node.getPluginData(DELTALOG_INDEX_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as VersionIndexItem[];
  } catch {
    return [];
  }
}

function findTopLevelFrame(node: SceneNode): FrameNode | ComponentNode | SectionNode | null {
  let current: BaseNode | null = node;
  while (current && current.parent && current.parent.type !== "PAGE") {
    current = current.parent;
  }
  if (current && (current.type === "FRAME" || current.type === "COMPONENT" || current.type === "SECTION")) {
    return current as FrameNode | ComponentNode | SectionNode;
  }
  return null;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(1, n)) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function extractPaints(paints: ReadonlyArray<Paint> | PluginAPI['mixed']): string[] {
  if (!paints || paints === figma.mixed || !Array.isArray(paints)) return [];
  const results: string[] = [];
  for (const paint of paints) {
    if (paint.visible !== false && paint.type === 'SOLID' && paint.color) {
      results.push(rgbToHex(paint.color.r, paint.color.g, paint.color.b));
    }
  }
  return results;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let base64 = '';
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < len ? bytes[i + 1] : 0;
    const b3 = i + 2 < len ? bytes[i + 2] : 0;
    const c1 = b1 >> 2;
    const c2 = ((b1 & 3) << 4) | (b2 >> 4);
    const c3 = ((b2 & 15) << 2) | (b3 >> 6);
    const c4 = b3 & 63;
    base64 += chars[c1] + chars[c2];
    base64 += i + 1 < len ? chars[c3] : '=';
    base64 += i + 2 < len ? chars[c4] : '=';
  }
  return base64;
}

async function getFrameThumbnail(node: SceneNode): Promise<string | null> {
  try {
    const bytes = await node.exportAsync({
      format: 'PNG',
      constraint: { type: 'SCALE', value: 0.25 }
    });
    return `data:image/png;base64,${uint8ArrayToBase64(bytes)}`;
  } catch (err) {
    console.warn("DeltaLog: thumbnail export skipped:", err);
    return null;
  }
}

// Layer Serializer
function serializeFrame(frame: FrameNode | ComponentNode | SectionNode): Record<string, SnapshotNode> {
  const nodesMap: Record<string, SnapshotNode> = {};
  const frameX = frame.absoluteTransform[0][2];
  const frameY = frame.absoluteTransform[1][2];

  // Include the root frame itself
  nodesMap[frame.id] = {
    id: frame.id,
    type: frame.type,
    name: frame.name,
    parentId: null,
    text: null,
    colour: {
      fills: 'fills' in frame ? extractPaints(frame.fills) : [],
      strokes: 'strokes' in frame ? extractPaints(frame.strokes) : []
    },
    layout: {
      x: 0,
      y: 0,
      w: Math.round(frame.width * 100) / 100,
      h: Math.round(frame.height * 100) / 100
    },
    effects: {
      opacity: 'opacity' in frame ? (frame.opacity ?? 1) : 1,
      cornerRadius: 'cornerRadius' in frame && frame.cornerRadius !== figma.mixed ? (frame.cornerRadius as number) : 0,
      shadows: []
    },
    visibility: { visible: frame.visible }
  };

  // Traverse all descendants
  const descendants = frame.findAll();
  for (const node of descendants) {
    const nodeX = node.absoluteTransform[0][2];
    const nodeY = node.absoluteTransform[1][2];

    let textData: SnapshotNode['text'] = null;
    if (node.type === 'TEXT') {
      const tNode = node as TextNode;
      textData = {
        characters: tNode.characters || '',
        fontSize: tNode.fontSize === figma.mixed ? 'mixed' : (tNode.fontSize as number),
        fontFamily: tNode.fontName === figma.mixed ? 'mixed' : (tNode.fontName as FontName).family
      };
    }

    let cornerRadius: number | string = 0;
    if ('cornerRadius' in node) {
      cornerRadius = node.cornerRadius === figma.mixed ? 'mixed' : (node.cornerRadius as number);
    }

    nodesMap[node.id] = {
      id: node.id,
      type: node.type,
      name: node.name,
      parentId: node.parent ? node.parent.id : null,
      text: textData,
      colour: {
        fills: 'fills' in node ? extractPaints(node.fills) : [],
        strokes: 'strokes' in node ? extractPaints(node.strokes) : []
      },
      layout: {
        x: Math.round((nodeX - frameX) * 100) / 100,
        y: Math.round((nodeY - frameY) * 100) / 100,
        w: Math.round(node.width * 100) / 100,
        h: Math.round(node.height * 100) / 100
      },
      effects: {
        opacity: 'opacity' in node ? (node.opacity ?? 1) : 1,
        cornerRadius: cornerRadius,
        shadows: []
      },
      visibility: { visible: node.visible }
    };
  }

  return nodesMap;
}

// Milestone Cloner
async function cloneFrameMilestone(frame: FrameNode | ComponentNode | SectionNode, version: string): Promise<string | null> {
  let clone: (FrameNode | ComponentNode | SectionNode) | null = null;
  try {
    const pages = figma.root.children;
    let snapshotsPage = pages.find(p => p.name === SNAPSHOTS_PAGE_NAME);
    if (!snapshotsPage) {
      snapshotsPage = figma.createPage();
      snapshotsPage.name = SNAPSHOTS_PAGE_NAME;
    }

    // Dynamic-page mode requirement: target page must be loaded before accessing children or appendChild
    await snapshotsPage.loadAsync();

    clone = frame.clone();
    clone.name = `${frame.name} (${version})`;
    snapshotsPage.appendChild(clone);

    // Position clones neatly horizontally on snapshots page
    const existingCount = snapshotsPage.children.length;
    clone.x = (existingCount - 1) * (frame.width + 120);
    clone.y = 0;

    return clone.id;
  } catch (err) {
    console.warn("DeltaLog: Milestone clone failed:", err);
    // Cleanup orphaned clone from current page if reparenting failed
    if (clone && !clone.removed) {
      try {
        clone.remove();
      } catch {}
    }
    return null;
  }
}

// Global 10 Limit FIFO Pruner
async function enforceGlobalLimit() {
  try {
    const raw = figma.root.getPluginData(DELTALOG_GLOBAL_KEY);
    if (!raw) return;
    let globalList: GlobalVersionEntry[] = JSON.parse(raw);

    while (globalList.length > GLOBAL_VERSION_LIMIT) {
      const oldest = globalList.shift();
      if (!oldest) break;

      // 1. Delete milestone clone if exists
      if (oldest.cloneNodeId) {
        try {
          const cloneNode = await figma.getNodeByIdAsync(oldest.cloneNodeId);
          if (cloneNode) cloneNode.remove();
        } catch {}
      }

      // 2. Remove version entry from frame
      try {
        const frameNode = await figma.getNodeByIdAsync(oldest.frameId) as SceneNode | null;
        if (frameNode) {
          frameNode.setPluginData(`deltalog_ver_${oldest.version}`, "");
          const fIndexRaw = frameNode.getPluginData(DELTALOG_INDEX_KEY);
          if (fIndexRaw) {
            const fIndex: VersionIndexItem[] = JSON.parse(fIndexRaw);
            const filtered = fIndex.filter(item => item.version !== oldest.version);
            frameNode.setPluginData(DELTALOG_INDEX_KEY, JSON.stringify(filtered));
          }
        }
      } catch {}
    }

    figma.root.setPluginData(DELTALOG_GLOBAL_KEY, JSON.stringify(globalList));
  } catch (err) {
    console.warn("DeltaLog: Global limit enforcement error:", err);
  }
}

// List all tracked frames across the document
async function getTrackedFramesList(): Promise<{ id: string; name: string; versionsCount: number; latestVersion: string }[]> {
  try {
    const raw = figma.root.getPluginData(DELTALOG_GLOBAL_KEY);
    if (!raw) return [];
    const globalEntries: GlobalVersionEntry[] = JSON.parse(raw);
    
    // Group by frameId
    const map = new Map<string, { versionsCount: number; latestVersion: string }>();
    for (const entry of globalEntries) {
      const existing = map.get(entry.frameId);
      if (!existing) {
        map.set(entry.frameId, { versionsCount: 1, latestVersion: entry.version });
      } else {
        existing.versionsCount += 1;
        existing.latestVersion = entry.version;
      }
    }

    const results = [];
    for (const [frameId, data] of map.entries()) {
      try {
        const node = await figma.getNodeByIdAsync(frameId);
        if (node && !node.removed) {
          results.push({
            id: frameId,
            name: node.name,
            versionsCount: data.versionsCount,
            latestVersion: data.latestVersion
          });
        }
      } catch {}
    }
    return results;
  } catch {
    return [];
  }
}

// Selection updater
async function updateSelection() {
  const trackedFrames = await getTrackedFramesList();
  const selection: readonly SceneNode[] = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.ui.postMessage({
      type: "selection-update",
      status: "EMPTY",
      trackedFrames
    });
    return;
  }

  if (selection.length > 1) {
    figma.ui.postMessage({
      type: "selection-update",
      status: "MULTIPLE",
      message: "Multiple items selected. Please select one frame.",
      trackedFrames
    });
    return;
  }

  const selectedNode = selection[0];

  if (selectedNode.type === "FRAME" || selectedNode.type === "COMPONENT" || selectedNode.type === "SECTION") {
    const id: string = selectedNode.id;
    const name: string = selectedNode.name;
    const w: number = Math.round(selectedNode.width);
    const h: number = Math.round(selectedNode.height);
    const layerCount: number = selectedNode.findAll().length;
    const versions = getFrameVersions(selectedNode);
    const hasSavedVersion: boolean = versions.length > 0;
    const latestVersion = hasSavedVersion ? versions[versions.length - 1].version : null;

    // Send immediate metadata so UI is instant
    figma.ui.postMessage({
      type: "selection-update",
      status: "LOADED",
      id: id,
      name: name,
      w: w,
      h: h,
      layerCount: layerCount,
      hasSavedVersion: hasSavedVersion,
      latestVersion: latestVersion,
      versionsCount: versions.length,
      versions: versions,
      trackedFrames
    });

    // Export thumbnail asynchronously and push to UI
    getFrameThumbnail(selectedNode).then((thumb) => {
      figma.ui.postMessage({
        type: "thumbnail-update",
        id: id,
        thumbnail: thumb
      });
    });
    return;
  }

  // Child selected inside frame
  const parentFrame = findTopLevelFrame(selectedNode);
  if (parentFrame) {
    figma.ui.postMessage({
      type: "selection-update",
      status: "CHILD_SELECTED",
      selectedNodeName: selectedNode.name,
      parentFrameId: parentFrame.id,
      parentFrameName: parentFrame.name,
      message: `Selected "${selectedNode.name}" inside "${parentFrame.name}". Pick the top-level frame.`,
      trackedFrames
    });
    return;
  }

  figma.ui.postMessage({
    type: "selection-update",
    status: "NOT_FRAME",
    message: "Selected element is not a frame. Pick a top-level frame.",
    trackedFrames
  });
}

// Event listeners
figma.on("selectionchange", () => {
  updateSelection();
});

updateSelection();

// Message Bridge
figma.ui.onmessage = async (msg: { type: string; [key: string]: any }) => {
  switch (msg.type) {
    case "GET_CURRENT_SELECTION":
      updateSelection();
      break;

    case "SELECT_FRAME":
      if (msg.id) {
        const node = (await figma.getNodeByIdAsync(msg.id)) as SceneNode | null;
        if (node) {
          figma.currentPage.selection = [node];
          figma.viewport.scrollAndZoomIntoView([node]);
        }
      }
      break;

    case "SAVE_VERSION": {
      const { frameId, version, label, note, keepFullCopy, compareAfter } = msg;
      const frame = (await figma.getNodeByIdAsync(frameId)) as (FrameNode | ComponentNode | SectionNode) | null;
      if (!frame) {
        figma.ui.postMessage({ type: "SAVE_VERSION_ERROR", error: "Frame not found on canvas." });
        return;
      }

      try {
        const author = figma.currentUser?.name || "Anonymous";
        const createdAt = new Date().toISOString();

        // 1. Clone milestone if requested
        let cloneNodeId: string | undefined = undefined;
        if (keepFullCopy) {
          const cloneId = await cloneFrameMilestone(frame, version);
          if (cloneId) cloneNodeId = cloneId;
        }

        // 2. Serialize frame nodes
        const nodes = serializeFrame(frame);
        const snapshot: VersionSnapshot = {
          frameId: frame.id,
          version,
          label,
          note: note || '',
          author,
          createdAt,
          cloneNodeId,
          nodes
        };

        const jsonString = JSON.stringify(snapshot);
        const sizeKb = Math.round((jsonString.length / 1024) * 10) / 10;

        // Check Figma 100 kB limit
        if (jsonString.length > 100000) {
          figma.ui.postMessage({
            type: "SAVE_VERSION_ERROR",
            error: "Snapshot exceeds Figma's 100 kB limit. Please simplify or split this large frame."
          });
          return;
        }

        // 3. Save snapshot to frame plugin data
        frame.setPluginData(`deltalog_ver_${version}`, jsonString);

        // 4. Update frame's version index
        const currentVersions = getFrameVersions(frame);
        const newIndexItem: VersionIndexItem = {
          version,
          label,
          note: note || '',
          author,
          createdAt,
          cloneNodeId,
          layerCount: Object.keys(nodes).length,
          sizeKb
        };
        const updatedVersions = [...currentVersions, newIndexItem];
        frame.setPluginData(DELTALOG_INDEX_KEY, JSON.stringify(updatedVersions));

        // 5. Update document-level global index
        const globalRaw = figma.root.getPluginData(DELTALOG_GLOBAL_KEY);
        const globalList: GlobalVersionEntry[] = globalRaw ? JSON.parse(globalRaw) : [];
        globalList.push({
          frameId: frame.id,
          version,
          createdAt,
          cloneNodeId
        });
        figma.root.setPluginData(DELTALOG_GLOBAL_KEY, JSON.stringify(globalList));

        // 6. Enforce global 15-version FIFO cap
        await enforceGlobalLimit();

        // 7. Notify UI of success
        figma.ui.postMessage({
          type: "SAVE_VERSION_SUCCESS",
          version,
          author,
          sizeKb,
          compareAfter: !!compareAfter,
          versionsCount: updatedVersions.length
        });

        // Trigger selection refresh so Home screen has updated versions
        updateSelection();
      } catch (err: any) {
        console.error("DeltaLog save error:", err);
        figma.ui.postMessage({
          type: "SAVE_VERSION_ERROR",
          error: err?.message || "Failed to save version snapshot."
        });
      }
      break;
    }

    case "NOTIFY":
      if (msg.message) {
        figma.notify(msg.message);
      }
      break;

    case "CLOSE":
      figma.closePlugin();
      break;

    default:
      console.warn("DeltaLog: Unknown message:", msg.type);
      break;
  }
};
