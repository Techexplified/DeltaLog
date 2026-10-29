import React from 'react';
import { SaveSuccessData } from '../../types';

interface SuccessViewProps {
  data: SaveSuccessData;
  onDone: () => void;
  onViewHistory: () => void;
}

export const SuccessView: React.FC<SuccessViewProps> = ({
  data,
  onDone,
  onViewHistory
}) => {
  return (
    <div className="main-content" style={{ justifyContent: 'center' }}>
      <div className="success-container">
        <div className="success-icon-badge">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
            Version {data.version} Saved!
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '260px' }}>
            Saved by <strong>{data.author}</strong> ({data.sizeKb} kB).<br />
            Stored directly in this file &amp; shared with your team.
          </div>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
          <button className="btn btn-primary" onClick={onDone}>
            Done
          </button>
          <button className="btn btn-secondary" onClick={onViewHistory}>
            Check Frame History ({data.versionsCount})
          </button>
        </div>
      </div>
    </div>
  );
};
