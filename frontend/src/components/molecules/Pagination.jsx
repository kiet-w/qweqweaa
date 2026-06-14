'use client';

import React from 'react';
import { Button } from '../atoms';

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
  style,
  ...props
}) => {
  if (totalPages <= 1) return null;

  return (
    <div
      className={`flex align-center justify-between mt-md ${className}`}
      style={{ gap: 'var(--space-md)', ...style }}
      {...props}
    >
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
        Trang <strong>{currentPage}</strong> trên {totalPages}
      </span>
      <div className="flex gap-sm">
        <Button
          variant="secondary"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          style={{ padding: '6px 12px' }}
        >
          ← Trước
        </Button>
        <Button
          variant="secondary"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          style={{ padding: '6px 12px' }}
        >
          Sau →
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
