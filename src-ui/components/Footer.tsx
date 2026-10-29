import React from 'react';

interface FooterProps {
  text?: string;
}

export const Footer: React.FC<FooterProps> = ({ 
  text = 'No account · history is stored inside this file' 
}) => {
  return (
    <footer className="app-footer">
      <span className="status-dot" />
      <span>{text}</span>
    </footer>
  );
};
