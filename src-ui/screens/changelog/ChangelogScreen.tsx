import React, { useState, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { DiffResult, DiffItem } from '../../types';
import { ComparisonBannerCard } from './components/ComparisonBannerCard';
import { ChangelogEditor } from './components/ChangelogEditor';
import { ChangelogActions } from './components/ChangelogActions';

interface ChangelogScreenProps {
  diff: DiffResult;
  ignoredItemIds?: Set<string>;
  userName?: string;
  onBack: () => void;
  onNotify: (message: string) => void;
}

export function formatChangelogMarkdown(
  fromVersion: string,
  toVersion: string,
  frameName: string,
  author: string,
  items: DiffItem[]
): string {
  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const lines: string[] = [];
  lines.push(`## ${fromVersion} → ${toVersion} · ${frameName}`);
  lines.push(`${dateStr} · ${author || 'Designer'}`);
  lines.push('');

  const changed = items.filter(i => i.status === 'changed');
  const added = items.filter(i => i.status === 'added');
  const removed = items.filter(i => i.status === 'removed');

  if (changed.length > 0) {
    lines.push('### Changed');
    for (const item of changed) {
      if (item.changes.length === 0) {
        lines.push(`- ${item.name}`);
      } else {
        for (const c of item.changes) {
          lines.push(`- ${item.name} · ${c.description}`);
        }
      }
    }
    lines.push('');
  }

  if (added.length > 0) {
    lines.push('### Added');
    for (const item of added) {
      lines.push(`- ${item.name} (${item.type.toLowerCase()})`);
    }
    lines.push('');
  }

  if (removed.length > 0) {
    lines.push('### Removed');
    for (const item of removed) {
      lines.push(`- ${item.name} (${item.type.toLowerCase()})`);
    }
    lines.push('');
  }

  if (items.length === 0) {
    lines.push('No visual changes detected in this comparison.');
  }

  return lines.join('\n').trim();
}

export const ChangelogScreen: React.FC<ChangelogScreenProps> = ({
  diff,
  ignoredItemIds = new Set(),
  userName = 'Designer',
  onBack,
  onNotify
}) => {
  // 1. Filter out any ignored items
  const activeItems = useMemo(() => {
    return diff.items.filter(item => !ignoredItemIds.has(item.id));
  }, [diff.items, ignoredItemIds]);

  // 2. Manage editable markdown
  const [markdown, setMarkdown] = useState<string>(() => {
    return formatChangelogMarkdown(diff.fromVersion, diff.toVersion, diff.frameName, userName, activeItems);
  });

  // 3. Handle copy
  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(markdown);
      } else {
        const ta = document.createElement('textarea');
        ta.value = markdown;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      onNotify('Changelog copied to clipboard!');
    } catch (err) {
      onNotify('Failed to copy to clipboard');
    }
  };

  // 4. Handle export .md
  const handleExport = () => {
    try {
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (diff.frameName || 'frame')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '-');
      const safeFrom = diff.fromVersion.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      const safeTo = diff.toVersion.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      a.download = `changelog-${safeName}-${safeFrom}-to-${safeTo}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onNotify('Changelog exported as .md');
    } catch (err) {
      onNotify('Failed to export markdown');
    }
  };

  return (
    <div className="changelog-screen-container">
      {/* Top Header */}
      <div className="screen-header">
        <button className="back-btn" onClick={onBack} title="Back to Compare results">
          <ArrowLeft size={16} strokeWidth={2.2} />
        </button>
        <span className="screen-title">Changelog</span>
      </div>

      {/* Main Content */}
      <div className="main-content" style={{ gap: '14px', flex: 1, overflowY: 'auto' }}>
        {/* Version Comparison Banner Card */}
        <ComparisonBannerCard
          fromVersion={diff.fromVersion}
          toVersion={diff.toVersion}
        />

        {/* Editable Markdown Area */}
        <ChangelogEditor
          markdown={markdown}
          onChangeMarkdown={setMarkdown}
          activeChangesCount={activeItems.length}
        />

        {/* Action Buttons: Copy & Export .md */}
        <ChangelogActions
          onCopy={handleCopy}
          onExport={handleExport}
        />
      </div>
    </div>
  );
};
