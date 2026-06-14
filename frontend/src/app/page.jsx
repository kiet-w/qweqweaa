'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboardSummary, getTodayDashboardSummary } from '../lib/api/admin';
import { useToast } from '../contexts/ToastContext';
import ProtectedRoute from '../components/ProtectedRoute';
import AppLayout from '../components/templates/AppLayout';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [todaySummary, setTodaySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  const { showToast } = useToast();
  const router = useRouter();

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [summaryData, todayData] = await Promise.all([
        getDashboardSummary(),
        getTodayDashboardSummary(),
      ]);
      setSummary(summaryData);
      setTodaySummary(todayData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      if (!isSilent) {
        showToast('Không thể tải dữ liệu tổng quan', 'error');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDashboardData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchDashboardData]);

  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, fetchDashboardData]);

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex justify-center align-center h-full" style={{ minHeight: '400px' }}>
            <div className="loader"></div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  const successRate = todaySummary && todaySummary.ordersToday > 0
    ? Math.round((todaySummary.deliveredToday / todaySummary.ordersToday) * 100)
    : 0;

  return (
    <ProtectedRoute>
      <AppLayout>
        <div>
          {/* Top Header Section */}
          <div className="flex justify-between align-center mb-lg">
            <div>
              <h1 className="m-0 mb-xs" style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold' }}>Bảng điều khiển Logistics</h1>
              <p className="text-secondary m-0">Giám sát hoạt động kho bãi, đội ngũ giao nhận và tối ưu hóa vận hành.</p>
            </div>

            {/* Refresh controls */}
            <div className="flex align-center gap-md bg-secondary p-sm rounded-lg" style={{ border: '1px solid var(--border-primary)' }}>
              <div className="flex align-center gap-xs">
                <span
                  style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: autoRefreshEnabled ? 'var(--status-success)' : 'var(--text-tertiary)',
                    boxShadow: autoRefreshEnabled ? '0 0 8px var(--status-success)' : 'none',
                    animation: autoRefreshEnabled ? 'pulse 2s infinite' : 'none',
                  }}
                />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  {autoRefreshEnabled ? 'Tự động cập nhật (10s)' : 'Tự cập nhật tắt'}
                </span>
              </div>

              <style>
                {`
                  @keyframes pulse {
                    0% { opacity: 0.4; }
                    50% { opacity: 1; }
                    100% { opacity: 0.4; }
                  }
                `}
              </style>

              <button
                onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                className="btn btn-secondary p-xs"
                style={{ fontSize: '11px', padding: '4px 8px' }}
              >
                {autoRefreshEnabled ? 'Tạm dừng' : 'Bật'}
              </button>

              <button
                onClick={() => fetchDashboardData(true)}
                className="btn btn-primary p-xs"
                style={{ fontSize: '11px', padding: '4px 8px', minWidth: '60px' }}
                disabled={refreshing}
              >
                {refreshing ? '...' : 'Đồng bộ'}
              </button>

              {lastUpdated && (
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                  {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          {/* Grid: Today's Summary Metrics */}
          <h3 className="mb-sm text-secondary" style={{ fontSize: 'var(--text-sm)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Hoạt động hôm nay (Today's Activity)
          </h3>
          <div className="grid grid-3 mb-xl" style={{ gap: 'var(--space-lg)' }}>
            <div
              className="card card-interactive cursor-pointer flex justify-between align-center"
              onClick={() => router.push('/delivery-orders')}
              style={{ background: 'linear-gradient(135deg, #1e2235, #131524)' }}
            >
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>Đơn hàng mới nhận</div>
                <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'bold', margin: '8px 0', color: 'var(--text-primary)' }}>
                  {todaySummary?.ordersToday || 0}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--status-info)' }}>📦 Chờ điều phối xử lý</div>
              </div>
              <div style={{ fontSize: '3rem', opacity: 0.15 }}>📥</div>
            </div>

            <div
              className="card card-interactive cursor-pointer flex justify-between align-center"
              onClick={() => router.push('/delivery-orders')}
              style={{ background: 'linear-gradient(135deg, #172a27, #101d1b)' }}
            >
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>Đã giao thành công</div>
                <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'bold', margin: '8px 0', color: 'var(--status-success)' }}>
                  {todaySummary?.deliveredToday || 0}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--status-success)' }}>
                  📈 Tỉ lệ hoàn thành: {successRate}%
                </div>
              </div>
              <div style={{ fontSize: '3rem', opacity: 0.15 }}>🚚</div>
            </div>

            <div
              className="card card-interactive cursor-pointer flex justify-between align-center"
              onClick={() => router.push('/delivery-batches')}
              style={{ background: 'linear-gradient(135deg, #261f35, #191424)' }}
            >
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>Chuyến xe xuất phát</div>
                <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'bold', margin: '8px 0', color: '#a78bfa' }}>
                  {todaySummary?.batchesToday || 0}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: '#c084fc' }}>🗺️ Lộ trình tối ưu Mapbox</div>
              </div>
              <div style={{ fontSize: '3rem', opacity: 0.15 }}>🛣️</div>
            </div>
          </div>

          {/* Grid: Main KPI breakdown */}
          <h3 className="mb-sm text-secondary" style={{ fontSize: 'var(--text-sm)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Trạng thái tổng quát hệ thống (System Overview)
          </h3>
          <div className="grid grid-4 mb-xl" style={{ gap: 'var(--space-lg)' }}>
            <div className="card flex flex-col justify-between" style={{ minHeight: '180px' }}>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>Tổng số đơn hàng</div>
                <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'bold', margin: '6px 0' }}>{summary?.orders?.total || 0}</div>
              </div>
              <div style={{ fontSize: 'var(--text-xs)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div className="flex justify-between" style={{ color: 'var(--badge-pending-text)' }}>
                  <span>Chờ xử lý:</span>
                  <strong>{summary?.orders?.pending || 0} đơn</strong>
                </div>
                <div className="flex justify-between" style={{ color: 'var(--badge-transit-text)' }}>
                  <span>Đang giao:</span>
                  <strong>{summary?.orders?.inTransit || 0} đơn</strong>
                </div>
                <div className="flex justify-between" style={{ color: 'var(--badge-delivered-text)' }}>
                  <span>Đã hoàn thành:</span>
                  <strong>{summary?.orders?.delivered || 0} đơn</strong>
                </div>
              </div>
            </div>

            <div className="card flex flex-col justify-between" style={{ minHeight: '180px' }}>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>Chuyến xe gom đơn</div>
                <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'bold', margin: '6px 0', color: 'var(--accent-secondary)' }}>
                  {summary?.batches?.total || 0}
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--status-warning)' }}>
                    {summary?.batches?.active || 0}
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                    chuyến đang vận chuyển
                  </span>
                </div>
                <button
                  onClick={() => router.push('/delivery-batches')}
                  className="btn btn-secondary w-full p-xs"
                  style={{ fontSize: '12px' }}
                >
                  Xem danh sách chuyến
                </button>
              </div>
            </div>

            <div className="card flex flex-col justify-between" style={{ minHeight: '180px' }}>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>Shipper trực tuyến</div>
                <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'bold', margin: '6px 0', color: 'var(--status-success)' }}>
                  {summary?.shippers?.available || 0}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                  🟢 Shipper sẵn sàng nhận lộ trình và bốc xếp hàng hóa.
                </div>
                <button
                  onClick={() => router.push('/shippers')}
                  className="btn btn-secondary w-full p-xs"
                  style={{ fontSize: '12px' }}
                >
                  Quản lý shipper
                </button>
              </div>
            </div>

            <div className="card flex flex-col justify-between" style={{ minHeight: '180px' }}>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>Sản phẩm kinh doanh</div>
                <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'bold', margin: '6px 0', color: 'var(--status-info)' }}>
                  {summary?.products?.total || 0}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                  🏷️ Tổng số mã sản phẩm (SKU) có hiệu lực trong danh mục.
                </div>
                <button
                  onClick={() => router.push('/reports/inventory')}
                  className="btn btn-secondary w-full p-xs"
                  style={{ fontSize: '12px' }}
                >
                  Xem báo cáo tồn kho
                </button>
              </div>
            </div>
          </div>

          {/* Grid: Quick Links */}
          <h3 className="mb-sm text-secondary" style={{ fontSize: 'var(--text-sm)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Lối tắt thao tác nhanh (Quick Actions)
          </h3>
          <div className="grid grid-4" style={{ gap: 'var(--space-lg)' }}>
            <div
              className="card card-interactive cursor-pointer text-center p-md flex flex-col align-center justify-center gap-xs"
              onClick={() => router.push('/delivery-orders/new')}
              style={{ border: '1px dashed var(--accent-primary)' }}
            >
              <span style={{ fontSize: '24px' }}>➕</span>
              <strong style={{ fontSize: 'var(--text-sm)' }}>Tạo Đơn Hàng Mới</strong>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Nhập thông tin & Geocode tọa độ</span>
            </div>

            <div
              className="card card-interactive cursor-pointer text-center p-md flex flex-col align-center justify-center gap-xs"
              onClick={() => router.push('/delivery-batches')}
              style={{ border: '1px dashed var(--accent-secondary)' }}
            >
              <span style={{ fontSize: '24px' }}>🛣️</span>
              <strong style={{ fontSize: 'var(--text-sm)' }}>Ghép Chuyến & Tối Ưu</strong>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Tập hợp đơn và chạy Mapbox TSP</span>
            </div>

            <div
              className="card card-interactive cursor-pointer text-center p-md flex flex-col align-center justify-center gap-xs"
              onClick={() => router.push('/reports/shippers')}
              style={{ border: '1px dashed var(--status-success)' }}
            >
              <span style={{ fontSize: '24px' }}>📊</span>
              <strong style={{ fontSize: 'var(--text-sm)' }}>Hiệu Suất Shipper</strong>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Thời gian và quãng đường hoàn thành</span>
            </div>

            <div
              className="card card-interactive cursor-pointer text-center p-md flex flex-col align-center justify-center gap-xs"
              onClick={() => router.push('/reports/inventory')}
              style={{ border: '1px dashed var(--status-info)' }}
            >
              <span style={{ fontSize: '24px' }}>📈</span>
              <strong style={{ fontSize: 'var(--text-sm)' }}>Báo Cáo Tồn Kho</strong>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Thống kê nhập xuất tồn từng kho</span>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
