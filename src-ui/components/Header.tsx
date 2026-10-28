import React from 'react';

interface HeaderProps {
  onLocateCanvas?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLocateCanvas }) => {
  return (
    <header className="app-header">
      <div className="brand-wrapper">
        {/* <div className="brand-icon">Δ</div> */}
        <span className="brand-title">DeltaLog</span>
      </div>
      <button 
        className="header-btn" 
        onClick={onLocateCanvas}
        title="Locate on Canvas"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="22" y1="12" x2="18" y2="12" />
          <line x1="6" y1="12" x2="2" y2="12" />
          <line x1="12" y1="6" x2="12" y2="2" />
          <line x1="12" y1="22" x2="12" y2="18" />
        </svg>
      </button>
    </header>
  );
};
