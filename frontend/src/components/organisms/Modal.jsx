'use client';

import React, { useEffect } from 'react';
import { Button } from '../atoms';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '500px',
  className = '',
  ...props
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-content ${className}`}
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        <div className="flex align-center justify-between mb-lg" style={{ borderBottom: '1px solid var(--border-primary)', paddingBottom: 'var(--space-sm)' }}>
          <h3 style={{ fontWeight: 'bold', fontSize: 'var(--text-lg)', margin: 0 }}>
            {title}
          </h3>
          <Button
            variant="secondary"
            onClick={onClose}
            style={{ minWidth: 'auto', padding: '4px 8px', fontSize: 'var(--text-sm)' }}
          >
            ✕
          </Button>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
