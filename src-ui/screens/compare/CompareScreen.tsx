import React, { useState, useEffect } from 'react';
import { 
  SelectionData, 
  CompareMode, 
  CompareFilterOptions, 
  CompareRequestPayload 
} from '../../types';
import { TrackedFrameSelector } from './components/TrackedFrameSelector';
import { CompareModeSelector } from './components/CompareModeSelector';
import { CompareVersionPickers } from './components/CompareVersionPickers';
import { ComparePropertyFilters } from './components/ComparePropertyFilters';
import { CompareEmptyState } from './components/CompareEmptyState';

interface CompareScreenProps {
  selection: SelectionData;
  onSelectFrame: (frameId: string) => void;
  onGoHome: () => void;
  onGoHomeAndSave: () => void;
  onNotify?: (message: string) => void;
  onCompare: (payload: CompareRequestPayload) => void;
}

export const CompareScreen: React.FC<CompareScreenProps> = ({
  selection,
  onSelectFrame,
  onGoHome,
  onGoHomeAndSave,
  onNotify,
  onCompare
}) => {
  const trackedFrames = selection.trackedFrames || [];
  const versions = selection.versions || [];
  const versionsCount = versions.length;
  const isCurrentFrameTracked = selection.status === 'LOADED' && selection.hasSavedVersion;

  // Comparison State
  const [mode, setMode] = useState<CompareMode>('version-vs-current');
  const [fromVersion, setFromVersion] = useState<string>('');
  const [toVersion, setToVersion] = useState<string>('');
  const [filters, setFilters] = useState<CompareFilterOptions>({
    text: true,
    colour: true,
    layout: true,
    effects: true,
    visibility: true,
    layerNames: false
  });

  // Automatically update pickers when frame or versions change
  useEffect(() => {
    if (versions.length > 0) {
      const oldest = versions[0].version;
      const latest = versions[versions.length - 1].version;

      setFromVersion(oldest);
      setToVersion(latest);

      // If only 1 version exists, automatically lock to version-vs-current
      if (versions.length < 2) {
        setMode('version-vs-current');
      }
    }
  }, [selection.id, selection.versionsCount]);

  const handleSwap = () => {
    setFromVersion(toVersion);
    setToVersion(fromVersion);
  };

  const handleQuickCompareLatest = () => {
    setMode('version-vs-current');
    if (versions.length > 0) {
      setFromVersion(versions[versions.length - 1].version);
    }
  };

  const handleFilterToggle = (key: keyof CompareFilterOptions) => {
    setFilters(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleCompareClick = () => {
    if (!selection.id) return;

    onCompare({
      frameId: selection.id,
      mode,
      fromVersion,
      toVersion: mode === 'version-vs-current' ? 'current' : toVersion,
      filters
    });
  };

  return (
    <div className="main-content" style={{ gap: '14px' }}>
      {/* 1. Top Tracked Frame Switcher Dropdown */}
      {trackedFrames.length > 0 && (
        <TrackedFrameSelector
          currentFrameId={isCurrentFrameTracked ? selection.id : undefined}
          trackedFrames={trackedFrames}
          onSelectFrame={onSelectFrame}
        />
      )}

      {/* 2. Content: Either Active Comparison or Empty/Untracked Notice */}
      {!isCurrentFrameTracked ? (
        <CompareEmptyState
          selection={selection}
          trackedFrames={trackedFrames}
          onGoHome={onGoHome}
          onGoHomeAndSave={onGoHomeAndSave}
        />
      ) : (
        <>
          {/* Mode Selector */}
          <CompareModeSelector
            mode={mode}
            versionsCount={versionsCount}
            onModeChange={setMode}
            onNotify={onNotify}
          />

          {/* Version Pickers */}
          <CompareVersionPickers
            mode={mode}
            versions={versions}
            fromVersion={fromVersion}
            toVersion={toVersion}
            onFromChange={setFromVersion}
            onToChange={setToVersion}
            onSwap={handleSwap}
            onQuickCompareLatest={handleQuickCompareLatest}
          />

          {/* Change Types Filter Checkboxes */}
          <ComparePropertyFilters
            filters={filters}
            onChange={handleFilterToggle}
          />

          {/* Compare Button */}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '6px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCompareClick}
              disabled={mode === 'version-vs-version' && fromVersion === toVersion}
            >
              Compare
            </button>
            <div className="compare-footer-note">
              <span>Layers are matched by ID, then by name + position</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
