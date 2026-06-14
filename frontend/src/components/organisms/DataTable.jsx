'use client';

import React from 'react';
import { Spinner } from '../atoms';
import { Pagination } from '../molecules';

export const DataTable = ({
  headers,
  data,
  renderRow,
  loading = false,
  emptyMessage = 'Không có dữ liệu',
  currentPage,
  totalPages,
  onPageChange,
  className = '',
  style,
  ...props
}) => {
  return (
    <div className={`w-full ${className}`} style={style} {...props}>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} style={h.style}>{h.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={headers.length} className="text-center" style={{ padding: 'var(--space-2xl)' }}>
                  <div className="flex justify-center align-center">
                    <Spinner />
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="text-center text-secondary" style={{ padding: 'var(--space-xl)' }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => renderRow(item, index))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};

export default DataTable;
