import React from 'react';
import { Copy, Download } from 'lucide-react';

interface ChangelogActionsProps {
  onCopy: () => void;
  onExport: () => void;
}

export const ChangelogActions: React.FC<ChangelogActionsProps> = ({
  onCopy,
  onExport
}) => {
  return (
    <div className="changelog-actions-row">
      <button 
        type="button" 
        className="btn-changelog-action"
        onClick={onCopy}
      >
        <Copy size={14} strokeWidth={2.2} />
        <span>Copy</span>
      </button>

      <button 
        type="button" 
        className="btn-changelog-action"
        onClick={onExport}
      >
        <Download size={14} strokeWidth={2.2} />
        <span>Export .md</span>
      </button>
    </div>
  );
};
