import React from 'react';
import { CompareMode } from '../../../types';

interface CompareModeSelectorProps {
  mode: CompareMode;
  versionsCount: number;
  onModeChange: (mode: CompareMode) => void;
  onNotify?: (message: string) => void;
}

export const CompareModeSelector: React.FC<CompareModeSelectorProps> = ({
  mode,
  versionsCount,
  onModeChange,
  onNotify
}) => {
  const handleVersionVsVersionClick = () => {
    if (versionsCount < 2) {
      if (onNotify) {
        onNotify("Version vs Version requires at least 2 saved versions. Save another version first.");
      }
      return;
    }
    onModeChange('version-vs-version');
  };

  return (
    <div className="compare-mode-toggle">
      <button
        type="button"
        className={`mode-btn ${mode === 'version-vs-version' ? 'active' : ''}`}
        onClick={handleVersionVsVersionClick}
      >
        <span>Version vs Version</span>
      </button>

      <button
        type="button"
        className={`mode-btn ${mode === 'version-vs-current' ? 'active' : ''}`}
        onClick={() => onModeChange('version-vs-current')}
      >
        <span>Version vs Current</span>
      </button>
    </div>
  );
};
