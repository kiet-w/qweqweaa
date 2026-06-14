'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getOrderById, updateOrderStatus, assignShipper } from '@/lib/api/orders';
import { getAvailableShippers } from '@/lib/api/shippers';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/templates/AppLayout';
import { Button } from '@/components/atoms';
import { StatusBadge } from '@/components/molecules';
import { Modal, DataTable, PinMap } from '@/components/organisms';

export default function OrderDetailPage({ params }) {
  const unwrappedParams = React.use(params);
  const id = unwrappedParams.id;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal & Assignment states
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [shippers, setShippers] = useState([]);
  const [selectedShipperId, setSelectedShipperId] = useState('');

  const { showToast } = useToast();
  const { user, hasRole } = useAuth();

  const fetchOrderDetail = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOrderById(id);
      setOrder(data);
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi tải chi tiết đơn hàng', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrderDetail();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchOrderDetail]);

  // Load available shippers when opening assignment modal
  const handleOpenAssignModal = async () => {
    setActionLoading(true);
    try {
      const data = await getAvailableShippers();
      setShippers(data);
      setIsAssignModalOpen(true);
    } catch (err) {
      console.error(err);
      showToast('Không thể tải danh sách shipper khả dụng', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedShipperId) return;

    setActionLoading(true);
    try {
      await assignShipper(order.id, parseInt(selectedShipperId, 10));
      showToast('Gán shipper thành công!', 'success');
      setIsAssignModalOpen(false);
      setSelectedShipperId('');
      await fetchOrderDetail();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Lỗi khi gán shipper';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (nextStatus) => {
    if (!nextStatus) return;
    setActionLoading(true);
    try {
      await updateOrderStatus(order.id, nextStatus);
      showToast(`Cập nhật trạng thái sang ${getOrderLabel(nextStatus)} thành công!`, 'success');
      await fetchOrderDetail();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Lỗi khi cập nhật trạng thái';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getOrderLabel = (status) => {
    switch (status) {
      case 'PENDING':
        return 'Chờ xử lý';
      case 'ASSIGNED':
        return 'Đã gán';
      case 'PICKED_UP':
        return 'Đã lấy hàng';
      case 'IN_TRANSIT':
        return 'Đang giao';
      case 'DELIVERED':
        return 'Đã giao';
      case 'FAILED':
        return 'Thất bại';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center align-center h-full" style={{ minHeight: '400px' }}>
        <div className="loader"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="page-container text-center">
            <div className="card p-xl">
              <h2 className="text-error mb-md">Đơn hàng không tồn tại</h2>
              <p className="text-secondary mb-lg">Đơn giao hàng bạn yêu cầu không tìm thấy hoặc đã bị xóa.</p>
              <Link href="/delivery-orders" className="btn btn-primary">
                Quay lại danh sách
              </Link>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  // Get valid transitions for status guiding
  const validTransitions = {
    PENDING: ['ASSIGNED', 'CANCELLED'],
    ASSIGNED: ['PICKED_UP', 'CANCELLED'],
    PICKED_UP: ['IN_TRANSIT'],
    IN_TRANSIT: ['DELIVERED', 'FAILED'],
    DELIVERED: [],
    FAILED: ['PENDING'],
    CANCELLED: [],
  };

  const nextStates = validTransitions[order.status] || [];
  const canUpdateStatus =
    hasRole(['ADMIN', 'WAREHOUSE_MANAGER']) ||
    (hasRole(['SHIPPER']) && order.shipperId === parseInt(user?.id, 10));

  const itemHeaders = [
    { label: 'Sản phẩm' },
    { label: 'SKU' },
    { label: 'Giá bán', style: { textAlign: 'right' } },
    { label: 'Số lượng', style: { textAlign: 'center' } },
  ];

  const renderItemRow = (item) => (
    <tr key={item.id}>
      <td>
        <strong>{item.product?.name || `Sản phẩm #${item.productId}`}</strong>
      </td>
      <td>{item.product?.sku || '--'}</td>
      <td style={{ textAlign: 'right' }}>
        {item.product?.price ? `${parseInt(item.product.price, 10).toLocaleString('vi-VN')} VNĐ` : '--'}
      </td>
      <td style={{ textAlign: 'center' }}>{item.quantity}</td>
    </tr>
  );

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="page-container">
          {/* Header */}
          <div className="flex justify-between align-center mb-lg">
            <div>
              <h1 className="m-0 mb-xs" style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold' }}>
                Chi tiết Đơn giao hàng #{order.id}
              </h1>
              <p className="text-secondary m-0">Xem lộ trình, quản lý shipper phụ trách và thay đổi trạng thái đơn hàng.</p>
            </div>
            <Link href="/delivery-orders" className="btn btn-secondary">
              Quay lại danh sách
            </Link>
          </div>

          <div className="grid grid-2 gap-lg" style={{ alignItems: 'start' }}>
            {/* Left Side: Detail information */}
            <div className="flex flex-col gap-lg">
              <div className="card">
                <div className="flex justify-between align-center mb-md pb-sm" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <h3 className="m-0 text-primary">Thông tin chung</h3>
                  <StatusBadge status={order.status} />
                </div>

                <div className="grid grid-2 gap-md">
                  <div>
                    <p className="text-secondary m-0" style={{ fontSize: 'var(--text-xs)' }}>Người nhận</p>
                    <p className="m-0 mt-xs" style={{ fontWeight: 600 }}>{order.recipientName}</p>
                  </div>
                  <div>
                    <p className="text-secondary m-0" style={{ fontSize: 'var(--text-xs)' }}>Số điện thoại</p>
                    <p className="m-0 mt-xs" style={{ fontWeight: 600 }}>{order.recipientPhone}</p>
                  </div>
                </div>

                <div className="mt-md">
                  <p className="text-secondary m-0" style={{ fontSize: 'var(--text-xs)' }}>Địa chỉ nhận hàng</p>
                  <p className="m-0 mt-xs" style={{ fontWeight: 500 }}>{order.address}</p>
                </div>

                <div className="grid grid-2 gap-md mt-md">
                  <div>
                    <p className="text-secondary m-0" style={{ fontSize: 'var(--text-xs)' }}>Kho xuất hàng</p>
                    <p className="m-0 mt-xs" style={{ fontWeight: 500 }}>{order.warehouse?.name || `Kho #${order.warehouseId}`}</p>
                  </div>
                  <div>
                    <p className="text-secondary m-0" style={{ fontSize: 'var(--text-xs)' }}>Địa chỉ kho</p>
                    <p className="m-0 mt-xs" style={{ fontSize: 'var(--text-sm)' }}>{order.warehouse?.address || '--'}</p>
                  </div>
                </div>

                <div className="grid grid-2 gap-md mt-md">
                  <div>
                    <p className="text-secondary m-0" style={{ fontSize: 'var(--text-xs)' }}>Shipper phụ trách</p>
                    <p className="m-0 mt-xs" style={{ fontWeight: 600 }}>
                      {order.shipper?.user?.name || (
                        <span className="text-secondary" style={{ fontStyle: 'italic', fontWeight: 'normal' }}>
                          Chưa gán shipper
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-secondary m-0" style={{ fontSize: 'var(--text-xs)' }}>Phương tiện</p>
                    <p className="m-0 mt-xs" style={{ fontSize: 'var(--text-sm)' }}>{order.shipper?.vehicleType || '--'}</p>
                  </div>
                </div>

                {order.notes && (
                  <div className="mt-md">
                    <p className="text-secondary m-0" style={{ fontSize: 'var(--text-xs)' }}>Ghi chú</p>
                    <p className="m-0 mt-xs" style={{ fontStyle: 'italic' }}>{order.notes}</p>
                  </div>
                )}
              </div>

              {/* Action Card */}
              <div className="card">
                <h3 className="m-0 mb-md text-primary">Thao tác nghiệp vụ</h3>

                <div className="flex flex-col gap-md">
                  {/* Assign Shipper Action */}
                  {order.status === 'PENDING' && hasRole(['ADMIN', 'WAREHOUSE_MANAGER']) && (
                    <div style={{ padding: 'var(--space-md)', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                      <p className="m-0 mb-sm" style={{ fontSize: 'var(--text-sm)' }}>
                        Đơn hàng đang ở trạng thái <strong>Chờ xử lý</strong>. Vui lòng gán shipper để chuyển sang <strong>Đã gán</strong>.
                      </p>
                      <Button
                        variant="primary"
                        onClick={handleOpenAssignModal}
                        disabled={actionLoading}
                      >
                        Gán Shipper phụ trách
                      </Button>
                    </div>
                  )}

                  {/* Status transition dropdown selector */}
                  {canUpdateStatus && nextStates.length > 0 && (
                    <div style={{ padding: 'var(--space-md)', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                      <label className="form-label" style={{ fontWeight: 600 }}>Cập nhật trạng thái đơn hàng</label>
                      <div className="flex gap-md mt-sm align-center">
                        <select
                          className="form-input"
                          style={{ maxWidth: '250px' }}
                          value=""
                          onChange={(e) => handleStatusChange(e.target.value)}
                          disabled={actionLoading}
                        >
                          <option value="">-- Chọn trạng thái tiếp theo --</option>
                          {nextStates.map((state) => (
                            <option key={state} value={state}>
                              {getOrderLabel(state)}
                            </option>
                          ))}
                        </select>
                        <span className="text-secondary" style={{ fontSize: 'var(--text-xs)' }}>
                          Guiding: Các bước tiếp theo hợp lệ.
                        </span>
                      </div>
                    </div>
                  )}

                  {!canUpdateStatus && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                    <p className="text-secondary m-0" style={{ fontSize: 'var(--text-xs)', fontStyle: 'italic' }}>
                      Bạn không có quyền cập nhật trạng thái đơn hàng này.
                    </p>
                  )}

                  {(order.status === 'DELIVERED' || order.status === 'CANCELLED') && (
                    <div style={{ padding: 'var(--space-md)', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                      <p className="m-0 text-success" style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                        Đơn hàng đã hoàn thành vòng đời ({getOrderLabel(order.status)}). Không thể chuyển trạng thái khác.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side: Map & Items list */}
            <div className="flex flex-col gap-lg">
              {/* Small map visualization */}
              <div className="card" style={{ padding: 'var(--space-sm)' }}>
                <h4 className="m-0 mb-sm p-sm text-primary" style={{ fontSize: 'var(--text-md)' }}>Bản đồ vị trí giao hàng</h4>
                {order.lat && order.lng ? (
                  <div style={{ height: '280px', width: '100%' }}>
                    <PinMap lat={order.lat} lng={order.lng} popupText={`${order.recipientName} - ${order.address}`} />
                  </div>
                ) : (
                  <div
                    className="flex flex-col justify-center align-center text-secondary rounded-lg"
                    style={{ height: '280px', backgroundColor: 'var(--bg-tertiary)', border: '1px dashed var(--border-primary)' }}
                  >
                    <p className="m-0 mb-xs" style={{ fontWeight: 600 }}>Chưa định vị được tọa độ</p>
                    <p className="m-0 text-center p-md" style={{ fontSize: 'var(--text-xs)' }}>
                      Địa chỉ &quot;{order.address}&quot; chưa được geocode thành công hoặc bản đồ thiếu token.
                    </p>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="card">
                <h3 className="m-0 mb-md text-primary">Chi tiết các mặt hàng</h3>
                <DataTable
                  headers={itemHeaders}
                  data={order.items || []}
                  renderRow={renderItemRow}
                  emptyMessage="Không có sản phẩm nào trong đơn hàng."
                />
              </div>
            </div>
          </div>

          {/* Modal gán shipper */}
          <Modal
            isOpen={isAssignModalOpen}
            onClose={() => setIsAssignModalOpen(false)}
            title={`Gán Shipper cho Đơn #${order.id}`}
          >
            <form onSubmit={handleAssignSubmit}>
              <div className="form-group">
                <label className="form-label">Chọn tài xế khả dụng</label>
                {shippers.length === 0 ? (
                  <p className="text-warning m-0 mt-sm" style={{ fontSize: 'var(--text-sm)' }}>
                    Không có shipper nào đang sẵn sàng (available). Vui lòng cập nhật trạng thái shipper trước.
                  </p>
                ) : (
                  <select
                    className="form-input"
                    value={selectedShipperId}
                    onChange={(e) => setSelectedShipperId(e.target.value)}
                    required
                  >
                    <option value="">-- Chọn shipper --</option>
                    {shippers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.user?.name} ({s.vehicleType || 'Xe máy'})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex justify-end gap-md mt-lg">
                <Button
                  variant="secondary"
                  onClick={() => setIsAssignModalOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={actionLoading || !selectedShipperId || shippers.length === 0}
                >
                  {actionLoading ? 'Đang xử lý...' : 'Xác nhận gán'}
                </Button>
              </div>
            </form>
          </Modal>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
