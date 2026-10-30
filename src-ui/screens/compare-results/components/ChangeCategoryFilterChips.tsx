import React from 'react';

export type CategoryFilterKey = 'all' | 'text' | 'colour' | 'layout' | 'effects' | 'visibility' | 'layerNames';

interface ChangeCategoryFilterChipsProps {
  activeCategory: CategoryFilterKey;
  onSelectCategory: (key: CategoryFilterKey) => void;
  availableCategories: { key: CategoryFilterKey; label: string; count: number }[];
}

export const ChangeCategoryFilterChips: React.FC<ChangeCategoryFilterChipsProps> = ({
  activeCategory,
  onSelectCategory,
  availableCategories
}) => {
  return (
    <div className="filter-chips-scroll">
      {availableCategories.map(({ key, label, count }) => {
        const isActive = activeCategory === key;
        return (
          <button
            key={key}
            type="button"
            className={`filter-chip-btn ${isActive ? 'active' : ''}`}
            onClick={() => onSelectCategory(key)}
          >
            <span>{label}</span>
            {count > 0 && <span className="filter-chip-count">{count}</span>}
          </button>
        );
      })}
    </div>
  );
};
