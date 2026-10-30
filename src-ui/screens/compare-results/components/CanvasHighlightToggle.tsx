import React from 'react';
import { Check } from 'lucide-react';

interface CanvasHighlightToggleProps {
  enabled: boolean;
  onToggle: (checked: boolean) => void;
}

export const CanvasHighlightToggle: React.FC<CanvasHighlightToggleProps> = ({
  enabled,
  onToggle
}) => {
  return (
    <div 
      className="canvas-highlight-toggle-row"
      onClick={() => onToggle(!enabled)}
    >
      <div className={`checkbox-box ${enabled ? 'checked' : ''}`}>
        {enabled && <Check size={11} strokeWidth={3} />}
      </div>
      <span className="canvas-highlight-label">
        Highlight changes on canvas
      </span>
    </div>
  );
};
