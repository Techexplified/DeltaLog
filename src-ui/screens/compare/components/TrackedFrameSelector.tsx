import React from 'react';
import { Frame, ChevronDown } from 'lucide-react';
import { TrackedFrameItem } from '../../../types';

interface TrackedFrameSelectorProps {
  currentFrameId?: string;
  trackedFrames: TrackedFrameItem[];
  onSelectFrame: (frameId: string) => void;
}

export const TrackedFrameSelector: React.FC<TrackedFrameSelectorProps> = ({
  currentFrameId,
  trackedFrames,
  onSelectFrame
}) => {
  return (
    <div className="tracked-frame-selector-wrapper">
      <div className="selector-label-row">
        <span className="selector-title">
          <Frame size={13} strokeWidth={2.2} style={{ marginRight: '5px', verticalAlign: '-2px', color: 'var(--blue-light)' }} />
          Frame
        </span>
        <span className="selector-count">{trackedFrames.length} tracked</span>
      </div>
      <div className="select-dropdown-container">
        <select
          className="custom-select"
          value={currentFrameId || ''}
          onChange={(e) => {
            if (e.target.value) {
              onSelectFrame(e.target.value);
            }
          }}
        >
          <option value="" disabled>
            Choose a tracked frame...
          </option>
          {trackedFrames.map((frame) => (
            <option key={frame.id} value={frame.id}>
              {frame.name} ({frame.versionsCount} {frame.versionsCount === 1 ? 'version' : 'versions'})
            </option>
          ))}
        </select>
        <div className="select-arrow-icon">
          <ChevronDown size={13} strokeWidth={2.2} />
        </div>
      </div>
    </div>
  );
};
