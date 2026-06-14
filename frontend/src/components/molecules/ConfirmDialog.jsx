'use client';

import React from 'react';
import { Button } from '../atoms';

export const ConfirmDialog = ({
  title = 'Xác nhận',
  message,
  confirmText = 'Đồng ý',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
  loading = false,
  className = '',
  style,
  ...props
}) => {
  return (
    <div className={`card ${className}`} style={{ maxWidth: '400px', ...style }} {...props}>
      <h3 className="mb-sm" style={{ fontWeight: 'bold', fontSize: 'var(--text-lg)' }}>
        {title}
      </h3>
      <p className="mb-lg text-secondary" style={{ fontSize: 'var(--text-sm)' }}>
        {message}
      </p>
      <div className="flex justify-end gap-md">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          {cancelText}
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={loading}>
          {loading ? 'Đang xử lý...' : confirmText}
        </Button>
      </div>
    </div>
  );
};

export default ConfirmDialog;
