import React from 'react';

export const EmptyCard: React.FC = () => {
  return (
    <div className="empty-card">
      <div className="frame-illustration">
        <div className="corner-handle handle-tl" />
        <div className="corner-handle handle-tr" />
        <div className="corner-handle handle-bl" />
        <div className="corner-handle handle-br" />
        <div className="screen-outline">
          <div className="screen-notch" />
          <div className="screen-line active" />
          <div className="screen-line" />
          <div className="screen-line" />
        </div>
      </div>
      <div className="empty-title">Track Canvas Frame</div>
      <div className="empty-subtitle">
        Click any screen frame on the canvas to start tracking versions.
      </div>
    </div>
  );
};
