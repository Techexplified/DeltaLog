import React from 'react';
import { AlertCircle } from 'lucide-react';
import { SelectionData } from '../../../types';

interface ChildSelectedCardProps {
  selection: SelectionData;
  onSelectParent: (parentId: string) => void;
}

export const ChildSelectedCard: React.FC<ChildSelectedCardProps> = ({ selection, onSelectParent }) => {
  return (
    <div className="empty-card" style={{ borderColor: 'rgba(234, 179, 8, 0.4)' }}>
      <div style={{ color: '#eab308', marginBottom: '8px' }}>
        <AlertCircle size={28} strokeWidth={2} />
      </div>
      <div className="empty-title">Child Layer Selected</div>
      <div className="empty-subtitle" style={{ marginBottom: '12px' }}>
        You selected &ldquo;<strong>{selection.selectedNodeName || 'layer'}</strong>&rdquo; inside &ldquo;<strong>{selection.parentFrameName || 'frame'}</strong>&rdquo;.
      </div>
      {selection.parentFrameId && (
        <button 
          className="btn btn-primary"
          onClick={() => onSelectParent(selection.parentFrameId!)}
        >
          Select &ldquo;{selection.parentFrameName || 'Parent Frame'}&rdquo;
        </button>
      )}
    </div>
  );
};
