import React from 'react';
import { TabId } from '../types';

interface TabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const Tabs: React.FC<TabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="tabs-nav">
      <button 
        className={`tab-btn ${activeTab === 'compare' ? 'active' : ''}`}
        onClick={() => onTabChange('compare')}
      >
        Compare
      </button>
      <button 
        className={`tab-btn ${activeTab === 'home' ? 'active' : ''}`}
        onClick={() => onTabChange('home')}
      >
        Home
      </button>
      <button 
        className={`tab-btn ${activeTab === 'archive' ? 'active' : ''}`}
        onClick={() => onTabChange('archive')}
      >
        Archive
      </button>
    </nav>
  );
};
