import React from 'react';
import { Crosshair, Settings, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  onLocateCanvas?: () => void;
  onOpenSettings?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onLocateCanvas, 
  onOpenSettings,
  theme = 'dark',
  onToggleTheme 
}) => {
  return (
    <header className="app-header">
      <div className="brand-wrapper">
        <span className="brand-title">DeltaLog</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button 
          className="header-btn" 
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light theme' : 'Switch to Dark theme'}
        >
          {theme === 'dark' ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
        </button>
        <button 
          className="header-btn" 
          onClick={onLocateCanvas}
          title="Locate on Canvas"
        >
          <Crosshair size={15} strokeWidth={2} />
        </button>
        <button 
          className="header-btn" 
          onClick={onOpenSettings}
          title="Settings & Storage"
        >
          <Settings size={15} strokeWidth={2} />
        </button>
      </div>
    </header>
  );
};
