import React from 'react';
import { Copy, Ban } from 'lucide-react';
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
            <Copy size={28} strokeWidth={2} />
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
            <Ban size={28} strokeWidth={2} />
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
