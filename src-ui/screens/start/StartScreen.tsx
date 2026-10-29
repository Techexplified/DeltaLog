import React from 'react';
import { SelectionData } from '../../types';
import { EmptyCard } from './components/EmptyCard';
import { FrameCard } from './components/FrameCard';
import { ChildSelectedCard } from './components/ChildSelectedCard';
import { HowItWorks } from './components/HowItWorks';

interface StartScreenProps {
  selection: SelectionData;
  onSelectParent: (parentId: string) => void;
  onSaveVersion: () => void;
  onCheckHistory: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  selection,
  onSelectParent,
  onSaveVersion,
  onCheckHistory
}) => {
  return (
    <div className="main-content">
      {selection.status === 'LOADED' && (
        <FrameCard 
          selection={selection} 
          onSaveVersion={onSaveVersion} 
          onCheckHistory={onCheckHistory}
        />
      )}

      {selection.status === 'CHILD_SELECTED' && (
        <ChildSelectedCard selection={selection} onSelectParent={onSelectParent} />
      )}

      {selection.status === 'MULTIPLE' && (
        <div className="empty-card" style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}>
          <div style={{ color: '#ef4444', marginBottom: '8px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="14" height="14" rx="2" />
              <path d="M18 17h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v2" />
            </svg>
          </div>
          <div className="empty-title">Multiple Items Selected</div>
          <div className="empty-subtitle">
            DeltaLog tracks one screen at a time. Please select a single top-level frame.
          </div>
        </div>
      )}

      {selection.status === 'NOT_FRAME' && (
        <div className="empty-card">
          <div style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </div>
          <div className="empty-title">Not a Frame</div>
          <div className="empty-subtitle">
            The selected element is not a frame or component. Pick a screen frame to track.
          </div>
        </div>
      )}

      {selection.status === 'EMPTY' && (
        <EmptyCard />
      )}

      <HowItWorks />
    </div>
  );
};
