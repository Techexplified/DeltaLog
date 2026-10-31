import JSZip from 'jszip';

interface ExportZipPayload {
  isGlobal: boolean;
  frameName: string;
  versionsData: any[];
  pngPreviews: Record<string, string>;
  svgVectors?: Record<string, string>;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function generateAndDownloadZip(payload: ExportZipPayload): Promise<void> {
  const zip = new JSZip();

  // 1. Add JSON metadata & snapshot deltas
  const metadata = {
    app: 'DeltaLog',
    exportedAt: new Date().toISOString(),
    scope: payload.isGlobal ? 'document-file' : 'frame',
    frameName: payload.frameName,
    versions: payload.versionsData
  };
  zip.file('history.json', JSON.stringify(metadata, null, 2));

  // 2. Add png-preview folder with PNGs
  const pngFolder = zip.folder('png-preview');
  if (pngFolder && payload.pngPreviews) {
    for (const [key, base64Data] of Object.entries(payload.pngPreviews)) {
      if (base64Data) {
        try {
          const rawBytes = base64ToUint8Array(base64Data);
          pngFolder.file(`${key}.png`, rawBytes);
        } catch (err) {
          console.warn('Failed to add PNG preview:', key, err);
        }
      }
    }
  }

  // 3. Add svg-vectors folder with SVGs
  const svgFolder = zip.folder('svg-vectors');
  if (svgFolder && payload.svgVectors) {
    for (const [key, base64Data] of Object.entries(payload.svgVectors)) {
      if (base64Data) {
        try {
          const rawBytes = base64ToUint8Array(base64Data);
          svgFolder.file(`${key}.svg`, rawBytes);
        } catch (err) {
          console.warn('Failed to add SVG vector:', key, err);
        }
      }
    }
  }

  // 4. Generate Blob and trigger download
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  const safeName = (payload.frameName || 'deltalog')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-');
  a.download = `deltalog-${safeName}-history.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
