import React from 'react';
import { DiffItem } from '../../../types';

interface DiffItemListProps {
  items: DiffItem[];
  ignoredItemIds?: Set<string>;
  onSelectItem: (item: DiffItem) => void;
}

export const DiffItemList: React.FC<DiffItemListProps> = ({
  items,
  ignoredItemIds,
  onSelectItem
}) => {
  if (items.length === 0) {
    return (
      <div className="diff-empty-list">
        <span className="diff-empty-text">No changes match the active filter.</span>
      </div>
    );
  }

  return (
    <div className="diff-items-container">
      {items.map((item) => {
        const isIgnored = ignoredItemIds?.has(item.id);
        // Collect primary description
        let mainDesc = '';
        if (item.status === 'changed') {
          mainDesc = item.changes.map(c => c.description).join(' · ');
        } else if (item.status === 'added') {
          mainDesc = `New ${item.type.toLowerCase()} layer added to design`;
        } else {
          mainDesc = 'Layer removed from design';
        }

        const badgeClass = `diff-badge status-${item.status}`;

        return (
          <div
            key={item.id}
            className={`diff-item-row row-${item.status} ${isIgnored ? 'item-ignored' : ''}`}
            onClick={() => onSelectItem(item)}
            title="Click to view change detail"
          >
            <div className="diff-item-main">
              <div className="diff-item-header">
                <span className="diff-item-name">{item.name || 'Unnamed Layer'}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isIgnored && <span className="diff-badge badge-ignored">IGNORED</span>}
                  <span className={badgeClass}>{item.status.toUpperCase()}</span>
                </div>
              </div>
              <div className="diff-item-desc">{mainDesc}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
