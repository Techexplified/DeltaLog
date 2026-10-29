import { useState, useEffect, useCallback } from 'react';
import { SelectionData, PluginMessage, SaveVersionPayload, SaveSuccessData } from '../types';

export function useFigmaBridge() {
  const [selection, setSelection] = useState<SelectionData>({
    status: 'EMPTY'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<SaveSuccessData | null>(null);

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
          thumbnail: msg.id === prev.id ? prev.thumbnail : null, // preserve or reset
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
    setSaveSuccess 
  };
}
