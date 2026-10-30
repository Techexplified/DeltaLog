import React from 'react';

interface CompareSummaryMetricsProps {
  changed: number;
  added: number;
  removed: number;
}

export const CompareSummaryMetrics: React.FC<CompareSummaryMetricsProps> = ({
  changed,
  added,
  removed
}) => {
  return (
    <div className="diff-metrics-grid">
      <div className="diff-metric-card metric-changed">
        <span className="diff-metric-num">{changed}</span>
        <span className="diff-metric-label">Changed</span>
      </div>

      <div className="diff-metric-card metric-added">
        <span className="diff-metric-num">{added}</span>
        <span className="diff-metric-label">Added</span>
      </div>

      <div className="diff-metric-card metric-removed">
        <span className="diff-metric-num">{removed}</span>
        <span className="diff-metric-label">Removed</span>
      </div>
    </div>
  );
};
