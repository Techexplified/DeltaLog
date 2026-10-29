import React from 'react';
import { SelectionData } from '../../../types';

interface FrameCardProps {
  selection: SelectionData;
  onSaveVersion: () => void;
  onCheckHistory: () => void;
}

export const FrameCard: React.FC<FrameCardProps> = ({ 
  selection, 
  onSaveVersion, 
  onCheckHistory 
}) => {
  return (
    <div className="frame-card">
      <div className="frame-card-header">
        <span className="frame-card-badge">
          {selection.hasSavedVersion ? `Tracked · ${selection.latestVersion || 'Saved'}` : 'Current Selection'}
        </span>
        <span style={{ color: 'var(--green-status)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span className="status-dot" /> Ready
        </span>
      </div>

      <div className="frame-card-content">
        <div className="frame-thumbnail-preview">
          {selection.thumbnail ? (
            <img src={selection.thumbnail} alt={selection.name} />
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: '#64748b' }}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="frame-card-title">{selection.name || 'Untitled Frame'}</div>
          <div className="frame-card-meta">
            <span className="meta-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
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
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
        <button className="btn btn-primary" onClick={onSaveVersion}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {selection.hasSavedVersion ? 'Save new version' : 'Save as v1.0.0 (Base version)'}
        </button>

        {selection.hasSavedVersion && (
          <button className="btn btn-secondary" onClick={onCheckHistory}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Check Frame History ({selection.versionsCount || 1})
          </button>
        )}
      </div>
    </div>
  );
};
