import JSZip from 'jszip';

interface ExportZipPayload {
  isGlobal: boolean;
  frameName: string;
  versionsData: any[];
  previews: Record<string, string>;
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

  // 2. Add Previews folder with PNGs
  const previewsFolder = zip.folder('previews');
  if (previewsFolder && payload.previews) {
    for (const [key, base64Data] of Object.entries(payload.previews)) {
      if (base64Data) {
        try {
          const rawBytes = base64ToUint8Array(base64Data);
          previewsFolder.file(`${key}.png`, rawBytes);
        } catch (err) {
          console.warn('Failed to add preview PNG:', key, err);
        }
      }
    }
  }

  // 3. Generate Blob and trigger download
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
