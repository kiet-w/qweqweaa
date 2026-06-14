import { useState, useEffect, useCallback } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../lib/api/products';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function ProductsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    unit: '',
    price: '',
    description: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Roles guard helper
  const isAdmin = user?.role === 'ADMIN';
  const canEdit = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE_MANAGER';

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
      showToast('Không thể tải danh sách sản phẩm', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts().catch(console.error);
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  // Client-side filtering
  const filteredProducts = products.filter(
    (p) =>
      (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Price formatting
  const formatPrice = (price) => {
    if (price === undefined || price === null) return '-';
    const num = typeof price === 'number' ? price : parseFloat(price);
    return isNaN(num) ? '-' : num.toLocaleString('vi-VN') + ' ₫';
  };

  // Form Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Tên sản phẩm không được để trống';
    }
    if (!formData.sku.trim()) {
      errors.sku = 'Mã SKU không được để trống';
    }
    if (!formData.unit.trim()) {
      errors.unit = 'Đơn vị tính không được để trống';
    }
    if (formData.price === '' || formData.price === undefined || formData.price === null) {
      errors.price = 'Giá sản phẩm không được để trống';
    } else {
      const p = parseFloat(formData.price);
      if (isNaN(p) || p < 0) {
        errors.price = 'Giá sản phẩm phải lớn hơn hoặc bằng 0';
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Open modals
  const openAddModal = () => {
    setFormData({
      name: '',
      sku: '',
      unit: '',
      price: '',
      description: '',
    });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name || '',
      sku: product.sku || '',
      unit: product.unit || '',
      price: product.price?.toString() || '0',
      description: product.description || '',
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (product) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  // Submit handlers
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setActionLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        unit: formData.unit.trim(),
        price: parseFloat(formData.price),
        description: formData.description.trim() || undefined,
      };
      await createProduct(payload);
      showToast('Đã thêm sản phẩm mới thành công', 'success');
      setIsAddModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi thêm sản phẩm';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setActionLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        unit: formData.unit.trim(),
        price: parseFloat(formData.price),
        description: formData.description.trim() || null,
      };
      await updateProduct(selectedProduct.id, payload);
      showToast('Cập nhật sản phẩm thành công', 'success');
      setIsEditModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật sản phẩm';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedProduct) return;
    setActionLoading(true);
    try {
      await deleteProduct(selectedProduct.id);
      showToast('Xóa sản phẩm thành công', 'success');
      setIsDeleteModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi xóa sản phẩm';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="flex justify-between align-center mb-lg">
        <div>
          <h1 className="m-0 mb-xs" style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold' }}>
            Quản lý Sản phẩm
          </h1>
          <p className="text-secondary m-0">Quản lý danh sách sản phẩm lưu kho, SKU và đơn giá.</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <span>+ Thêm sản phẩm</span>
          </button>
        )}
      </div>

      {/* Filter / Search section */}
      <div className="card mb-lg">
        <div className="flex align-center gap-md">
          <div className="form-group m-0" style={{ flexGrow: 1 }}>
            <input
              type="text"
              className="form-input"
              placeholder="Tìm kiếm sản phẩm theo tên hoặc SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="card">
        {loading ? (
          <div className="flex justify-center align-center" style={{ minHeight: '300px' }}>
            <div className="loader"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center p-lg text-secondary">
            {products.length === 0 ? 'Chưa có sản phẩm nào.' : 'Không tìm thấy sản phẩm phù hợp.'}
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tên sản phẩm</th>
                  <th>Mã SKU</th>
                  <th>Đơn vị</th>
                  <th className="text-right">Giá bán</th>
                  <th>Trạng thái</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.name}</strong>
                    </td>
                    <td>
                      <code style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-secondary)' }}>
                        {product.sku}
                      </code>
                    </td>
                    <td>{product.unit}</td>
                    <td className="text-right">
                      <strong>{formatPrice(product.price)}</strong>
                    </td>
                    <td>
                      <span className="badge badge-completed">Hoạt động</span>
                    </td>
                    <td className="text-center">
                      <div className="flex justify-center gap-sm">
                        {canEdit && (
                          <button
                            className="btn btn-secondary"
                            onClick={() => openEditModal(product)}
                            style={{ padding: '6px 12px', fontSize: 'var(--text-xs)' }}
                          >
                            ✏️ Sửa
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            className="btn btn-danger"
                            onClick={() => openDeleteModal(product)}
                            style={{ padding: '6px 12px', fontSize: 'var(--text-xs)' }}
                          >
                            🗑️ Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="m-0 mb-md">Thêm sản phẩm mới</h3>
            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label className="form-label">Tên sản phẩm *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Thùng carton cỡ lớn"
                  required
                />
                {formErrors.name && <div className="form-error">{formErrors.name}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Mã SKU *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Ví dụ: CARTON-L-01"
                  required
                />
                {formErrors.sku && <div className="form-error">{formErrors.sku}</div>}
              </div>

              <div className="grid grid-2 gap-md">
                <div className="form-group">
                  <label className="form-label">Đơn vị tính *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="Ví dụ: cái, thùng, kg"
                    required
                  />
                  {formErrors.unit && <div className="form-error">{formErrors.unit}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Đơn giá (VND) *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className="form-input"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="Ví dụ: 150000"
                    required
                  />
                  {formErrors.price && <div className="form-error">{formErrors.price}</div>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mô tả chi tiết</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả công dụng, thông số kỹ thuật..."
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <div className="flex justify-end gap-sm mt-lg">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={actionLoading}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Đang xử lý...' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="m-0 mb-md">Cập nhật sản phẩm</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">Tên sản phẩm *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                {formErrors.name && <div className="form-error">{formErrors.name}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Mã SKU (Không thể thay đổi)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.sku}
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>

              <div className="grid grid-2 gap-md">
                <div className="form-group">
                  <label className="form-label">Đơn vị tính *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    required
                  />
                  {formErrors.unit && <div className="form-error">{formErrors.unit}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Đơn giá (VND) *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className="form-input"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                  {formErrors.price && <div className="form-error">{formErrors.price}</div>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mô tả chi tiết</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <div className="flex justify-end gap-sm mt-lg">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={actionLoading}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h3 className="m-0 mb-md text-error">⚠️ Xác nhận xóa sản phẩm</h3>
            <p className="mb-lg" style={{ lineHeight: '1.5' }}>
              Bạn có chắc chắn muốn xóa sản phẩm <strong>{selectedProduct?.name}</strong> (SKU:{' '}
              <code>{selectedProduct?.sku}</code>) không?
              <br />
              <span className="text-warning" style={{ fontSize: 'var(--text-xs)' }}>
                * Hành động này sẽ vô hiệu hóa sản phẩm trong hệ thống.
              </span>
            </p>
            <div className="flex justify-end gap-sm">
              <button
                className="btn btn-secondary"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={actionLoading}
              >
                Hủy
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteSubmit}
                disabled={actionLoading}
              >
                {actionLoading ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
