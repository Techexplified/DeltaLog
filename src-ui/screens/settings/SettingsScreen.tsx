import React, { useState } from 'react';
import { ArrowLeft, HardDrive, Download, Trash2, AlertTriangle } from 'lucide-react';
import { SelectionData } from '../../types';

interface SettingsScreenProps {
  selection: SelectionData;
  onBack: () => void;
  onNotify: (message: string) => void;
  onClearAllHistory: () => void;
  onRequestExportZip: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  selection,
  onBack,
  onNotify,
  onClearAllHistory,
  onRequestExportZip
}) => {
  const [keepSnapshots, setKeepSnapshots] = useState(true);
  const [autoPrune, setAutoPrune] = useState(true);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const trackedFrames = selection.trackedFrames || [];
  const totalVersions = trackedFrames.reduce((acc, f) => acc + (f.versionsCount || 0), 0);
  const totalFrames = trackedFrames.length;

  const handleClearConfirmed = () => {
    onClearAllHistory();
    setConfirmClearAll(false);
  };

  return (
    <div className="changelog-screen-container">
      {/* Top Header */}
      <div className="screen-header">
        <button className="back-btn" onClick={onBack} title="Back">
          <ArrowLeft size={16} strokeWidth={2.2} />
        </button>
        <span className="screen-title">Settings</span>
      </div>

      <div className="main-content" style={{ gap: '14px', flex: 1, overflowY: 'auto' }}>
        {/* SUBSECTION 1: STORAGE */}
        <div className="settings-section">
          <div className="settings-section-heading">Storage</div>

          {/* Storage in this file Card */}
          <div className="settings-card">
            <div className="settings-card-header">
              <span className="settings-card-title">
                <HardDrive size={13} strokeWidth={2.2} style={{ marginRight: '6px', verticalAlign: '-1px', color: '#60a5fa' }} />
                Storage in this file
              </span>
              <span className="settings-card-count">
                {totalVersions} versions · {totalFrames} {totalFrames === 1 ? 'frame' : 'frames'}
              </span>
            </div>

            <div className="settings-progress-bar-bg">
              <div
                className="settings-progress-bar-fill"
                style={{ width: `${Math.min(100, Math.max(10, (totalVersions / 10) * 100))}%` }}
              />
            </div>

            <div className="settings-card-caption">
              {totalVersions} of 10 versions in file · Stored directly inside this Figma file.
            </div>
          </div>

          {/* Visual Snapshots Toggle */}
          <div className="settings-card" style={{ marginTop: '8px' }}>
            <label className="settings-checkbox-row">
              <input
                type="checkbox"
                checked={keepSnapshots}
                onChange={(e) => setKeepSnapshots(e.target.checked)}
                className="custom-checkbox-input"
              />
              <div className="settings-checkbox-text">
                <span className="settings-checkbox-title">Keep visual snapshots</span>
                <span className="settings-checkbox-desc">
                  Heavier file, but enables exact 1-click restore of every version onto the canvas.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* SUBSECTION 2: MAINTENANCE */}
        <div className="settings-section">
          <div className="settings-section-heading">Maintenance</div>

          <div className="settings-card" style={{ gap: '10px' }}>
            <label className="settings-checkbox-row">
              <input
                type="checkbox"
                checked={autoPrune}
                onChange={(e) => setAutoPrune(e.target.checked)}
                className="custom-checkbox-input"
              />
              <div className="settings-checkbox-text">
                <span className="settings-checkbox-title">Auto-prune oldest versions</span>
                <span className="settings-checkbox-desc">
                  Keep file lightweight by automatically pruning oldest versions when the 10-version cap is reached.
                </span>
              </div>
            </label>

            {!confirmClearAll ? (
              <button
                type="button"
                className="settings-action-btn danger"
                onClick={() => setConfirmClearAll(true)}
                style={{ marginTop: '4px' }}
              >
                <Trash2 size={14} strokeWidth={2} />
                <span>Clear all history in this file...</span>
              </button>
            ) : (
              <div className="settings-confirm-box">
                <div className="settings-confirm-text">
                  <AlertTriangle size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
                  <span>Wipe all versions, snapshots &amp; history in this document?</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button
                    type="button"
                    className="settings-action-btn"
                    style={{ flex: 1 }}
                    onClick={() => setConfirmClearAll(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="settings-action-btn danger-confirm"
                    style={{ flex: 1 }}
                    onClick={handleClearConfirmed}
                  >
                    Yes, delete all
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SUBSECTION 3: EXPORT */}
        <div className="settings-section">
          <div className="settings-section-heading">Export</div>

          <div className="settings-card" style={{ gap: '10px' }}>
            <span className="settings-checkbox-desc">
              Export complete file backup archive (.zip) containing metadata JSON and PNG visual snapshots for all tracked frames.
            </span>

            <button
              type="button"
              className="settings-action-btn primary"
              onClick={onRequestExportZip}
            >
              <Download size={14} strokeWidth={2} />
              <span>Export file backup (.zip)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
