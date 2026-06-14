'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getWarehouseById } from '@/lib/api/warehouses';
import { getStockByWarehouse, importStock, adjustStock } from '@/lib/api/inventory';
import { getProducts } from '@/lib/api/products';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/templates/AppLayout';
import { Button } from '@/components/atoms';
import { FormField } from '@/components/molecules';
import { Modal, DataTable } from '@/components/organisms';

export default function WarehouseStockPage({ params }) {
  const unwrappedParams = React.use(params);
  const id = unwrappedParams.id;
  const warehouseId = parseInt(id, 10);

  const [warehouse, setWarehouse] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);

  // Form states - Import
  const [importProductId, setImportProductId] = useState('');
  const [importQty, setImportQty] = useState(1);
  const [importReason, setImportReason] = useState('');
  const [importRef, setImportRef] = useState('');

  // Form states - Adjust
  const [adjustType, setAdjustType] = useState('add'); // 'add' or 'subtract'
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustReason, setAdjustReason] = useState('');

  const { showToast } = useToast();
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE_MANAGER';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [warehouseData, stockData, productsData] = await Promise.all([
        getWarehouseById(warehouseId),
        getStockByWarehouse(warehouseId),
        getProducts(),
      ]);
      setWarehouse(warehouseData);
      setStocks(stockData);
      setProducts(productsData);
    } catch (err) {
      console.error(err);
      showToast('Không thể tải thông tin tồn kho', 'error');
    } finally {
      setLoading(false);
    }
  }, [warehouseId, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData().catch(console.error);
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleOpenImportModal = () => {
    setImportProductId(products.length > 0 ? products[0].id.toString() : '');
    setImportQty(1);
    setImportReason('');
    setImportRef('');
    setIsImportModalOpen(true);
  };

  const handleOpenAdjustModal = (stock) => {
    setSelectedStock(stock);
    setAdjustType('add');
    setAdjustQty(1);
    setAdjustReason('');
    setIsAdjustModalOpen(true);
  };

  const handleImportStock = async (e) => {
    e.preventDefault();
    if (!importProductId || importQty <= 0) {
      showToast('Vui lòng nhập đầy đủ thông tin hợp lệ', 'warning');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        warehouseId,
        productId: parseInt(importProductId, 10),
        quantity: parseInt(importQty, 10),
        reason: importReason || undefined,
        referenceId: importRef || undefined,
      };

      await importStock(payload);
      showToast('Nhập kho thành công!', 'success');
      setIsImportModalOpen(false);
      // Reload stock data
      const newStock = await getStockByWarehouse(warehouseId);
      setStocks(newStock);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Lỗi khi nhập kho';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (adjustQty <= 0 || !adjustReason.trim()) {
      showToast('Lý do kiểm kê là bắt buộc và số lượng phải lớn hơn 0', 'warning');
      return;
    }

    // Adjust value: positive for addition, negative for subtraction
    const finalQty = adjustType === 'add' ? adjustQty : -adjustQty;

    // Check if subtraction exceeds current stock
    if (adjustType === 'subtract' && adjustQty > selectedStock.quantity) {
      showToast('Số lượng giảm vượt quá số lượng tồn kho hiện tại', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        warehouseId,
        productId: selectedStock.productId,
        quantity: finalQty,
        reason: adjustReason,
      };

      await adjustStock(payload);
      showToast('Điều chỉnh tồn kho thành công!', 'success');
      setIsAdjustModalOpen(false);
      // Reload stock data
      const newStock = await getStockByWarehouse(warehouseId);
      setStocks(newStock);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Lỗi khi kiểm kê tồn kho';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const tableHeaders = [
    { label: 'Mã SP' },
    { label: 'Tên sản phẩm' },
    { label: 'SKU' },
    { label: 'Tồn kho thực tế' },
    { label: 'Đơn vị' },
    { label: 'Đơn giá' },
    ...(canManage ? [{ label: 'Thao tác' }] : []),
  ];

  const renderStockRow = (stock) => (
    <tr key={stock.id}>
      <td>#{stock.product.id}</td>
      <td>
        <strong>{stock.product.name}</strong>
      </td>
      <td>
        <code style={{ color: 'var(--accent-secondary)' }}>{stock.product.sku}</code>
      </td>
      <td>
        <span
          style={{
            fontSize: 'var(--text-md)',
            fontWeight: 'bold',
            color: stock.quantity > 10 ? 'var(--text-primary)' : 'var(--status-warning)',
          }}
        >
          {stock.quantity}
        </span>
      </td>
      <td>{stock.product.unit}</td>
      <td>{parseInt(stock.product.price, 10).toLocaleString('vi-VN')} đ</td>
      {canManage && (
        <td>
          <Button
            onClick={() => handleOpenAdjustModal(stock)}
            variant="secondary"
            className="btn-sm"
          >
            ⚖️ Kiểm kê / Điều chỉnh
          </Button>
        </td>
      )}
    </tr>
  );

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="page-container">
          {/* Header and Breadcrumbs */}
          <div className="mb-md">
            <Link href="/warehouses" style={{ fontSize: 'var(--text-sm)', color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center', marginBottom: '8px' }}>
              ← Quay lại danh sách kho
            </Link>
          </div>

          <div className="flex justify-between align-center mb-lg">
            <div>
              <h1 className="m-0 mb-xs" style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold' }}>Tồn kho: {warehouse?.name}</h1>
              <p className="text-secondary m-0">📍 {warehouse?.address}</p>
            </div>

            {canManage && (
              <Button onClick={handleOpenImportModal} variant="primary">
                📥 Nhập thêm hàng (Import)
              </Button>
            )}
          </div>

          {/* Stock List Card */}
          <div className="card">
            <h3 className="m-0 mb-md">Chi tiết sản phẩm lưu trữ</h3>
            <DataTable
              headers={tableHeaders}
              data={stocks}
              renderRow={renderStockRow}
              loading={loading}
              emptyMessage="Kho này hiện đang trống. Hãy click nút &quot;Nhập thêm hàng&quot; ở trên để bổ sung sản phẩm."
            />
          </div>

          {/* Import Stock Modal */}
          <Modal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            title="Nhập hàng vào kho"
          >
            <form onSubmit={handleImportStock}>
              <div className="form-group mb-md">
                <label className="form-label">Chọn sản phẩm *</label>
                <select
                  className="form-input"
                  required
                  value={importProductId}
                  onChange={(e) => setImportProductId(e.target.value)}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <FormField
                label="Số lượng nhập *"
                type="number"
                min="1"
                required
                value={importQty}
                onChange={(e) => setImportQty(parseInt(e.target.value, 10))}
              />

              <FormField
                label="Số chứng từ tham chiếu (Reference ID)"
                type="text"
                placeholder="Ví dụ: PO-2026-001"
                value={importRef}
                onChange={(e) => setImportRef(e.target.value)}
              />

              <div className="form-group mb-lg">
                <label className="form-label">Lý do nhập</label>
                <textarea
                  placeholder="Ví dụ: Nhập hàng từ tổng kho miền Nam"
                  className="form-input"
                  value={importReason}
                  onChange={(e) => setImportReason(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-md">
                <Button
                  onClick={() => setIsImportModalOpen(false)}
                  variant="secondary"
                  disabled={actionLoading}
                >
                  Hủy
                </Button>
                <Button type="submit" variant="primary" disabled={actionLoading}>
                  {actionLoading ? 'Đang xử lý...' : 'Xác nhận nhập'}
                </Button>
              </div>
            </form>
          </Modal>

          {/* Adjust Stock Modal */}
          <Modal
            isOpen={isAdjustModalOpen}
            onClose={() => setIsAdjustModalOpen(false)}
            title="Điều chỉnh tồn kho (Kiểm kê)"
          >
            {selectedStock && (
              <>
                <p className="text-secondary mb-md">Sản phẩm: <strong>{selectedStock.product.name}</strong></p>
                <form onSubmit={handleAdjustStock}>
                  <div className="form-group mb-md">
                    <label className="form-label">Loại điều chỉnh</label>
                    <div className="flex gap-md" style={{ marginTop: '4px' }}>
                      <label className="flex align-center gap-xs cursor-pointer">
                        <input
                          type="radio"
                          name="adjustType"
                          checked={adjustType === 'add'}
                          onChange={() => setAdjustType('add')}
                        />
                        Tăng (+)
                      </label>
                      <label className="flex align-center gap-xs cursor-pointer">
                        <input
                          type="radio"
                          name="adjustType"
                          checked={adjustType === 'subtract'}
                          onChange={() => setAdjustType('subtract')}
                        />
                        Giảm (-)
                      </label>
                    </div>
                  </div>

                  <FormField
                    label="Số lượng điều chỉnh *"
                    type="number"
                    min="1"
                    required
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(parseInt(e.target.value, 10))}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '-8px', marginBottom: '16px' }}>
                    Tồn hiện tại: {selectedStock.quantity} {selectedStock.product.unit}. Tồn sau điều chỉnh:{' '}
                    {adjustType === 'add' ? selectedStock.quantity + adjustQty : selectedStock.quantity - adjustQty}
                  </div>

                  <FormField
                    label="Lý do kiểm kê / điều chỉnh *"
                    type="text"
                    required
                    placeholder="Ví dụ: Bù hao hụt kiểm kho thực tế"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                  />

                  <div className="flex justify-end gap-md mt-lg">
                    <Button
                      onClick={() => setIsAdjustModalOpen(false)}
                      variant="secondary"
                      disabled={actionLoading}
                    >
                      Hủy
                    </Button>
                    <Button type="submit" variant="primary" disabled={actionLoading}>
                      {actionLoading ? 'Đang cập nhật...' : 'Xác nhận điều chỉnh'}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </Modal>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
