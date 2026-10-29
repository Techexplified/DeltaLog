import React from 'react';
import { GitCompare, Info } from 'lucide-react';
import { SelectionData, TrackedFrameItem } from '../../../types';

interface CompareEmptyStateProps {
  selection: SelectionData;
  trackedFrames: TrackedFrameItem[];
  onGoHome: () => void;
  onGoHomeAndSave: () => void;
}

export const CompareEmptyState: React.FC<CompareEmptyStateProps> = ({
  selection,
  trackedFrames,
  onGoHome,
  onGoHomeAndSave
}) => {
  const hasGlobalTrackedFrames = trackedFrames.length > 0;
  const isUntrackedFrameSelected = selection.status === 'LOADED' && !selection.hasSavedVersion;

  // Case 1: Global zero-state (no versions saved in entire file)
  if (!hasGlobalTrackedFrames) {
    return (
      <div className="empty-card" style={{ padding: '30px 16px', gap: '12px' }}>
        <div style={{ color: 'var(--text-muted)' }}>
          <GitCompare size={36} strokeWidth={1.5} />
        </div>
        <div>
          <div className="empty-title">No Tracked Frames in File</div>
          <div className="empty-subtitle">
            DeltaLog hasn&apos;t saved any frame versions in this file yet. Select a frame and save your base version v1.0.0 on Home to begin.
          </div>
        </div>
        <button className="btn btn-primary" onClick={onGoHome} style={{ marginTop: '4px' }}>
          Go to Home tab
        </button>
      </div>
    );
  }

  // Case 2: Untracked frame is selected on canvas
  if (isUntrackedFrameSelected) {
    return (
      <div className="empty-card" style={{ borderColor: 'rgba(59, 130, 246, 0.4)', padding: '24px 16px', gap: '12px' }}>
        <div style={{ color: 'var(--blue-light)' }}>
          <Info size={32} strokeWidth={1.75} />
        </div>
        <div>
          <div className="empty-title">&ldquo;{selection.name || 'Frame'}&rdquo; Has No History</div>
          <div className="empty-subtitle">
            This frame hasn&apos;t been saved yet. Save v1.0.0 on the Home tab to track it, or pick a tracked frame from the dropdown above.
          </div>
        </div>
        <button className="btn btn-primary" onClick={onGoHomeAndSave} style={{ marginTop: '4px' }}>
          Save v1.0.0 on Home
        </button>
      </div>
    );
  }

  // Case 3: Nothing selected on canvas (or child / non-frame)
  return (
    <div className="empty-card" style={{ padding: '28px 16px' }}>
      <div className="frame-illustration">
        <div className="corner-handle handle-tl" />
        <div className="corner-handle handle-tr" />
        <div className="corner-handle handle-bl" />
        <div className="corner-handle handle-br" />
        <div className="screen-outline">
          <div className="screen-notch" />
          <div className="screen-line active" />
          <div className="screen-line" />
          <div className="screen-line" />
        </div>
      </div>
      <div className="empty-title">Select a frame to compare</div>
      <div className="empty-subtitle">
        Click a tracked frame on the canvas, or choose one from the dropdown above.
      </div>
    </div>
  );
};
