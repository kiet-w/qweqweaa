'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '@/lib/api/products';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/templates/AppLayout';
import { Button, Badge } from '@/components/atoms';
import { FormField, SearchBar } from '@/components/molecules';
import { Modal, DataTable } from '@/components/organisms';

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

  const tableHeaders = [
    { label: 'Tên sản phẩm' },
    { label: 'Mã SKU' },
    { label: 'Đơn vị' },
    { label: 'Giá bán', style: { textAlign: 'right' } },
    { label: 'Trạng thái' },
    { label: 'Thao tác', style: { textAlign: 'center' } },
  ];

  const renderProductRow = (product) => (
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
        <Badge variant="completed">Hoạt động</Badge>
      </td>
      <td className="text-center">
        <div className="flex justify-center gap-sm">
          {canEdit && (
            <Button
              variant="secondary"
              onClick={() => openEditModal(product)}
              style={{ padding: '6px 12px', fontSize: 'var(--text-xs)' }}
            >
              ✏️ Sửa
            </Button>
          )}
          {isAdmin && (
            <Button
              variant="danger"
              onClick={() => openDeleteModal(product)}
              style={{ padding: '6px 12px', fontSize: 'var(--text-xs)' }}
            >
              🗑️ Xóa
            </Button>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <ProtectedRoute>
      <AppLayout>
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
              <Button variant="primary" onClick={openAddModal}>
                <span>+ Thêm sản phẩm</span>
              </Button>
            )}
          </div>

          {/* Filter / Search section */}
          <div className="card mb-lg">
            <SearchBar
              placeholder="Tìm kiếm sản phẩm theo tên hoặc SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Products Table Card */}
          <div className="card">
            <DataTable
              headers={tableHeaders}
              data={filteredProducts}
              renderRow={renderProductRow}
              loading={loading}
              emptyMessage={products.length === 0 ? 'Chưa có sản phẩm nào.' : 'Không tìm thấy sản phẩm phù hợp.'}
            />
          </div>

          {/* Add Product Modal */}
          <Modal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            title="Thêm sản phẩm mới"
          >
            <form onSubmit={handleAddSubmit}>
              <FormField
                label="Tên sản phẩm *"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ví dụ: Thùng carton cỡ lớn"
                required
                error={formErrors.name}
              />

              <FormField
                label="Mã SKU *"
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="Ví dụ: CARTON-L-01"
                required
                error={formErrors.sku}
              />

              <div className="grid grid-2 gap-md">
                <FormField
                  label="Đơn vị tính *"
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="Ví dụ: cái, thùng, kg"
                  required
                  error={formErrors.unit}
                />

                <FormField
                  label="Đơn giá (VND) *"
                  type="number"
                  min="0"
                  step="any"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="Ví dụ: 150000"
                  required
                  error={formErrors.price}
                />
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
                <Button
                  variant="secondary"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={actionLoading}
                >
                  Hủy
                </Button>
                <Button type="submit" variant="primary" disabled={actionLoading}>
                  {actionLoading ? 'Đang xử lý...' : 'Thêm mới'}
                </Button>
              </div>
            </form>
          </Modal>

          {/* Edit Product Modal */}
          <Modal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            title="Cập nhật sản phẩm"
          >
            <form onSubmit={handleEditSubmit}>
              <FormField
                label="Tên sản phẩm *"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                error={formErrors.name}
              />

              <FormField
                label="Mã SKU (Không thể thay đổi)"
                type="text"
                value={formData.sku}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />

              <div className="grid grid-2 gap-md">
                <FormField
                  label="Đơn vị tính *"
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  required
                  error={formErrors.unit}
                />

                <FormField
                  label="Đơn giá (VND) *"
                  type="number"
                  min="0"
                  step="any"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  error={formErrors.price}
                />
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
                <Button
                  variant="secondary"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={actionLoading}
                >
                  Hủy
                </Button>
                <Button type="submit" variant="primary" disabled={actionLoading}>
                  {actionLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </form>
          </Modal>

          {/* Delete Confirmation Modal */}
          <Modal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            title="⚠️ Xác nhận xóa sản phẩm"
            maxWidth="400px"
          >
            <p className="mb-lg" style={{ lineHeight: '1.5' }}>
              Bạn có chắc chắn muốn xóa sản phẩm <strong>{selectedProduct?.name}</strong> (SKU:{' '}
              <code>{selectedProduct?.sku}</code>) không?
              <br />
              <span className="text-warning" style={{ fontSize: 'var(--text-xs)' }}>
                * Hành động này sẽ vô hiệu hóa sản phẩm trong hệ thống.
              </span>
            </p>
            <div className="flex justify-end gap-sm">
              <Button
                variant="secondary"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={actionLoading}
              >
                Hủy
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteSubmit}
                disabled={actionLoading}
              >
                {actionLoading ? 'Đang xóa...' : 'Xác nhận xóa'}
              </Button>
            </div>
          </Modal>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
