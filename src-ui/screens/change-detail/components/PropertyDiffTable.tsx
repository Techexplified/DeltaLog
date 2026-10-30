import React from 'react';
import { DiffItem } from '../../../types';

interface PropertyDiffTableProps {
  item: DiffItem;
}

export const PropertyDiffTable: React.FC<PropertyDiffTableProps> = ({ item }) => {
  const isColorHex = (val: any) => typeof val === 'string' && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val.trim());

  const renderValueCell = (val: any) => {
    if (val === null || val === undefined || val === '') {
      return <span className="diff-val-empty">—</span>;
    }

    const strVal = String(val);
    if (isColorHex(strVal)) {
      return (
        <span className="diff-val-color">
          <span className="color-swatch" style={{ background: strVal }} />
          <span>{strVal.toUpperCase()}</span>
        </span>
      );
    }

    return <span title={strVal}>{strVal}</span>;
  };

  const rows = item.changes.map((c) => {
    let propTitle = c.prop;
    if (c.prop === 'characters') propTitle = 'Text label';
    else if (c.prop === 'fontSize') propTitle = 'Font size';
    else if (c.prop === 'fontFamily') propTitle = 'Font family';
    else if (c.prop === 'cornerRadius') propTitle = 'Corner radius';
    else if (c.prop === 'fills') propTitle = 'Fill';
    else if (c.prop === 'strokes') propTitle = 'Stroke';
    else if (c.prop === 'name') propTitle = 'Layer name';
    else if (c.prop === 'size') propTitle = 'Dimensions';
    else if (c.prop === 'position') propTitle = 'Position';
    else if (c.prop === 'opacity') propTitle = 'Opacity';
    else if (c.prop === 'visible') propTitle = 'Visibility';
    else if (c.prop === 'layer') propTitle = 'Status';

    return {
      title: propTitle.charAt(0).toUpperCase() + propTitle.slice(1),
      before: c.before,
      after: c.after
    };
  });

  return (
    <div className="property-diff-table-container">
      <div className="property-diff-table-header">
        <span className="col-prop">Property</span>
        <span className="col-val">Before</span>
        <span className="col-val">After</span>
      </div>

      <div className="property-diff-table-body">
        {rows.map((row, idx) => (
          <div key={idx} className="property-diff-row">
            <span className="col-prop font-medium" title={row.title}>{row.title}</span>
            <span className="col-val val-before">{renderValueCell(row.before)}</span>
            <span className="col-val val-after font-semibold">{renderValueCell(row.after)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
