import React, { useState } from 'react';
import { TabId } from './types';
import { useFigmaBridge } from './hooks/useFigmaBridge';
import { Header } from './components/Header';
import { Tabs } from './components/Tabs';
import { Footer } from './components/Footer';
import { StartScreen } from './screens/start/StartScreen';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const { selection, sendMessage } = useFigmaBridge();

  const handleLocateCanvas = () => {
    if (selection.id) {
      sendMessage('SELECT_FRAME', { id: selection.id });
    } else {
      sendMessage('NOTIFY', { message: 'Select a frame on canvas first' });
    }
  };

  const handleSelectParent = (parentId: string) => {
    sendMessage('SELECT_FRAME', { id: parentId });
  };

  const handleSaveVersion = () => {
    sendMessage('NOTIFY', { message: 'Version saving ready for Step 2!' });
  };

  return (
    <div className="app-container">
      <Header onLocateCanvas={handleLocateCanvas} />
      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      {activeTab === 'home' && (
        <StartScreen
          selection={selection}
          onSelectParent={handleSelectParent}
          onSaveVersion={handleSaveVersion}
        />
      )}

      {activeTab === 'compare' && (
        <div className="main-content" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div className="empty-subtitle">Compare screen (Step 4)</div>
        </div>
      )}

      {activeTab === 'archive' && (
        <div className="main-content" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div className="empty-subtitle">Archive screen (Step 8)</div>
        </div>
      )}

      <Footer />
    </div>
  );
};
