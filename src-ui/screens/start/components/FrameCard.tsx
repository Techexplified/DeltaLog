import React from 'react';
import { SelectionData } from '../../../types';

interface FrameCardProps {
  selection: SelectionData;
  onSaveVersion: () => void;
}

export const FrameCard: React.FC<FrameCardProps> = ({ selection, onSaveVersion }) => {
  return (
    <div className="frame-card">
      <div className="frame-card-header">
        <span className="frame-card-badge">Current Selection</span>
        <span style={{ color: 'var(--green-status)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span className="status-dot" /> Ready
        </span>
      </div>

      <div>
        <div className="frame-card-title">{selection.name || 'Untitled Frame'}</div>
        <div className="frame-card-meta">
          <span className="meta-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            </svg>
            {selection.w} × {selection.h}
          </span>
          <span>•</span>
          <span className="meta-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            {selection.layerCount} layers
          </span>
        </div>
      </div>

      <button className="btn btn-primary" onClick={onSaveVersion} style={{ marginTop: '4px' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        {selection.hasSavedVersion ? 'Save new version' : 'Save as v1.0.0 (Base version)'}
      </button>
    </div>
  );
};
