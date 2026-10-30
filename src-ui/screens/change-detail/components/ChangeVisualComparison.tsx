import React from 'react';
import { DiffItem, SnapshotNode } from '../../../types';

interface ChangeVisualComparisonProps {
  item: DiffItem;
}

export const ChangeVisualComparison: React.FC<ChangeVisualComparisonProps> = ({ item }) => {
  const beforeNode = item.beforeNode;
  const afterNode = item.afterNode;

  // Real dimensions
  const bW = beforeNode?.layout?.w ?? 0;
  const bH = beforeNode?.layout?.h ?? 0;
  const aW = afterNode?.layout?.w ?? 0;
  const aH = afterNode?.layout?.h ?? 0;

  // Max dimension across both versions to preserve true proportional scale
  const maxLayerW = Math.max(bW, aW, 10);
  const maxLayerH = Math.max(bH, aH, 10);

  const maxBoxW = 104;
  const maxBoxH = 46;

  // Calculate common scale factor
  const scale = Math.min(maxBoxW / maxLayerW, maxBoxH / maxLayerH);

  const renderLayerGraphic = (node: SnapshotNode | null | undefined, isGhost = false) => {
    if (!node) {
      return (
        <div className="layer-preview-none">
          <span>(None)</span>
        </div>
      );
    }

    const fill = node.colour?.fills?.[0] || 'transparent';
    const stroke = node.colour?.strokes?.[0] || 'transparent';
    const rawRadius = typeof node.effects?.cornerRadius === 'number' ? node.effects.cornerRadius : 0;
    const opacity = node.effects?.opacity ?? 1;
    const text = node.text?.characters;

    // Proportional dimensions
    const renderW = Math.max(14, Math.min(maxBoxW, Math.round(node.layout.w * scale)));
    const renderH = Math.max(14, Math.min(maxBoxH, Math.round(node.layout.h * scale)));

    const isEllipse = node.type === 'ELLIPSE' || item.type === 'ELLIPSE';

    // Scale corner radius proportionally, or 50% for circles/ellipses
    const maxRadius = Math.min(renderW, renderH) / 2;
    const scaledRadius = isEllipse ? '50%' : `${Math.min(maxRadius, Math.max(0, Math.round(rawRadius * scale)))}px`;

    if (isGhost) {
      return (
        <div className="layer-preview-wrapper">
          <div 
            className="layer-preview-shape ghost-shape"
            style={{
              width: `${renderW}px`,
              height: `${renderH}px`,
              borderRadius: scaledRadius
            }}
          >
            {text && <span className="layer-preview-text" style={{ opacity: 0.6 }}>{text}</span>}
          </div>
          <span className="visual-dim-tag">{Math.round(node.layout.w)} × {Math.round(node.layout.h)}</span>
        </div>
      );
    }

    const isWhiteOrLight = fill.toUpperCase() === '#FFFFFF' || fill.toUpperCase() === '#F8FAFC';
    const textColor = isWhiteOrLight ? '#0f172a' : '#ffffff';

    return (
      <div className="layer-preview-wrapper">
        <div
          className="layer-preview-shape"
          style={{
            width: `${renderW}px`,
            height: `${renderH}px`,
            background: fill !== 'transparent' ? fill : '#1e293b',
            borderColor: stroke !== 'transparent' ? stroke : 'rgba(255, 255, 255, 0.15)',
            borderWidth: stroke !== 'transparent' ? '1.5px' : '1px',
            borderStyle: 'solid',
            borderRadius: scaledRadius,
            opacity: opacity,
            boxShadow: fill !== 'transparent' && !isWhiteOrLight ? `0 3px 12px ${fill}45` : 'none'
          }}
        >
          {text && (
            <span 
              className="layer-preview-text" 
              style={{ color: textColor }}
            >
              {text}
            </span>
          )}
        </div>
        <span className="visual-dim-tag">{Math.round(node.layout.w)} × {Math.round(node.layout.h)}</span>
      </div>
    );
  };

  return (
    <div className="change-visual-card">
      {/* Before Box */}
      <div className="change-visual-column">
        <span className="visual-column-label">Before</span>
        <div className="visual-preview-frame">
          {renderLayerGraphic(beforeNode, item.status === 'added')}
        </div>
      </div>

      {/* After Box */}
      <div className="change-visual-column">
        <span className="visual-column-label">After</span>
        <div className="visual-preview-frame">
          {renderLayerGraphic(afterNode, item.status === 'removed')}
        </div>
      </div>
    </div>
  );
};
