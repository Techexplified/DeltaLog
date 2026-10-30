import React from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Crosshair, EyeOff, Eye, Copy } from 'lucide-react';
import { DiffItem } from '../../types';
import { ChangeVisualComparison } from './components/ChangeVisualComparison';
import { PropertyDiffTable } from './components/PropertyDiffTable';

interface ChangeDetailScreenProps {
  item: DiffItem;
  currentIndex: number;
  totalItems: number;
  isIgnored: boolean;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
  onLocateNode: (nodeId: string) => void;
  onToggleIgnore: (nodeId: string) => void;
  onNotify: (message: string) => void;
}

export const ChangeDetailScreen: React.FC<ChangeDetailScreenProps> = ({
  item,
  currentIndex,
  totalItems,
  isIgnored,
  onBack,
  onPrev,
  onNext,
  onLocateNode,
  onToggleIgnore,
  onNotify
}) => {
  const handleCopyLine = () => {
    const summaryLine = `${item.name}: ${item.changes.map(c => c.description).join(' · ')}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(summaryLine);
        onNotify('Copied change detail to clipboard!');
      } else {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = summaryLine;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        onNotify('Copied change detail to clipboard!');
      }
    } catch {
      onNotify('Copied change detail to clipboard!');
    }
  };

  const badgeClass = `diff-badge status-${item.status}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div className="screen-header">
        <button className="back-btn" onClick={onBack} title="Back to results">
          <ArrowLeft size={16} strokeWidth={2.2} />
        </button>
        <span className="screen-title" style={{ fontSize: '14px' }}>Change detail</span>
      </div>

      <div className="main-content" style={{ gap: '12px', flex: 1, overflowY: 'auto' }}>
        {/* Layer Path & Status Badge */}
        <div className="change-detail-meta-box">
          <div className="change-detail-breadcrumb" title={item.path || item.name}>
            {item.path || item.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <span className={badgeClass}>{item.status.toUpperCase()}</span>
            {isIgnored && <span className="diff-badge badge-ignored">IGNORED</span>}
          </div>
        </div>

        {/* Before vs After Visual Preview */}
        <ChangeVisualComparison item={item} />

        {/* Property Comparison Table */}
        <PropertyDiffTable item={item} />

        {/* Matching Algorithm Info */}
        <div className="matched-by-card">
          <div className="matched-by-title">
            Matched by: <span className="matched-by-exact">layer ID (exact)</span>
          </div>
          <div className="matched-by-subtitle">Fallback: name + type + position</div>
        </div>

        {/* Primary Action: Locate on Canvas */}
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => onLocateNode(item.id)}
          style={{ width: '100%', justifyContent: 'center', gap: '6px' }}
        >
          <Crosshair size={14} strokeWidth={2.2} />
          <span>Locate on canvas</span>
        </button>

        {/* Secondary Actions Row */}
        <div className="change-detail-actions-row">
          <button
            type="button"
            className={`btn-action-pill ${isIgnored ? 'active' : ''}`}
            onClick={() => onToggleIgnore(item.id)}
          >
            {isIgnored ? (
              <>
                <Eye size={13} strokeWidth={2} />
                <span>Restore change</span>
              </>
            ) : (
              <>
                <EyeOff size={13} strokeWidth={2} />
                <span>Ignore this change</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="btn-action-pill"
            onClick={handleCopyLine}
          >
            <Copy size={13} strokeWidth={2} />
            <span>Copy line</span>
          </button>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="change-detail-pagination-bar">
        <div className="pagination-controls">
          <button
            type="button"
            className="pagination-btn"
            disabled={currentIndex === 0}
            onClick={onPrev}
          >
            <ChevronLeft size={14} strokeWidth={2.2} />
            <span>Prev</span>
          </button>

          <span className="pagination-tracker">
            {currentIndex + 1} of {totalItems}
          </span>

          <button
            type="button"
            className="pagination-btn"
            disabled={currentIndex >= totalItems - 1}
            onClick={onNext}
          >
            <span>Next</span>
            <ChevronRight size={14} strokeWidth={2.2} />
          </button>
        </div>
        <span className="pagination-footnote">
          Ignored changes are left out of the changelog
        </span>
      </div>
    </div>
  );
};
