import React from 'react';
import { Image, Maximize2, Layers, Plus, History } from 'lucide-react';
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
            <Image size={20} strokeWidth={1.5} style={{ color: '#64748b' }} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="frame-card-title">{selection.name || 'Untitled Frame'}</div>
          <div className="frame-card-meta">
            <span className="meta-item">
              <Maximize2 size={11} strokeWidth={2} />
              {selection.w} × {selection.h}
            </span>
            <span>•</span>
            <span className="meta-item">
              <Layers size={11} strokeWidth={2} />
              {selection.layerCount} layers
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
        <button className="btn btn-primary" onClick={onSaveVersion}>
          <Plus size={13} strokeWidth={2.5} />
          {selection.hasSavedVersion ? 'Save new version' : 'Save as v1.0.0 (Base version)'}
        </button>

        {selection.hasSavedVersion && (
          <button className="btn btn-secondary" onClick={onCheckHistory}>
            <History size={13} strokeWidth={2} />
            Check Frame History ({selection.versionsCount || 1})
          </button>
        )}
      </div>
    </div>
  );
};
