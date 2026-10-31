import React from 'react';
import { VersionIndexItem } from '../../../types';

interface HistoryVersionCardProps {
  item: VersionIndexItem;
  isLatest: boolean;
  isOldest: boolean;
  onCompare: (version: string) => void;
  onRestore: (version: string) => void;
  onDelete: (version: string) => void;
}

export const HistoryVersionCard: React.FC<HistoryVersionCardProps> = ({
  item,
  isLatest,
  isOldest,
  onCompare,
  onRestore,
  onDelete
}) => {
  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    } catch {
      return '';
    }
  };

  const labelTitle = item.label ? item.label.charAt(0).toUpperCase() + item.label.slice(1) : 'Snapshot';
  const displaySubtitle = `${formatDate(item.createdAt)} · ${item.author || 'Designer'} · ${
    item.note ? item.note : item.label === 'base' ? 'first snapshot' : `${item.layerCount || 0} layers`
  }`;

  return (
    <div className={`history-version-card ${isLatest ? 'latest' : ''}`}>
      <div className="history-card-header">
        <div className="history-card-identity">
          {/* Schematic visual icon matching wireframe */}
          <div className="mini-schematic-icon">
            <span className="schematic-bar top" />
            <span className="schematic-bar mid" />
            <span className="schematic-bar btm" />
          </div>

          <div className="history-card-titles">
            <div className="history-version-title">
              {item.version} <span className="history-label-dot">·</span> {labelTitle}
            </div>
            <div className="history-version-subtitle">{displaySubtitle}</div>
          </div>
        </div>

        <div className="history-card-badge-wrapper">
          {isLatest ? (
            <span className="history-badge latest">LATEST</span>
          ) : item.cloneNodeId ? (
            <span className="history-badge full-copy">FULL COPY</span>
          ) : (
            <span className="history-badge diff-only">DIFF ONLY</span>
          )}
        </div>
      </div>

      <div className="history-card-actions">
        {isOldest ? (
          <button
            type="button"
            className="history-btn-action disabled"
            disabled
            title="Oldest version · nothing older to compare"
          >
            Compare
          </button>
        ) : (
          <button
            type="button"
            className="history-btn-action"
            onClick={() => onCompare(item.version)}
          >
            Compare
          </button>
        )}

        {!item.cloneNodeId ? (
          <button
            type="button"
            className="history-btn-action disabled"
            disabled
            title="No visual snapshot saved for this version (diff-only)"
          >
            Restore
          </button>
        ) : (
          <button
            type="button"
            className="history-btn-action"
            onClick={() => onRestore(item.version)}
          >
            Restore
          </button>
        )}

        <button
          type="button"
          className="history-btn-action delete"
          onClick={() => onDelete(item.version)}
        >
          Delete
        </button>
      </div>
    </div>
  );
};
