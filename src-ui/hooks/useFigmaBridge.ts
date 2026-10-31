import { useState, useEffect, useCallback } from 'react';
import { SelectionData, PluginMessage, SaveVersionPayload, SaveSuccessData, DiffResult, CompareRequestPayload } from '../types';
import { generateAndDownloadZip } from '../utils/zipExporter';

export function useFigmaBridge() {
  const [selection, setSelection] = useState<SelectionData>({
    status: 'EMPTY'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<SaveSuccessData | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);

  const sendMessage = useCallback((type: string, payload: Record<string, any> = {}) => {
    parent.postMessage(
      {
        pluginMessage: {
          type,
          ...payload
        }
      },
      '*'
    );
  }, []);

  const saveVersion = useCallback((payload: SaveVersionPayload) => {
    setIsSaving(true);
    sendMessage('SAVE_VERSION', payload);
  }, [sendMessage]);

  const runCompare = useCallback((payload: CompareRequestPayload) => {
    setIsComparing(true);
    sendMessage('RUN_COMPARE', payload);
  }, [sendMessage]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg: PluginMessage = event.data?.pluginMessage;
      if (!msg) return;

      if (msg.type === 'selection-update') {
        setSelection(prev => ({
          status: msg.status || 'EMPTY',
          id: msg.id,
          name: msg.name,
          w: msg.w,
          h: msg.h,
          layerCount: msg.layerCount,
          hasSavedVersion: msg.hasSavedVersion,
          latestVersion: msg.latestVersion,
          versionsCount: msg.versionsCount,
          versions: msg.versions || [],
          userName: msg.userName || prev.userName || "Designer",
          thumbnail: msg.id === prev.id ? prev.thumbnail : null, // preserve or reset
          trackedFrames: msg.trackedFrames || prev.trackedFrames || [],
          selectedNodeName: msg.selectedNodeName,
          parentFrameId: msg.parentFrameId,
          parentFrameName: msg.parentFrameName,
          message: msg.message
        }));
      }

      if (msg.type === 'thumbnail-update') {
        setSelection(prev => {
          if (prev.id === msg.id) {
            return { ...prev, thumbnail: msg.thumbnail };
          }
          return prev;
        });
      }

      if (msg.type === 'SAVE_VERSION_SUCCESS') {
        setIsSaving(false);
        setSaveSuccess({
          version: msg.version,
          author: msg.author,
          sizeKb: msg.sizeKb,
          compareAfter: msg.compareAfter,
          versionsCount: msg.versionsCount
        });
      }

      if (msg.type === 'SAVE_VERSION_ERROR') {
        setIsSaving(false);
        sendMessage('NOTIFY', { message: `Error: ${msg.error}` });
      }

      if (msg.type === 'COMPARE_RESULT_SUCCESS') {
        setIsComparing(false);
        setDiffResult(msg.diff);
      }

      if (msg.type === 'COMPARE_ERROR') {
        setIsComparing(false);
        sendMessage('NOTIFY', { message: `Comparison error: ${msg.error}` });
      }

      if (msg.type === 'EXPORT_ZIP_DATA_READY') {
        generateAndDownloadZip({
          isGlobal: msg.isGlobal,
          frameName: msg.frameName,
          versionsData: msg.versionsData,
          pngPreviews: msg.pngPreviews || msg.previews || {},
          svgVectors: msg.svgVectors || {}
        }).then(() => {
          sendMessage('NOTIFY', { message: 'History .zip archive downloaded!' });
        }).catch((err) => {
          console.error(err);
          sendMessage('NOTIFY', { message: 'Failed to generate zip file.' });
        });
      }
    };

    window.addEventListener('message', handleMessage);

    // Request initial state on load
    sendMessage('GET_CURRENT_SELECTION');

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [sendMessage]);

  return { 
    selection, 
    sendMessage, 
    saveVersion, 
    isSaving, 
    saveSuccess, 
    setSaveSuccess,
    runCompare,
    isComparing,
    diffResult,
    setDiffResult
  };
}
