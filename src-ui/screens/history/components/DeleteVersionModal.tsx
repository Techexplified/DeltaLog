import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteVersionModalProps {
  isOpen: boolean;
  version: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteVersionModal: React.FC<DeleteVersionModalProps> = ({
  isOpen,
  version,
  onConfirm,
  onCancel
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen || !version) return null;

  return (
    <div className="import-modal-backdrop" onClick={onCancel}>
      <div className="import-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="import-modal-header">
          <div className="import-modal-title">Delete Version</div>
          <button className="import-modal-close" onClick={onCancel} title="Close">
            <X size={15} strokeWidth={2.2} />
          </button>
        </div>

        <div className="import-modal-body" style={{ gap: '14px' }}>
          <div className="delete-modal-warning-box">
            <div className="delete-modal-icon-circle">
              <AlertTriangle size={22} strokeWidth={2.2} style={{ color: '#ef4444' }} />
            </div>
            <div className="delete-modal-notice-title">
              Delete version <strong>{version}</strong>?
            </div>
            <div className="delete-modal-notice-desc">
              Once deleted, this version cannot be restored.
            </div>
            <div className="delete-modal-notice-sub">
              Its visual snapshot and timeline record will be permanently removed from this file.
            </div>
          </div>

          <div className="delete-modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger" onClick={onConfirm}>
              Delete version
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
