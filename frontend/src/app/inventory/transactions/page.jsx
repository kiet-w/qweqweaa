'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getTransactions } from '@/lib/api/inventory';
import { getWarehouses } from '@/lib/api/warehouses';
import { getProducts } from '@/lib/api/products';
import { useToast } from '@/contexts/ToastContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/templates/AppLayout';
import { Button } from '@/components/atoms';
import { StatusBadge } from '@/components/molecules';
import { DataTable } from '@/components/organisms';

export default function TransactionLogPage() {
  const [transactions, setTransactions] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logLoading, setLogLoading] = useState(false);

  // Filters
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  const { showToast } = useToast();

  // Load filter lists
  const fetchFilters = useCallback(async () => {
    try {
      const [warehousesData, productsData] = await Promise.all([
        getWarehouses(),
        getProducts(),
      ]);
      setWarehouses(warehousesData);
      setProducts(productsData);
    } catch (err) {
      console.error(err);
      showToast('Không thể tải bộ lọc', 'error');
    }
  }, [showToast]);

  // Load transactions
  const fetchLogs = useCallback(async () => {
    setLogLoading(true);
    try {
      const filters = {
        take: itemsPerPage.toString(),
        skip: ((page - 1) * itemsPerPage).toString(),
      };
      if (selectedWarehouseId) filters.warehouseId = selectedWarehouseId;
      if (selectedProductId) filters.productId = selectedProductId;
      if (selectedType) filters.type = selectedType;

      const data = await getTransactions(filters);
      setTransactions(data);
    } catch (err) {
      console.error(err);
      showToast('Không thể tải nhật ký tồn kho', 'error');
    } finally {
      setLogLoading(false);
      setLoading(false);
    }
  }, [page, selectedWarehouseId, selectedProductId, selectedType, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFilters().catch(console.error);
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchFilters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs().catch(console.error);
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchLogs]);

  // Reset page when filters change
  const handleFilterChange = (filterName, value) => {
    setPage(1);
    if (filterName === 'warehouse') setSelectedWarehouseId(value);
    if (filterName === 'product') setSelectedProductId(value);
    if (filterName === 'type') setSelectedType(value);
  };

  const getWarehouseName = (id) => {
    const w = warehouses.find((item) => item.id === id);
    return w ? w.name : `Kho #${id}`;
  };

  const tableHeaders = [
    { label: 'Mã GD' },
    { label: 'Thời gian' },
    { label: 'Kho bãi' },
    { label: 'Sản phẩm' },
    { label: 'Giao dịch' },
    { label: 'Số lượng' },
    { label: 'Số dư (Trước → Sau)' },
    { label: 'Chứng từ tham chiếu' },
    { label: 'Lý do' },
    { label: 'Người thực hiện' },
  ];

  const renderTransactionRow = (tx) => (
    <tr key={tx.id}>
      <td>
        <strong>#{tx.id}</strong>
      </td>
      <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
        {new Date(tx.createdAt).toLocaleString('vi-VN')}
      </td>
      <td>{getWarehouseName(tx.warehouseId)}</td>
      <td>
        <strong>{tx.product?.name}</strong>{' '}
        <code style={{ fontSize: '11px', color: 'var(--accent-secondary)' }}>
          {tx.product?.sku}
        </code>
      </td>
      <td>
        <StatusBadge status={tx.type} />
      </td>
      <td style={{ fontWeight: 'bold' }}>
        {tx.type === 'EXPORT' ? (
          <span style={{ color: 'var(--status-error)' }}>-{tx.quantity}</span>
        ) : tx.type === 'IMPORT' ? (
          <span style={{ color: 'var(--status-success)' }}>+{tx.quantity}</span>
        ) : tx.quantity > 0 ? (
          <span style={{ color: 'var(--status-success)' }}>+{tx.quantity}</span>
        ) : (
          <span style={{ color: 'var(--status-error)' }}>{tx.quantity}</span>
        )}
      </td>
      <td style={{ color: 'var(--text-secondary)' }}>
        {tx.balanceBefore} → {tx.balanceAfter}
      </td>
      <td>{tx.referenceId ? <code>{tx.referenceId}</code> : <span className="text-tertiary">-</span>}</td>
      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={tx.reason}>
        {tx.reason || <span className="text-tertiary">-</span>}
      </td>
      <td>{tx.createdBy?.name || `Mã NV #${tx.createdById}`}</td>
    </tr>
  );

  if (loading) {
    return (
      <div className="flex justify-center align-center h-full" style={{ minHeight: '400px' }}>
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="page-container">
          {/* Header */}
          <div className="mb-lg">
            <h1 className="m-0 mb-xs" style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold' }}>Nhật ký Giao dịch Kho (Audit Log)</h1>
            <p className="text-secondary m-0">Tra cứu lịch sử nhập xuất, điều chỉnh lượng tồn kho và thông tin đối soát.</p>
          </div>

          {/* Filters Card */}
          <div className="card mb-lg">
            <div className="flex align-center gap-md" style={{ flexWrap: 'wrap' }}>
              <div className="form-group" style={{ minWidth: '200px' }}>
                <label className="form-label">Kho bãi</label>
                <select
                  className="form-input"
                  value={selectedWarehouseId}
                  onChange={(e) => handleFilterChange('warehouse', e.target.value)}
                >
                  <option value="">-- Tất cả kho --</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ minWidth: '200px' }}>
                <label className="form-label">Sản phẩm</label>
                <select
                  className="form-input"
                  value={selectedProductId}
                  onChange={(e) => handleFilterChange('product', e.target.value)}
                >
                  <option value="">-- Tất cả sản phẩm --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ minWidth: '180px' }}>
                <label className="form-label">Loại giao dịch</label>
                <select
                  className="form-input"
                  value={selectedType}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <option value="">-- Tất cả loại --</option>
                  <option value="IMPORT">Nhập kho (Import)</option>
                  <option value="EXPORT">Xuất kho (Export)</option>
                  <option value="ADJUSTMENT">Kiểm kê điều chỉnh (Adjustment)</option>
                  <option value="RETURN">Nhận trả hàng (Return)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Logs Table Card */}
          <div className="card">
            <DataTable
              headers={tableHeaders}
              data={transactions}
              renderRow={renderTransactionRow}
              loading={logLoading}
              emptyMessage="Không tìm thấy giao dịch nào phù hợp với bộ lọc."
            />

            {!logLoading && transactions.length > 0 && (
              <div className="flex justify-between align-center mt-md">
                <Button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  variant="secondary"
                  disabled={page === 1}
                >
                  Trước
                </Button>
                <span className="text-secondary" style={{ fontSize: 'var(--text-sm)' }}>
                  Trang <strong>{page}</strong>
                </span>
                <Button
                  onClick={() => setPage((p) => p + 1)}
                  variant="secondary"
                  disabled={transactions.length < itemsPerPage}
                >
                  Tiếp theo
                </Button>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
