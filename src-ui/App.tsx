import React, { useState, useEffect } from 'react';
import { TabId, ScreenView, SaveVersionPayload } from './types';
import { useFigmaBridge } from './hooks/useFigmaBridge';
import { Header } from './components/Header';
import { Tabs } from './components/Tabs';
import { Footer } from './components/Footer';
import { StartScreen } from './screens/start/StartScreen';
import { SaveVersionScreen } from './screens/save-version/SaveVersionScreen';
import { SuccessView } from './screens/save-version/SuccessView';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [currentView, setCurrentView] = useState<ScreenView>('home');
  
  const { 
    selection, 
    sendMessage, 
    saveVersion, 
    isSaving, 
    saveSuccess, 
    setSaveSuccess 
  } = useFigmaBridge();

  // Watch for save completion
  useEffect(() => {
    if (saveSuccess) {
      if (saveSuccess.compareAfter) {
        // Direct jump to Compare tab per user workflow!
        setActiveTab('compare');
        setCurrentView('home');
        setSaveSuccess(null);
        sendMessage('NOTIFY', { message: `Version ${saveSuccess.version} saved! Switched to Compare.` });
      } else {
        // Show beautiful success view
        setCurrentView('save-success');
      }
    }
  }, [saveSuccess, sendMessage, setSaveSuccess]);

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

  const handleOpenSaveScreen = () => {
    setCurrentView('save-version');
  };

  const handleSaveSubmit = (payload: SaveVersionPayload) => {
    saveVersion(payload);
  };

  const handleCheckHistory = () => {
    sendMessage('NOTIFY', { message: `Frame has ${selection.versionsCount || 1} saved version(s). History view coming in Step 7!` });
  };

  const handleDoneSuccess = () => {
    setCurrentView('home');
    setSaveSuccess(null);
  };

  return (
    <div className="app-container">
      {/* Hide global header/tabs when in dedicated save modal flow */}
      {currentView === 'home' && (
        <>
          <Header onLocateCanvas={handleLocateCanvas} />
          <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
        </>
      )}
      
      {currentView === 'save-version' && (
        <SaveVersionScreen
          selection={selection}
          isSaving={isSaving}
          onBack={() => setCurrentView('home')}
          onSave={handleSaveSubmit}
        />
      )}

      {currentView === 'save-success' && saveSuccess && (
        <SuccessView
          data={saveSuccess}
          onDone={handleDoneSuccess}
          onViewHistory={handleCheckHistory}
        />
      )}

      {currentView === 'home' && activeTab === 'home' && (
        <StartScreen
          selection={selection}
          onSelectParent={handleSelectParent}
          onSaveVersion={handleOpenSaveScreen}
          onCheckHistory={handleCheckHistory}
        />
      )}

      {currentView === 'home' && activeTab === 'compare' && (
        <div className="main-content" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div className="empty-subtitle">Compare screen (Step 4)</div>
        </div>
      )}

      {currentView === 'home' && activeTab === 'archive' && (
        <div className="main-content" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div className="empty-subtitle">Archive screen (Step 8)</div>
        </div>
      )}

      {currentView === 'home' && <Footer />}
    </div>
  );
};
