import React from 'react';
import { Info } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  return (
    <>
      <div className="notice-card">
        <Info size={16} strokeWidth={2} className="notice-icon" />
        <span className="notice-text">
          One frame per screen works best. Pick the top-level frame, not a layer inside it.
        </span>
      </div>

      <div className="how-it-works">
        <div className="section-heading">How it works</div>
        <div className="steps-list">
          <div className="step-row">
            <div className="step-num">1</div>
            <div className="step-desc">Select the frame you want to track</div>
          </div>
          <div className="step-row">
            <div className="step-num">2</div>
            <div className="step-desc">Save it as v1.0.0, the base version</div>
          </div>
          <div className="step-row">
            <div className="step-num">3</div>
            <div className="step-desc">Edit, save again, then compare versions</div>
          </div>
        </div>
      </div>
    </>
  );
};
