import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getWarehouseById } from '../lib/api/warehouses';
import { getStockByWarehouse, importStock, adjustStock } from '../lib/api/inventory';
import { getProducts } from '../lib/api/products';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

export default function WarehouseStockPage() {
  const { id } = useParams();
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

  if (loading) {
    return (
      <div className="flex justify-center align-center h-full" style={{ minHeight: '400px' }}>
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header and Breadcrumbs */}
      <div className="mb-md">
        <Link to="/warehouses" style={{ fontSize: 'var(--text-sm)', color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center', marginBottom: '8px' }}>
          ← Quay lại danh sách kho
        </Link>
      </div>

      <div className="flex justify-between align-center mb-lg">
        <div>
          <h1 className="m-0 mb-xs" style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold' }}>Tồn kho: {warehouse?.name}</h1>
          <p className="text-secondary m-0">📍 {warehouse?.address}</p>
        </div>

        {canManage && (
          <button onClick={handleOpenImportModal} className="btn btn-primary">
            📥 Nhập thêm hàng (Import)
          </button>
        )}
      </div>

      {/* Stock List Card */}
      <div className="card">
        <h3 className="m-0 mb-md">Chi tiết sản phẩm lưu trữ</h3>
        {stocks.length === 0 ? (
          <div className="text-center p-lg text-secondary">
            Kho này hiện đang trống. Hãy click nút "Nhập thêm hàng" ở trên để bổ sung sản phẩm.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã SP</th>
                  <th>Tên sản phẩm</th>
                  <th>SKU</th>
                  <th>Tồn kho thực tế</th>
                  <th>Đơn vị</th>
                  <th>Đơn giá</th>
                  {canManage && <th>Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock) => (
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
                        <button
                          onClick={() => handleOpenAdjustModal(stock)}
                          className="btn btn-secondary btn-sm"
                        >
                          ⚖️ Kiểm kê / Điều chỉnh
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Import Stock Modal */}
      {isImportModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="m-0 mb-md">Nhập hàng vào kho</h3>
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

              <div className="form-group mb-md">
                <label className="form-label">Số lượng nhập *</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="form-input"
                  value={importQty}
                  onChange={(e) => setImportQty(parseInt(e.target.value, 10))}
                />
              </div>

              <div className="form-group mb-md">
                <label className="form-label">Số chứng từ tham chiếu (Reference ID)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: PO-2026-001"
                  className="form-input"
                  value={importRef}
                  onChange={(e) => setImportRef(e.target.value)}
                />
              </div>

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
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={actionLoading}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Đang xử lý...' : 'Xác nhận nhập'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {isAdjustModalOpen && selectedStock && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="m-0 mb-xs">Điều chỉnh tồn kho (Kiểm kê)</h3>
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

              <div className="form-group mb-md">
                <label className="form-label">Số lượng điều chỉnh *</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="form-input"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value, 10))}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  Tồn hiện tại: {selectedStock.quantity} {selectedStock.product.unit}. Tồn sau điều chỉnh:{' '}
                  {adjustType === 'add' ? selectedStock.quantity + adjustQty : selectedStock.quantity - adjustQty}
                </span>
              </div>

              <div className="form-group mb-lg">
                <label className="form-label">Lý do kiểm kê / điều chỉnh *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Bù hao hụt kiểm kho thực tế"
                  className="form-input"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-md">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={actionLoading}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Đang cập nhật...' : 'Xác nhận điều chỉnh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
