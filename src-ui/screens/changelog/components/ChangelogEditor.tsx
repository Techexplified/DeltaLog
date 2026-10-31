import React from 'react';

interface ChangelogEditorProps {
  markdown: string;
  onChangeMarkdown: (val: string) => void;
  activeChangesCount: number;
}

export const ChangelogEditor: React.FC<ChangelogEditorProps> = ({
  markdown,
  onChangeMarkdown,
  activeChangesCount
}) => {
  return (
    <div className="changelog-editor-card">
      <div className="changelog-textarea-wrapper">
        <textarea
          className="changelog-textarea"
          value={markdown}
          onChange={(e) => onChangeMarkdown(e.target.value)}
          spellCheck={false}
          placeholder="No changes to display..."
        />
      </div>

      <div className="changelog-editor-footer">
        <span className="changelog-footer-left">Editable · saved with this version</span>
        <span className="changelog-footer-right">
          {activeChangesCount} {activeChangesCount === 1 ? 'change' : 'changes'}
        </span>
      </div>
    </div>
  );
};
