import React from 'react';

export const HowItWorks: React.FC = () => {
  return (
    <>
      <div className="notice-card">
        <svg className="notice-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
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
