'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createOrder } from '@/lib/api/orders';
import { getWarehouses } from '@/lib/api/warehouses';
import { getAvailableShippers } from '@/lib/api/shippers';
import { getProducts } from '@/lib/api/products';
import { useToast } from '@/contexts/ToastContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/templates/AppLayout';
import { Button } from '@/components/atoms';
import { FormField } from '@/components/molecules';

export default function CreateOrderPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [shippers, setShippers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [address, setAddress] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [shipperId, setShipperId] = useState('');
  const [items, setItems] = useState([{ productId: '', quantity: 1 }]);

  const { showToast } = useToast();
  const router = useRouter();

  const fetchMetadata = useCallback(async () => {
    setLoading(true);
    try {
      const [warehousesData, shippersData, productsData] = await Promise.all([
        getWarehouses(),
        getAvailableShippers(),
        getProducts(),
      ]);
      setWarehouses(warehousesData);
      setShippers(shippersData);
      setProducts(productsData);
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi tải thông tin cấu hình đơn hàng', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMetadata();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchMetadata]);

  const handleAddItem = () => {
    setItems([...items, { productId: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!recipientName.trim()) {
      showToast('Vui lòng nhập tên người nhận', 'warning');
      return;
    }
    if (!recipientPhone.trim()) {
      showToast('Vui lòng nhập số điện thoại người nhận', 'warning');
      return;
    }
    if (!address.trim()) {
      showToast('Vui lòng nhập địa chỉ giao hàng', 'warning');
      return;
    }
    if (!warehouseId) {
      showToast('Vui lòng chọn kho xuất hàng', 'warning');
      return;
    }

    // Validate items
    const invalidItems = items.some(item => !item.productId || item.quantity < 1);
    if (invalidItems) {
      showToast('Vui lòng chọn đầy đủ sản phẩm và số lượng hợp lệ (>= 1)', 'warning');
      return;
    }

    // Check for duplicate products
    const productIds = items.map(item => item.productId);
    const hasDuplicates = productIds.length !== new Set(productIds).size;
    if (hasDuplicates) {
      showToast('Sản phẩm trong danh sách không được trùng lặp', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        address: address.trim(),
        warehouseId: parseInt(warehouseId, 10),
        items: items.map(item => ({
          productId: parseInt(item.productId, 10),
          quantity: parseInt(item.quantity, 10),
        })),
      };

      if (shipperId) {
        payload.shipperId = parseInt(shipperId, 10);
      }

      const newOrder = await createOrder(payload);
      showToast('Tạo đơn giao hàng thành công!', 'success');
      router.push(`/delivery-orders/${newOrder.id}`);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Không thể tạo đơn giao hàng';
      showToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
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
    <ProtectedRoute>
      <AppLayout>
        <div className="page-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div className="flex justify-between align-center mb-lg">
            <div>
              <h1 className="m-0 mb-xs" style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold' }}>Tạo Đơn giao hàng mới</h1>
              <p className="text-secondary m-0">Nhập địa chỉ giao hàng (sẽ được tự động định vị tọa độ) và các mặt hàng cần xuất.</p>
            </div>
            <Link href="/delivery-orders" className="btn btn-secondary">
              Quay lại danh sách
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
            {/* Recipient and Origin Config */}
            <div className="card grid grid-2 gap-lg">
              <div className="flex flex-col gap-md">
                <h3 className="m-0 text-primary">Thông tin người nhận</h3>
                
                <FormField
                  label="Tên người nhận *"
                  type="text"
                  placeholder="Nhập họ và tên..."
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  required
                />

                <FormField
                  label="Số điện thoại *"
                  type="text"
                  placeholder="Nhập số điện thoại liên lạc..."
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  required
                />

                <FormField
                  label="Địa chỉ nhận hàng *"
                  type="text"
                  placeholder="Địa chỉ chi tiết (hệ thống sẽ geocode)..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-md">
                <h3 className="m-0 text-primary">Nguồn xuất hàng & Vận chuyển</h3>

                <div className="form-group">
                  <label className="form-label">Kho xuất hàng *</label>
                  <select
                    className="form-input"
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    required
                  >
                    <option value="">-- Chọn kho xuất hàng --</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.address})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Giao cho Shipper (Không bắt buộc)</label>
                  <select
                    className="form-input"
                    value={shipperId}
                    onChange={(e) => setShipperId(e.target.value)}
                  >
                    <option value="">-- Chưa gán (Giao sau) --</option>
                    {shippers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.user?.name} ({s.vehicleType || 'Chưa rõ xe'} - {s.isAvailable ? 'Sẵn sàng' : 'Bận'})
                      </option>
                    ))}
                  </select>
                  <p className="text-secondary m-0 mt-xs" style={{ fontSize: 'var(--text-xs)' }}>
                    Chỉ hiển thị các shipper đang ở trạng thái sẵn sàng (available).
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items Table */}
            <div className="card">
              <div className="flex justify-between align-center mb-md">
                <h3 className="m-0 text-primary">Danh sách sản phẩm xuất hàng</h3>
                <Button
                  variant="secondary"
                  className="btn-sm"
                  onClick={handleAddItem}
                >
                  + Thêm sản phẩm
                </Button>
              </div>

              <div className="table-container mb-md">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th style={{ width: '150px' }}>Số lượng</th>
                      <th style={{ width: '80px', textAlign: 'center' }}>Xóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <select
                            className="form-input"
                            value={item.productId}
                            onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                            required
                          >
                            <option value="">-- Chọn sản phẩm --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (SKU: {p.sku})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-input"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value, 10) || 0)}
                            required
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <Button
                            variant="danger"
                            className="p-xs"
                            style={{ borderRadius: 'var(--radius-sm)' }}
                            disabled={items.length === 1}
                            onClick={() => handleRemoveItem(index)}
                          >
                            Xóa
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-md">
              <Link href="/delivery-orders" className="btn btn-secondary">
                Hủy bỏ
              </Link>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
              >
                {submitting ? 'Đang xử lý...' : 'Tạo đơn hàng'}
              </Button>
            </div>
          </form>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
