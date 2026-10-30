import React, { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { DiffResult } from '../../types';
import { CompareSummaryMetrics } from './components/CompareSummaryMetrics';
import { SideBySidePreview } from './components/SideBySidePreview';
import { CanvasHighlightToggle } from './components/CanvasHighlightToggle';
import { ChangeCategoryFilterChips, CategoryFilterKey } from './components/ChangeCategoryFilterChips';
import { DiffItemList } from './components/DiffItemList';

interface CompareResultsScreenProps {
  diff: DiffResult;
  ignoredItemIds?: Set<string>;
  onBack: () => void;
  onToggleCanvasHighlights: (enabled: boolean) => void;
  onSelectDetailItem: (item: DiffItem) => void;
  onViewChangelog: () => void;
}

export const CompareResultsScreen: React.FC<CompareResultsScreenProps> = ({
  diff,
  ignoredItemIds,
  onBack,
  onToggleCanvasHighlights,
  onSelectDetailItem,
  onViewChangelog
}) => {
  const [highlightsEnabled, setHighlightsEnabled] = useState(true);
  const [activeCategory, setActiveCategory] = useState<CategoryFilterKey>('all');

  const handleToggleHighlights = (val: boolean) => {
    setHighlightsEnabled(val);
    onToggleCanvasHighlights(val);
  };

  // Compute category counts
  const textChanges = diff.items.filter(i => i.status === 'changed' && i.changes.some(c => c.group === 'text'));
  const colourChanges = diff.items.filter(i => i.status === 'changed' && i.changes.some(c => c.group === 'colour'));
  const layoutChanges = diff.items.filter(i => i.status === 'changed' && i.changes.some(c => c.group === 'layout'));
  const effectsChanges = diff.items.filter(i => i.status === 'changed' && i.changes.some(c => c.group === 'effects'));
  const visibilityChanges = diff.items.filter(i => i.status === 'changed' && i.changes.some(c => c.group === 'visibility'));
  const namesChanges = diff.items.filter(i => i.status === 'changed' && i.changes.some(c => c.group === 'layerNames'));

  const availableCategories: { key: CategoryFilterKey; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: diff.items.length }
  ];

  if (diff.appliedFilters.text && textChanges.length > 0) {
    availableCategories.push({ key: 'text', label: 'Text', count: textChanges.length });
  }
  if (diff.appliedFilters.colour && colourChanges.length > 0) {
    availableCategories.push({ key: 'colour', label: 'Colour', count: colourChanges.length });
  }
  if (diff.appliedFilters.layout && layoutChanges.length > 0) {
    availableCategories.push({ key: 'layout', label: 'Layout', count: layoutChanges.length });
  }
  if (diff.appliedFilters.effects && effectsChanges.length > 0) {
    availableCategories.push({ key: 'effects', label: 'Effects', count: effectsChanges.length });
  }
  if (diff.appliedFilters.visibility && visibilityChanges.length > 0) {
    availableCategories.push({ key: 'visibility', label: 'Visibility', count: visibilityChanges.length });
  }
  if (diff.appliedFilters.layerNames && namesChanges.length > 0) {
    availableCategories.push({ key: 'layerNames', label: 'Names', count: namesChanges.length });
  }

  // Filter items based on activeCategory
  const filteredItems = diff.items.filter(item => {
    if (activeCategory === 'all') return true;
    if (item.status === 'changed') {
      return item.changes.some(c => c.group === activeCategory);
    }
    // Added and Removed layers appear in 'all', or in layout if size/position was recorded
    return activeCategory === 'layout';
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top Header */}
      <div className="screen-header">
        <button className="back-btn" onClick={onBack} title="Back to Compare options">
          <ArrowLeft size={16} strokeWidth={2.2} />
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span className="screen-title" style={{ fontSize: '14px', lineHeight: 1.2 }}>Compare results</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {diff.fromVersion} → {diff.toVersion} · {diff.frameName}
          </span>
        </div>
      </div>

      <div className="main-content" style={{ gap: '12px', flex: 1, overflowY: 'auto' }}>
        {/* Metric Summary Badges */}
        <CompareSummaryMetrics
          changed={diff.summary.changed}
          added={diff.summary.added}
          removed={diff.summary.removed}
        />

        {/* Side-by-side Before/After Preview */}
        <SideBySidePreview
          fromVersion={diff.fromVersion}
          toVersion={diff.toVersion}
          fromThumbnail={diff.fromThumbnail}
          toThumbnail={diff.toThumbnail}
        />

        {/* Canvas Highlight Checkbox */}
        <CanvasHighlightToggle
          enabled={highlightsEnabled}
          onToggle={handleToggleHighlights}
        />

        {/* Filter Chips */}
        <ChangeCategoryFilterChips
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          availableCategories={availableCategories}
        />

        {/* Diff Items List */}
        <DiffItemList
          items={filteredItems}
          ignoredItemIds={ignoredItemIds}
          onSelectItem={onSelectDetailItem}
        />

        <div className="compare-footer-note" style={{ margin: '4px 0 2px 0' }}>
          <span>Tap a row for details &amp; locate on canvas</span>
        </div>
      </div>

      {/* Pinned Bottom CTA */}
      <div className="compare-results-footer-bar">
        <button
          type="button"
          className="btn btn-primary"
          onClick={onViewChangelog}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <span>View changelog</span>
          <ArrowRight size={14} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
};
