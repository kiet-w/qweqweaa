'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getBatchById, optimizeBatch, startBatch, completeBatch } from '@/lib/api/batches';
import { useToast } from '@/contexts/ToastContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/templates/AppLayout';
import { Button } from '@/components/atoms';
import { StatusBadge } from '@/components/molecules';
import { RouteMap } from '@/components/organisms';

export default function BatchDetailPage({ params }) {
  const unwrappedParams = React.use(params);
  const id = unwrappedParams.id;

  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { showToast } = useToast();

  const fetchBatch = useCallback(async () => {
    try {
      const data = await getBatchById(parseInt(id, 10));
      setBatch(data);
    } catch (err) {
      console.error(err);
      showToast('Không thể tải thông tin chuyến giao hàng', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBatch();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchBatch]);

  const handleOptimize = async () => {
    setActionLoading(true);
    try {
      await optimizeBatch(batch.id);
      showToast('Đã tối ưu lại tuyến đường bằng Mapbox!', 'success');
      await fetchBatch();
    } catch (err) {
      console.error(err);
      showToast('Tối ưu tuyến đường thất bại', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = async () => {
    setActionLoading(true);
    try {
      await startBatch(batch.id);
      showToast('Bắt đầu chuyến giao hàng!', 'success');
      await fetchBatch();
    } catch (err) {
      console.error(err);
      showToast('Không thể bắt đầu chuyến giao hàng', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    setActionLoading(true);
    try {
      await completeBatch(batch.id);
      showToast('Hoàn thành chuyến giao hàng!', 'success');
      await fetchBatch();
    } catch (err) {
      console.error(err);
      showToast('Không thể kết thúc chuyến giao hàng', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PLANNING':
        return 'Đang lập kế hoạch';
      case 'OPTIMIZED':
        return 'Đã tối ưu';
      case 'IN_PROGRESS':
        return 'Đang giao hàng';
      case 'COMPLETED':
        return 'Hoàn thành';
      default:
        return status;
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

  if (!batch) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="page-container">
            <div className="card text-center p-xl">
              <h2>Không tìm thấy chuyến giao hàng</h2>
              <p className="text-secondary">Chuyến giao hàng với ID #{id} không tồn tại hoặc đã bị xóa.</p>
              <Link href="/delivery-batches" className="btn btn-primary mt-md">
                Quay lại danh sách
              </Link>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  const warehouse = batch.orders?.[0]?.order?.warehouse;
  const stops = batch.orders.map((bo) => ({
    order: bo.order,
    sequenceOrder: bo.sequenceOrder,
  }));
  const geometry = batch.optimizedRoute?.geometry;

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="page-container">
          {/* Top Bar */}
          <div className="flex justify-between align-center mb-lg">
            <div className="flex align-center gap-md">
              <Link href="/delivery-batches" className="btn btn-secondary p-sm">
                ← Quay lại
              </Link>
              <div>
                <h1 className="m-0 flex align-center gap-sm" style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold' }}>
                  Chuyến giao hàng #{batch.id}
                  <StatusBadge status={batch.status} />
                </h1>
              </div>
            </div>

            <div className="flex gap-sm">
              {(batch.status === 'PLANNING' || batch.status === 'OPTIMIZED') && (
                <Button
                  onClick={handleOptimize}
                  variant="secondary"
                  disabled={actionLoading}
                >
                  🔄 Tối ưu lại tuyến đường
                </Button>
              )}

              {batch.status === 'OPTIMIZED' && (
                <Button
                  onClick={handleStart}
                  variant="primary"
                  disabled={actionLoading}
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #eab308)', border: 'none' }}
                >
                  🚚 Bắt đầu giao hàng
                </Button>
              )}

              {batch.status === 'IN_PROGRESS' && (
                <Button
                  onClick={handleComplete}
                  variant="primary"
                  disabled={actionLoading}
                  style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', border: 'none' }}
                >
                  ✓ Hoàn thành chuyến đi
                </Button>
              )}
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid" style={{ gridTemplateColumns: '4fr 3fr', gap: 'var(--space-lg)', alignItems: 'start' }}>
            {/* Left Column: Map and Summary */}
            <div className="flex flex-col gap-lg">
              {/* Mapbox Route Map */}
              <div className="card" style={{ padding: 'var(--space-sm)' }}>
                <div style={{ height: '400px', width: '100%' }}>
                  <RouteMap warehouse={warehouse} stops={stops} geometry={geometry} />
                </div>
              </div>

              {/* Trip Summary */}
              <div className="card">
                <h3 className="m-0 mb-md">Tóm tắt hành trình</h3>
                <div className="grid grid-2" style={{ gap: 'var(--space-md)' }}>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', textTransform: 'uppercase' }}>Tài xế</div>
                    <div style={{ fontWeight: '600', fontSize: 'var(--text-lg)' }}>{batch.shipper?.user?.name || `Shipper #${batch.shipperId}`}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Phương tiện: {batch.shipper?.vehicleType || 'Chưa rõ'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', textTransform: 'uppercase' }}>Kho xuất phát</div>
                    <div style={{ fontWeight: '600', fontSize: 'var(--text-lg)' }}>{warehouse?.name || 'Chưa rõ'}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{warehouse?.address}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', textTransform: 'uppercase' }}>Quãng đường</div>
                    <div style={{ fontWeight: '600', fontSize: 'var(--text-lg)', color: 'var(--accent-primary)' }}>
                      {batch.totalDistanceM ? `${(batch.totalDistanceM / 1000).toFixed(2)} km` : 'Chưa tính'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', textTransform: 'uppercase' }}>Thời gian ước tính</div>
                    <div style={{ fontWeight: '600', fontSize: 'var(--text-lg)', color: 'var(--accent-primary)' }}>
                      {batch.estimatedDurationS ? `${Math.round(batch.estimatedDurationS / 60)} phút` : 'Chưa tính'}
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div style={{ borderTop: '1px solid var(--border-primary)', marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)' }}>
                  <div className="grid grid-2" style={{ gap: 'var(--space-md)', fontSize: '13px' }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Khởi hành: </span>
                      {batch.startedAt ? new Date(batch.startedAt).toLocaleString() : 'Chờ khởi hành'}
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Hoàn thành: </span>
                      {batch.completedAt ? new Date(batch.completedAt).toLocaleString() : 'Chưa hoàn thành'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Ordered stops list */}
            <div className="card">
              <h3 className="m-0 mb-md">Thứ tự các điểm giao (Sequenced Stops)</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', position: 'relative' }}>
                {/* Timeline connector line */}
                <div
                  style={{
                    position: 'absolute',
                    left: '20px',
                    top: '25px',
                    bottom: '25px',
                    width: '2px',
                    backgroundColor: 'var(--border-secondary)',
                    zIndex: 0,
                  }}
                />

                {/* Warehouse start node */}
                {warehouse && (
                  <div className="flex gap-md" style={{ zIndex: 1 }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#8b5cf6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 'bold',
                        boxShadow: '0 0 10px rgba(139, 92, 246, 0.4)',
                        flexShrink: 0,
                      }}
                    >
                      🚀
                    </div>
                    <div style={{ flexGrow: 1, backgroundColor: 'var(--bg-tertiary)', padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#8b5cf6' }}>ĐIỂM XUẤT PHÁT KHO</div>
                      <div style={{ fontWeight: '500', fontSize: '14px' }}>{warehouse.name}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{warehouse.address}</div>
                    </div>
                  </div>
                )}

                {/* Stops */}
                {batch.orders.map((bo, index) => {
                  const order = bo.order;

                  return (
                    <div key={bo.id} className="flex gap-md" style={{ zIndex: 1 }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--accent-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 'bold',
                          boxShadow: '0 0 10px rgba(99, 102, 241, 0.4)',
                          flexShrink: 0,
                        }}
                      >
                        {bo.sequenceOrder ?? (index + 1)}
                      </div>
                      <div style={{ flexGrow: 1, backgroundColor: 'var(--bg-secondary)', padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-primary)' }}>
                        <div className="flex justify-between align-center mb-xs">
                          <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Đơn hàng #{order.id}</span>
                          <StatusBadge status={order.status} />
                        </div>

                        <div style={{ fontSize: '13px', marginBottom: 'var(--space-xs)' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Khách hàng: </span>
                          <strong>{order.recipientName}</strong> ({order.recipientPhone})
                        </div>

                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
                          📍 {order.address}
                        </div>

                        <div style={{ borderTop: '1px dashed var(--border-primary)', paddingTop: 'var(--space-xs)', fontSize: '12px' }}>
                          <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Sản phẩm: </span>
                          {order.items?.map((item) => (
                            <span key={item.id} style={{ display: 'inline-block', backgroundColor: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px', marginRight: '6px', marginTop: '2px' }}>
                              {item.product?.name} x{item.quantity}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Return node if warehouse exists */}
                {warehouse && (
                  <div className="flex gap-md" style={{ zIndex: 1 }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#22c55e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 'bold',
                        boxShadow: '0 0 10px rgba(34, 197, 94, 0.4)',
                        flexShrink: 0,
                      }}
                    >
                      🏁
                    </div>
                    <div style={{ flexGrow: 1, backgroundColor: 'var(--bg-tertiary)', padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#22c55e' }}>KẾT THÚC HÀNH TRÌNH</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Quay trở lại {warehouse.name}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
