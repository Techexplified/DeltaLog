import React from 'react';
import { ArrowUpDown, ChevronDown } from 'lucide-react';
import { CompareMode, VersionIndexItem } from '../../../types';

interface CompareVersionPickersProps {
  mode: CompareMode;
  versions: VersionIndexItem[];
  fromVersion: string;
  toVersion: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onSwap: () => void;
  onQuickCompareLatest: () => void;
}

export const CompareVersionPickers: React.FC<CompareVersionPickersProps> = ({
  mode,
  versions,
  fromVersion,
  toVersion,
  onFromChange,
  onToChange,
  onSwap,
  onQuickCompareLatest
}) => {
  // Format date helper (e.g. "29 Oct")
  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <div className="version-pickers-section">
      {/* From */}
      <div className="picker-field">
        <label className="picker-label">From</label>
        <div className="select-dropdown-container">
          <select
            className="custom-select"
            value={fromVersion}
            onChange={(e) => onFromChange(e.target.value)}
          >
            {versions.map((ver, idx) => (
              <option key={ver.version} value={ver.version}>
                {ver.version} · {formatDate(ver.createdAt)} · {ver.author}
                {idx === 0 ? ' (base)' : ''}
              </option>
            ))}
          </select>
          <div className="select-arrow-icon">
            <ChevronDown size={13} strokeWidth={2.2} />
          </div>
        </div>
      </div>

      {/* Swap Button (only in version vs version mode) */}
      {mode === 'version-vs-version' && (
        <div className="swap-button-row">
          <button type="button" className="swap-btn" onClick={onSwap} title="Swap From and To">
            <ArrowUpDown size={12} strokeWidth={2.2} />
            <span>swap</span>
          </button>
        </div>
      )}

      {/* To */}
      <div className="picker-field">
        <label className="picker-label">To</label>
        {mode === 'version-vs-version' ? (
          <div className="select-dropdown-container">
            <select
              className="custom-select"
              value={toVersion}
              onChange={(e) => onToChange(e.target.value)}
            >
              {versions.map((ver, idx) => (
                <option key={ver.version} value={ver.version}>
                  {ver.version} · {formatDate(ver.createdAt)} · {ver.author}
                  {idx === versions.length - 1 ? ' (latest)' : ''}
                </option>
              ))}
            </select>
            <div className="select-arrow-icon">
              <ChevronDown size={13} strokeWidth={2.2} />
            </div>
          </div>
        ) : (
          <div className="current-frame-locked-box">
            <span className="live-dot" />
            <span className="current-title">Current frame (live on canvas)</span>
          </div>
        )}
      </div>

      {/* Quick helper link */}
      {mode === 'version-vs-version' && (
        <button
          type="button"
          className="quick-compare-link"
          onClick={onQuickCompareLatest}
        >
          Quick: compare my current selection with latest saved
        </button>
      )}
    </div>
  );
};
