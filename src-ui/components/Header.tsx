import React from 'react';
import { Crosshair } from 'lucide-react';

interface HeaderProps {
  onLocateCanvas?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLocateCanvas }) => {
  return (
    <header className="app-header">
      <div className="brand-wrapper">
        <span className="brand-title">DeltaLog</span>
      </div>
      <button 
        className="header-btn" 
        onClick={onLocateCanvas}
        title="Locate on Canvas"
      >
        <Crosshair size={15} strokeWidth={2} />
      </button>
    </header>
  );
};
