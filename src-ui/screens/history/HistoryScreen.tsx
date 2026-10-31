import React from 'react';
import { Download } from 'lucide-react';
import { SelectionData } from '../../types';
import { TrackedFrameSelector } from '../compare/components/TrackedFrameSelector';
import { CompareEmptyState } from '../compare/components/CompareEmptyState';
import { HistoryVersionCard } from './components/HistoryVersionCard';

interface HistoryScreenProps {
  selection: SelectionData;
  onSelectFrame: (frameId: string) => void;
  onGoHome: () => void;
  onGoHomeAndSave: () => void;
  onCompareVersions: (fromVersion: string, toVersion: string, frameId: string) => void;
  onRestoreVersion: (frameId: string, version: string) => void;
  onDeleteVersion: (frameId: string, version: string) => void;
  onExportFrameZip: (frameId: string) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  selection,
  onSelectFrame,
  onGoHome,
  onGoHomeAndSave,
  onCompareVersions,
  onRestoreVersion,
  onDeleteVersion,
  onExportFrameZip
}) => {
  const trackedFrames = selection.trackedFrames || [];
  const versions = selection.versions || [];
  const hasSavedVersion = selection.status === 'LOADED' && selection.hasSavedVersion && versions.length > 0;

  // Show empty state if no saved versions for this frame
  if (!hasSavedVersion) {
    return (
      <div className="main-content" style={{ gap: '14px' }}>
        {trackedFrames.length > 0 && (
          <TrackedFrameSelector
            currentFrameId={selection.id}
            trackedFrames={trackedFrames}
            onSelectFrame={onSelectFrame}
          />
        )}
        <CompareEmptyState
          selection={selection}
          trackedFrames={trackedFrames}
          onGoHome={onGoHome}
          onGoHomeAndSave={onGoHomeAndSave}
        />
      </div>
    );
  }

  // Chronological is [oldest ... latest], so reverse to display newest on top
  const displayList = [...versions].reverse();
  const latestVersion = versions[versions.length - 1]?.version;
  const oldestVersion = versions[0]?.version;

  const handleCompareClick = (targetVersion: string) => {
    if (!selection.id) return;
    const idx = versions.findIndex(v => v.version === targetVersion);
    if (idx > 0) {
      const fromVer = versions[idx - 1].version;
      onCompareVersions(fromVer, targetVersion, selection.id);
    }
  };

  return (
    <div className="main-content" style={{ gap: '12px', flex: 1, overflowY: 'auto' }}>
      {/* Top Frame Picker Dropdown */}
      <TrackedFrameSelector
        currentFrameId={selection.id}
        trackedFrames={trackedFrames}
        onSelectFrame={onSelectFrame}
      />

      {/* Frame Version Subtitle */}
      <div className="history-meta-caption">
        {versions.length} {versions.length === 1 ? 'version' : 'versions'} · stored in this file · shared with team
      </div>

      {/* Version Cards List */}
      <div className="history-cards-list">
        {displayList.map((verItem) => (
          <HistoryVersionCard
            key={verItem.version}
            item={verItem}
            isLatest={verItem.version === latestVersion}
            isOldest={verItem.version === oldestVersion}
            onCompare={handleCompareClick}
            onRestore={(ver) => selection.id && onRestoreVersion(selection.id, ver)}
            onDelete={(ver) => selection.id && onDeleteVersion(selection.id, ver)}
          />
        ))}
      </div>

      {/* Full-width prominent Export Button at bottom */}
      <button
        type="button"
        className="btn-history-export-full"
        onClick={() => selection.id && onExportFrameZip(selection.id)}
      >
        <Download size={14} strokeWidth={2.2} />
        <span>Export frame history (.zip)</span>
      </button>
    </div>
  );
};
