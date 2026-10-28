import { useState, useEffect, useCallback } from 'react';
import { SelectionData, PluginMessage } from '../types';

export function useFigmaBridge() {
  const [selection, setSelection] = useState<SelectionData>({
    status: 'EMPTY'
  });

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

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg: PluginMessage = event.data?.pluginMessage;
      if (!msg) return;

      if (msg.type === 'selection-update') {
        setSelection({
          status: msg.status || 'EMPTY',
          id: msg.id,
          name: msg.name,
          w: msg.w,
          h: msg.h,
          layerCount: msg.layerCount,
          hasSavedVersion: msg.hasSavedVersion,
          selectedNodeName: msg.selectedNodeName,
          parentFrameId: msg.parentFrameId,
          parentFrameName: msg.parentFrameName,
          message: msg.message
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

  return { selection, sendMessage };
}
