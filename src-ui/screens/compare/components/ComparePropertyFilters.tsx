import React from 'react';
import { Check } from 'lucide-react';
import { CompareFilterOptions } from '../../../types';

interface ComparePropertyFiltersProps {
  filters: CompareFilterOptions;
  onChange: (key: keyof CompareFilterOptions) => void;
}

export const ComparePropertyFilters: React.FC<ComparePropertyFiltersProps> = ({
  filters,
  onChange
}) => {
  const items: { key: keyof CompareFilterOptions; label: string }[] = [
    { key: 'text', label: 'Text' },
    { key: 'colour', label: 'Colour' },
    { key: 'layout', label: 'Layout' },
    { key: 'effects', label: 'Effects' },
    { key: 'visibility', label: 'Visibility' },
    { key: 'layerNames', label: 'Layer names' }
  ];

  return (
    <div className="change-types-section">
      <div className="section-title">Change types</div>
      <div className="change-types-grid">
        {items.map(({ key, label }) => {
          const isChecked = filters[key];
          return (
            <div
              key={key}
              className="filter-checkbox-item"
              onClick={() => onChange(key)}
            >
              <div className={`filter-checkbox-box ${isChecked ? 'checked' : ''}`}>
                {isChecked && <Check size={10} strokeWidth={3} />}
              </div>
              <span className="filter-checkbox-label">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
