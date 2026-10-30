import React, { useState, useEffect } from 'react';
import { TabId, ScreenView, SaveVersionPayload, DiffItem } from './types';
import { useFigmaBridge } from './hooks/useFigmaBridge';
import { Header } from './components/Header';
import { Tabs } from './components/Tabs';
import { Footer } from './components/Footer';
import { StartScreen } from './screens/start/StartScreen';
import { SaveVersionScreen } from './screens/save-version/SaveVersionScreen';
import { SuccessView } from './screens/save-version/SuccessView';
import { CompareScreen } from './screens/compare/CompareScreen';
import { CompareResultsScreen } from './screens/compare-results/CompareResultsScreen';
import { ChangeDetailScreen } from './screens/change-detail/ChangeDetailScreen';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [currentView, setCurrentView] = useState<ScreenView>('home');
  const [selectedDetailIndex, setSelectedDetailIndex] = useState<number | null>(null);
  const [ignoredItemIds, setIgnoredItemIds] = useState<Set<string>>(new Set());
  
  const { 
    selection, 
    sendMessage, 
    saveVersion, 
    isSaving, 
    saveSuccess, 
    setSaveSuccess,
    runCompare,
    isComparing,
    diffResult,
    setDiffResult
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

  // Watch for diff results
  useEffect(() => {
    if (diffResult) {
      setCurrentView('compare-results');
    }
  }, [diffResult]);

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

  const handleBackFromCompareResults = () => {
    sendMessage('CLEAR_CANVAS_HIGHLIGHTS');
    setDiffResult(null);
    setSelectedDetailIndex(null);
    setCurrentView('home');
  };

  const handleSelectDetailItem = (item: DiffItem) => {
    if (!diffResult) return;
    const idx = diffResult.items.findIndex(i => i.id === item.id);
    if (idx !== -1) {
      setSelectedDetailIndex(idx);
      setCurrentView('change-detail');
    }
  };

  const handleToggleIgnore = (itemId: string) => {
    setIgnoredItemIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
        sendMessage('NOTIFY', { message: 'Change restored to changelog' });
      } else {
        next.add(itemId);
        sendMessage('NOTIFY', { message: 'Change ignored (excluded from changelog)' });
      }
      return next;
    });
  };

  const handlePrevDetail = () => {
    if (selectedDetailIndex !== null && selectedDetailIndex > 0) {
      setSelectedDetailIndex(selectedDetailIndex - 1);
    }
  };

  const handleNextDetail = () => {
    if (diffResult && selectedDetailIndex !== null && selectedDetailIndex < diffResult.items.length - 1) {
      setSelectedDetailIndex(selectedDetailIndex + 1);
    }
  };

  return (
    <div className="app-container">
      {/* Hide global header/tabs when in dedicated save modal flow or compare results */}
      {currentView === 'home' && (
        <>
          <Header onLocateCanvas={handleLocateCanvas} />
          <Tabs 
            activeTab={activeTab} 
            onTabChange={(tab) => {
              sendMessage('CLEAR_CANVAS_HIGHLIGHTS');
              setActiveTab(tab);
            }} 
          />
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

      {currentView === 'compare-results' && diffResult && (
        <CompareResultsScreen
          diff={diffResult}
          ignoredItemIds={ignoredItemIds}
          onBack={handleBackFromCompareResults}
          onToggleCanvasHighlights={(enabled) => {
            sendMessage('TOGGLE_CANVAS_HIGHLIGHTS', {
              frameId: diffResult.frameId,
              enabled,
              items: diffResult.items
            });
          }}
          onSelectDetailItem={handleSelectDetailItem}
          onViewChangelog={() => {
            sendMessage('NOTIFY', { message: 'Changelog screen is coming next!' });
          }}
        />
      )}

      {currentView === 'change-detail' && diffResult && selectedDetailIndex !== null && diffResult.items[selectedDetailIndex] && (
        <ChangeDetailScreen
          item={diffResult.items[selectedDetailIndex]}
          currentIndex={selectedDetailIndex}
          totalItems={diffResult.items.length}
          isIgnored={ignoredItemIds.has(diffResult.items[selectedDetailIndex].id)}
          onBack={() => setCurrentView('compare-results')}
          onPrev={handlePrevDetail}
          onNext={handleNextDetail}
          onLocateNode={(nodeId) => sendMessage('LOCATE_NODE', { nodeId })}
          onToggleIgnore={handleToggleIgnore}
          onNotify={(message) => sendMessage('NOTIFY', { message })}
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
        <CompareScreen
          selection={selection}
          isComparing={isComparing}
          onSelectFrame={handleSelectParent}
          onGoHome={() => setActiveTab('home')}
          onGoHomeAndSave={() => {
            setActiveTab('home');
            setCurrentView('save-version');
          }}
          onNotify={(message) => sendMessage('NOTIFY', { message })}
          onCompare={(payload) => {
            runCompare(payload);
          }}
        />
      )}

      {currentView === 'home' && activeTab === 'archive' && (
        <div className="main-content" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div className="empty-subtitle">Archive screen (Step 8)</div>
        </div>
      )}

      {currentView === 'home' && (
        <Footer
          text={
            activeTab === 'compare'
              ? 'History is stored in this file · shared with your team'
              : 'No account · history is stored inside this file'
          }
        />
      )}
    </div>
  );
};
