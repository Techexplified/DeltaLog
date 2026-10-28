import React from 'react';
import { SelectionData } from '../../../types';

interface ChildSelectedCardProps {
  selection: SelectionData;
  onSelectParent: (parentId: string) => void;
}

export const ChildSelectedCard: React.FC<ChildSelectedCardProps> = ({ selection, onSelectParent }) => {
  return (
    <div className="empty-card" style={{ borderColor: 'rgba(234, 179, 8, 0.4)' }}>
      <div style={{ color: '#eab308', marginBottom: '8px' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
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
