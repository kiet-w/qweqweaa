'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getBatches, createBatch } from '@/lib/api/batches';
import { getShippers } from '@/lib/api/shippers';
import { getOrders } from '@/lib/api/orders';
import { useToast } from '@/contexts/ToastContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/templates/AppLayout';
import { Button } from '@/components/atoms';
import { StatusBadge } from '@/components/molecules';
import { DataTable } from '@/components/organisms';

export default function DeliveryBatchesPage() {
  const [batches, setBatches] = useState([]);
  const [shippers, setShippers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedShipperId, setSelectedShipperId] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const { showToast } = useToast();
  const router = useRouter();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [batchesData, shippersData, ordersData] = await Promise.all([
        getBatches(),
        getShippers(),
        getOrders(),
      ]);

      setBatches(batchesData);
      setShippers(shippersData);

      // Collect all order IDs that are already in ANY batch
      const orderIdsInBatches = new Set(
        batchesData.flatMap((b) => b.orders.map((bo) => bo.orderId))
      );

      // Filter orders that are PENDING or ASSIGNED and NOT in any batch
      const availableOrders = ordersData.filter(
        (o) =>
          (o.status === 'PENDING' || o.status === 'ASSIGNED') &&
          !orderIdsInBatches.has(o.id)
      );
      setOrders(availableOrders);
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi tải dữ liệu đơn ghép', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleOrderToggle = (orderId) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!selectedShipperId) {
      showToast('Vui lòng chọn tài xế', 'warning');
      return;
    }
    if (selectedOrderIds.length === 0) {
      showToast('Vui lòng chọn ít nhất một đơn hàng', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        shipperId: parseInt(selectedShipperId, 10),
        orderIds: selectedOrderIds.map((id) => parseInt(id, 10)),
      };
      const newBatch = await createBatch(payload);
      showToast('Tạo và tối ưu tuyến giao hàng thành công!', 'success');
      setSelectedOrderIds([]);
      setSelectedShipperId('');
      // Redirect to detail page
      router.push(`/delivery-batches/${newBatch.id}`);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Không thể tạo đơn ghép';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const tableHeaders = [
    { label: 'Mã chuyến' },
    { label: 'Tài xế' },
    { label: 'Trạng thái' },
    { label: 'Khoảng cách' },
    { label: 'Thời gian' },
    { label: 'Số đơn', style: { textAlign: 'center' } },
    { label: 'Hành động' },
  ];

  const renderBatchRow = (batch) => (
    <tr key={batch.id}>
      <td>
        <strong>#{batch.id}</strong>
      </td>
      <td>{batch.shipper?.user?.name || `Shipper #${batch.shipperId}`}</td>
      <td>
        <StatusBadge status={batch.status} />
      </td>
      <td>
        {batch.totalDistanceM
          ? `${(batch.totalDistanceM / 1000).toFixed(2)} km`
          : '--'}
      </td>
      <td>
        {batch.estimatedDurationS
          ? `${Math.round(batch.estimatedDurationS / 60)} phút`
          : '--'}
      </td>
      <td className="text-center">{batch.orders?.length || 0}</td>
      <td>
        <Link href={`/delivery-batches/${batch.id}`} className="btn btn-secondary p-sm">
          Chi tiết
        </Link>
      </td>
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
          <div className="flex justify-between align-center mb-lg">
            <div>
              <h1 className="m-0 mb-xs" style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold' }}>Quản lý Đơn ghép & Tối ưu tuyến</h1>
              <p className="text-secondary m-0">Tạo nhóm đơn hàng tối ưu cho shipper và theo dõi lộ trình Mapbox.</p>
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '3fr 2fr', gap: 'var(--space-lg)', alignItems: 'start' }}>
            {/* Left column: list of batches */}
            <div className="card">
              <h3 className="m-0 mb-md">Danh sách Chuyến giao hàng ({batches.length})</h3>
              <DataTable
                headers={tableHeaders}
                data={batches}
                renderRow={renderBatchRow}
                emptyMessage="Chưa có chuyến giao hàng nào được tạo."
              />
            </div>

            {/* Right column: create batch form */}
            <div className="card">
              <h3 className="m-0 mb-md">Ghép đơn & Tối ưu lộ trình</h3>
              <form onSubmit={handleCreateBatch}>
                <div className="form-group">
                  <label className="form-label">Chọn Shipper phụ trách</label>
                  <select
                    className="form-input"
                    value={selectedShipperId}
                    onChange={(e) => setSelectedShipperId(e.target.value)}
                    required
                  >
                    <option value="">-- Chọn tài xế --</option>
                    {shippers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.user?.name} ({s.vehicleType || 'Chưa rõ xe'} - {s.isAvailable ? 'Sẵn sàng' : 'Bận'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Chọn đơn hàng để ghép ({selectedOrderIds.length})
                  </label>

                  {orders.length === 0 ? (
                    <div
                      className="p-md text-center text-secondary rounded-md"
                      style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' }}
                    >
                      Không có đơn hàng nào chờ gom chuyến (PENDING/ASSIGNED).
                    </div>
                  ) : (
                    <div
                      style={{
                        maxHeight: '300px',
                        overflowY: 'auto',
                        border: '1px solid var(--border-primary)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-tertiary)',
                      }}
                    >
                      <table className="data-table" style={{ border: 'none' }}>
                        <thead>
                          <tr>
                            <th style={{ width: '40px', padding: 'var(--space-sm)' }}> Chọn </th>
                            <th style={{ padding: 'var(--space-sm)' }}>Đơn hàng</th>
                            <th style={{ padding: 'var(--space-sm)' }}>Khách hàng & Địa chỉ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map((o) => (
                            <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => handleOrderToggle(o.id)}>
                              <td style={{ padding: 'var(--space-sm)' }} onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={selectedOrderIds.includes(o.id)}
                                  onChange={() => handleOrderToggle(o.id)}
                                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                              </td>
                              <td style={{ padding: 'var(--space-sm)' }}>
                                <strong>#{o.id}</strong>
                                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                                  {o.warehouse?.name}
                                </div>
                              </td>
                              <td style={{ padding: 'var(--space-sm)', fontSize: '12px' }}>
                                <div style={{ fontWeight: '500' }}>{o.recipientName}</div>
                                <div
                                  style={{
                                    color: 'var(--text-secondary)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: '180px',
                                  }}
                                  title={o.address}
                                >
                                  {o.address}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full mt-md"
                  disabled={submitting || selectedOrderIds.length === 0}
                >
                  {submitting ? 'Đang ghép & Tối ưu bằng Mapbox...' : 'Tạo chuyến & Tối ưu lộ trình 🚀'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
