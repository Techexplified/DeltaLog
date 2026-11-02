import React from 'react';
import { X, ShieldCheck, AlertTriangle, Layers, ArrowRight, Loader2, HardDrive } from 'lucide-react';
import { ParsedImportData } from '../types';

interface ImportConfirmModalProps {
  isOpen: boolean;
  isValidating: boolean;
  error: string | null;
  parsedData: ParsedImportData | null;
  currentVersionsCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ImportConfirmModal: React.FC<ImportConfirmModalProps> = ({
  isOpen,
  isValidating,
  error,
  parsedData,
  currentVersionsCount,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const totalCapacity = 10;
  const incomingCount = parsedData?.incomingCount || 0;
  const resultingCount = currentVersionsCount + incomingCount;
  const slotsRemainingAfter = Math.max(0, totalCapacity - resultingCount);

  return (
    <div className="import-modal-backdrop" onClick={onCancel}>
      <div className="import-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="import-modal-header">
          <div className="import-modal-title">Import Backup (.zip)</div>
          <button className="import-modal-close" onClick={onCancel} title="Close">
            <X size={15} strokeWidth={2.2} />
          </button>
        </div>

        {/* 1. Loading / Validating State */}
        {isValidating && (
          <div className="import-modal-status-box">
            <Loader2 size={24} className="spin-icon" style={{ color: 'var(--blue-primary)' }} />
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Verifying backup package...
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
              Checking archive integrity, DeltaLog signature, vector assets, and storage quota.
            </div>
          </div>
        )}

        {/* 2. Error State */}
        {!isValidating && error && (
          <div className="import-modal-error-box">
            <div className="import-error-icon">
              <AlertTriangle size={24} strokeWidth={2.2} />
            </div>
            <div className="import-error-title">Cannot Import Backup</div>
            <div className="import-error-message">{error}</div>
            <div style={{ width: '100%', marginTop: '12px' }}>
              <button className="btn btn-secondary" onClick={onCancel}>
                Close
              </button>
            </div>
          </div>
        )}

        {/* 3. Verified Success Preview */}
        {!isValidating && !error && parsedData && (
          <div className="import-modal-body">
            {/* Verification Shield Banner */}
            <div className="import-verified-banner">
              <ShieldCheck size={16} strokeWidth={2.2} style={{ color: '#16a34a', flexShrink: 0 }} />
              <span>
                {parsedData.frames && parsedData.frames.length > 1
                  ? `Verified DeltaLog package · Full document backup (${parsedData.frames.length} screens)`
                  : 'Verified DeltaLog package · Complete vector & timeline data'}
              </span>
            </div>

            {/* Frame(s) Preview Card or Multi-Frame List */}
            {parsedData.frames && parsedData.frames.length > 1 ? (
              <div className="import-preview-frames-list">
                {parsedData.frames.map((frame, idx) => (
                  <div key={idx} className="import-preview-frame-card" style={{ padding: '8px 10px' }}>
                    <div className="import-preview-thumb" style={{ width: '38px', height: '38px' }}>
                      {frame.latestPngBase64 ? (
                        <img src={frame.latestPngBase64} alt={frame.frameName} />
                      ) : (
                        <Layers size={18} strokeWidth={1.8} style={{ color: 'var(--text-muted)' }} />
                      )}
                    </div>
                    <div className="import-preview-details">
                      <div className="import-preview-name">{frame.frameName}</div>
                      <div className="import-preview-ver-row">
                        <span className="import-badge-pill">
                          {frame.versions.length} {frame.versions.length === 1 ? 'version' : 'versions'}
                        </span>
                        <span className="import-badge-sub">Latest: {frame.latestVersion}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="import-preview-frame-card">
                <div className="import-preview-thumb">
                  {parsedData.latestPngBase64 ? (
                    <img src={parsedData.latestPngBase64} alt={parsedData.frameName} />
                  ) : (
                    <Layers size={22} strokeWidth={1.8} style={{ color: 'var(--text-muted)' }} />
                  )}
                </div>

                <div className="import-preview-details">
                  <div className="import-preview-name">{parsedData.frameName}</div>
                  <div className="import-preview-ver-row">
                    <span className="import-badge-pill">{incomingCount} {incomingCount === 1 ? 'version' : 'versions'}</span>
                    <span className="import-badge-sub">Latest: {parsedData.latestVersion}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Storage Quota Impact */}
            <div className="import-quota-card">
              <div className="import-quota-header">
                <span className="import-quota-title">
                  <HardDrive size={13} strokeWidth={2.2} style={{ marginRight: '5px', verticalAlign: '-1px', color: 'var(--blue-light)' }} />
                  Storage Impact
                </span>
                <span className="import-quota-stats">
                  {resultingCount} of {totalCapacity} versions
                </span>
              </div>

              <div className="import-quota-bar-bg">
                <div
                  className="import-quota-bar-fill"
                  style={{ width: `${Math.min(100, Math.max(10, (resultingCount / totalCapacity) * 100))}%` }}
                />
              </div>

              <div className="import-quota-caption">
                Will use {incomingCount} {incomingCount === 1 ? 'slot' : 'slots'}
                {parsedData.frames && parsedData.frames.length > 1 ? ` across ${parsedData.frames.length} screens` : ''} ({slotsRemainingAfter} remaining in this file).
              </div>
            </div>

            {/* Placement Footnote */}
            <div className="import-placement-note">
              {parsedData.frames && parsedData.frames.length > 1 ? (
                <>The latest version of each screen will be inserted on your canvas side-by-side. Older milestone copies remain stored on the hidden snapshots page.</>
              ) : (
                <>Only the latest version (<strong>{parsedData.latestVersion}</strong>) is inserted on your canvas as an editable frame. Older milestone copies remain stored on the hidden snapshots page.</>
              )}
            </div>

            {/* Action Buttons */}
            <div className="import-modal-actions">
              <button className="btn btn-secondary" onClick={onCancel}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={onConfirm}>
                {parsedData.frames && parsedData.frames.length > 1
                  ? `Import ${parsedData.frames.length} Screens to Canvas`
                  : 'Import to Canvas'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
