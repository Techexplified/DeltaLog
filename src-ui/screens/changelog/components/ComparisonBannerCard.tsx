import React from 'react';
import { ArrowRight } from 'lucide-react';

interface ComparisonBannerCardProps {
  fromVersion: string;
  toVersion: string;
}

export const ComparisonBannerCard: React.FC<ComparisonBannerCardProps> = ({
  fromVersion,
  toVersion
}) => {
  const isCurrent = toVersion.toLowerCase() === 'current';

  return (
    <div className="comparison-banner-card">
      <div className="banner-subtitle">Comparing versions</div>
      <div className="banner-versions-row">
        <span className="version-pill from-pill">{fromVersion}</span>
        <ArrowRight size={14} className="version-arrow" strokeWidth={2.2} />
        <span className={`version-pill to-pill ${isCurrent ? 'current' : ''}`}>
          {toVersion}
        </span>
      </div>
    </div>
  );
};
