import React, { useRef, useState } from 'react';
import { UploadCloud, FolderArchive } from 'lucide-react';

interface ImportBackupCardProps {
  availableSlots: number;
  onFileSelected: (file: File) => void;
}

export const ImportBackupCard: React.FC<ImportBackupCardProps> = ({
  availableSlots,
  onFileSelected
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileSelected(file);
    }
  };

  return (
    <div
      className={`import-backup-card ${isDragging ? 'dragging' : ''}`}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        accept=".zip,application/zip,application/x-zip-compressed"
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />

      <div className="import-icon-circle">
        <FolderArchive size={20} strokeWidth={2} />
      </div>

      <div className="import-text-block">
        <div className="import-card-title">
          <span>Import Frame Backup (.zip)</span>
        </div>
        <div className="import-card-subtitle">
          Restore screen &amp; timeline from another file or team
        </div>
      </div>

      <div className="import-action-pill">
        <UploadCloud size={13} strokeWidth={2.2} />
        <span>Select .zip</span>
      </div>

      <div className="import-capacity-caption">
        {availableSlots > 0 ? (
          <span>{availableSlots} of 10 slots remaining in this file</span>
        ) : (
          <span style={{ color: '#ef4444' }}>File storage full (10 of 10 used)</span>
        )}
      </div>
    </div>
  );
};
