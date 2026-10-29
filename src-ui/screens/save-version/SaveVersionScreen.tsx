import React, { useState } from 'react';
import { SelectionData, VersionBump, SaveVersionPayload } from '../../types';

interface SaveVersionScreenProps {
  selection: SelectionData;
  isSaving: boolean;
  onBack: () => void;
  onSave: (payload: SaveVersionPayload) => void;
}

export const SaveVersionScreen: React.FC<SaveVersionScreenProps> = ({
  selection,
  isSaving,
  onBack,
  onSave
}) => {
  const isBaseVersion = !selection.hasSavedVersion;

  // Compute version options from latestVersion
  const latest = selection.latestVersion || '1.0.0';
  const parts = latest.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  const curMaj = parts[0] ?? 1;
  const curMin = parts[1] ?? 0;
  const curPat = parts[2] ?? 0;

  const versionOptions: Record<VersionBump, string> = {
    major: `v${curMaj + 1}.0.0`,
    minor: `v${curMaj}.${curMin + 1}.0`,
    patch: `v${curMaj}.${curMin}.${curPat + 1}`
  };

  const [selectedBump, setSelectedBump] = useState<VersionBump>('minor');
  const [note, setNote] = useState('');
  const [keepFullCopy, setKeepFullCopy] = useState(true);
  const [compareAfter, setCompareAfter] = useState(true);

  const finalVersion = isBaseVersion ? 'v1.0.0' : versionOptions[selectedBump];

  // Rough estimation of snapshot size based on layer count
  const estimatedSizeKb = Math.max(8, Math.round(((selection.layerCount || 10) * 0.45) * 10) / 10);
  const isOverLimit = estimatedSizeKb >= 100;
  const progressPercent = Math.min(100, Math.round((estimatedSizeKb / 100) * 100));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selection.id || isSaving) return;

    onSave({
      frameId: selection.id,
      version: finalVersion,
      label: isBaseVersion ? 'base' : selectedBump,
      note: note.trim(),
      keepFullCopy,
      compareAfter: isBaseVersion ? false : compareAfter
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top Header */}
      <div className="screen-header">
        <button className="back-btn" onClick={onBack} title="Back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <span className="screen-title">Save version</span>
      </div>

      <div className="main-content" style={{ gap: '14px' }}>
        {/* Preview Card */}
        <div className="save-preview-card">
          <div className="preview-phone-graphic">
            {selection.thumbnail ? (
              <img src={selection.thumbnail} alt={selection.name} />
            ) : (
              <>
                <div className="screen-notch" />
                <div className="badge-check">✓</div>
                <div className="screen-line active" />
                <div className="screen-line" />
              </>
            )}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
              Preview: {selection.name || 'Frame'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {selection.w} × {selection.h} · {selection.layerCount} layers
            </div>
          </div>
        </div>

        {/* Version Label Selector */}
        <div className="version-label-section">
          <div className="form-label">Version label</div>
          {isBaseVersion ? (
            <div style={{ 
              background: 'rgba(59, 130, 246, 0.12)', 
              border: '1px solid rgba(59, 130, 246, 0.3)', 
              borderRadius: '8px', 
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>v1.0.0 (Base version)</span>
              <span style={{ fontSize: '11px', color: 'var(--blue-light)' }}>First snapshot</span>
            </div>
          ) : (
            <>
              <div className="version-pill-group">
                {(['major', 'minor', 'patch'] as VersionBump[]).map((bump) => (
                  <button
                    key={bump}
                    type="button"
                    className={`version-pill ${selectedBump === bump ? 'active' : ''}`}
                    onClick={() => setSelectedBump(bump)}
                  >
                    {bump.charAt(0).toUpperCase() + bump.slice(1)}
                    {selectedBump === bump && ' ✓'}
                  </button>
                ))}
              </div>
              <div className="form-helper">
                Suggested: {selectedBump.charAt(0).toUpperCase() + selectedBump.slice(1)} · changes since {selection.latestVersion || 'v1.0.0'}
              </div>
            </>
          )}
        </div>

        {/* Change Note */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div className="form-label">Change note (optional)</div>
          <textarea
            className="form-textarea"
            placeholder='e.g. "New CTA colour + copy update"'
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {/* Checkbox: Keep Full Copy */}
        <div 
          className="checkbox-row"
          onClick={() => setKeepFullCopy(!keepFullCopy)}
        >
          <div className={`checkbox-box ${keepFullCopy ? 'checked' : ''}`}>
            {keepFullCopy && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          <div className="checkbox-content">
            <span className="checkbox-title">Keep a full copy (milestone)</span>
            <span className="checkbox-desc">
              Exact restore later. Adds a hidden frame to a Snapshots page, so the file gets heavier.
            </span>
          </div>
        </div>

        {/* Checkbox: Compare with previous after saving (ONLY IF PREVIOUS VERSION EXISTS) */}
        {!isBaseVersion && (
          <div 
            className="checkbox-row"
            onClick={() => setCompareAfter(!compareAfter)}
          >
            <div className={`checkbox-box ${compareAfter ? 'checked' : ''}`}>
              {compareAfter && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <div className="checkbox-content">
              <span className="checkbox-title">Compare with previous after saving</span>
            </div>
          </div>
        )}

        {/* Storage Bar Card */}
        <div className="storage-card">
          <div className="storage-title">Saved in this file · shared with team</div>
          <div className="storage-bar-track">
            <div 
              className={`storage-bar-fill ${isOverLimit ? 'danger' : ''}`} 
              style={{ width: `${progressPercent}%` }} 
            />
          </div>
          <div className="storage-subtext" style={{ color: isOverLimit ? '#f87171' : 'var(--text-muted)' }}>
            Snapshot size ~{estimatedSizeKb} kB of 100 kB limit
          </div>
          {isOverLimit && (
            <div className="storage-warning-msg">
              <span>⚠️ Snapshot exceeds Figma's 100 kB limit. Try simplifying or breaking down this large screen to save.</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px' }}>
          <button 
            className="btn btn-primary" 
            onClick={handleSubmit}
            disabled={isSaving || isOverLimit}
          >
            {isOverLimit 
              ? 'Size limit exceeded (> 100 kB)' 
              : isSaving 
                ? 'Saving snapshot...' 
                : `Save ${finalVersion}`}
          </button>
          <button 
            type="button" 
            className="btn-link" 
            onClick={onBack}
            disabled={isSaving}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
