import React from 'react';
import { ArrowRight, Image as ImageIcon } from 'lucide-react';

interface SideBySidePreviewProps {
  fromVersion: string;
  toVersion: string;
  fromThumbnail?: string | null;
  toThumbnail?: string | null;
}

export const SideBySidePreview: React.FC<SideBySidePreviewProps> = ({
  fromVersion,
  toVersion,
  fromThumbnail,
  toThumbnail
}) => {
  return (
    <div className="side-by-side-card">
      {/* Before Column */}
      <div className="side-preview-column">
        <div className="side-preview-header">
          <span className="side-tag before">Before</span>
          <span className="side-ver">{fromVersion}</span>
        </div>
        <div className="side-preview-box">
          {fromThumbnail ? (
            <img src={fromThumbnail} alt={fromVersion} />
          ) : (
            <div className="side-placeholder">
              <ImageIcon size={18} strokeWidth={1.5} style={{ opacity: 0.4 }} />
              <span>Snapshot</span>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="side-preview-divider">
        <div className="divider-line" />
        <div className="divider-icon">
          <ArrowRight size={12} strokeWidth={2.2} />
        </div>
        <div className="divider-line" />
      </div>

      {/* After Column */}
      <div className="side-preview-column">
        <div className="side-preview-header">
          <span className="side-tag after">After</span>
          <span className="side-ver">{toVersion}</span>
        </div>
        <div className="side-preview-box">
          {toThumbnail ? (
            <img src={toThumbnail} alt={toVersion} />
          ) : (
            <div className="side-placeholder">
              <ImageIcon size={18} strokeWidth={1.5} style={{ opacity: 0.4 }} />
              <span>Preview</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
