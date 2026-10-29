import React from 'react';
import { CheckCircle2 } from 'lucide-react';
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
          <CheckCircle2 size={26} strokeWidth={2.2} />
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
