'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getShipperPerformanceReport } from '@/lib/api/admin';
import { useToast } from '@/contexts/ToastContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/templates/AppLayout';
import { Button } from '@/components/atoms';
import { FormField } from '@/components/molecules';
import { DataTable } from '@/components/organisms';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function ShipperPerformancePage() {
  const [reportData, setReportData] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const start = startDate ? new Date(startDate).toISOString() : undefined;
      const end = endDate ? new Date(endDate).toISOString() : undefined;
      const data = await getShipperPerformanceReport(start, end);
      setReportData(data);
    } catch (err) {
      console.error(err);
      showToast('Không thể tải báo cáo hiệu suất shipper', 'error');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReport();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchReport]);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchReport();
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setTimeout(() => {
      setLoading(true);
      getShipperPerformanceReport()
        .then((data) => setReportData(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }, 0);
  };

  // Format Recharts data
  const chartData = reportData.map(item => ({
    name: item.name,
    'Tổng chuyến': item.totalBatches,
    'Hoàn thành': item.completedBatches,
    'Quãng đường (km)': item.totalDistanceKm,
  }));

  const reportHeaders = [
    { label: 'Shipper ID' },
    { label: 'Họ và tên' },
    { label: 'Tổng số chuyến gom' },
    { label: 'Chuyến hoàn thành' },
    { label: 'Số đơn hàng đã giao' },
    { label: 'Tổng quãng đường (km)' },
    { label: 'Tỷ lệ hoàn thành chuyến' },
  ];

  const renderReportRow = (row) => {
    const completionRate = row.totalBatches > 0
      ? Math.round((row.completedBatches / row.totalBatches) * 100)
      : 0;

    return (
      <tr key={row.shipperId}>
        <td><strong>#{row.shipperId}</strong></td>
        <td>{row.name}</td>
        <td>{row.totalBatches}</td>
        <td className="text-success">{row.completedBatches}</td>
        <td>{row.totalOrders}</td>
        <td style={{ color: 'var(--accent-primary)', fontWeight: '500' }}>{row.totalDistanceKm} km</td>
        <td>
          <div className="flex align-center gap-xs">
            <span style={{ fontWeight: 'bold', marginRight: '6px' }}>{completionRate}%</span>
            <div
              style={{
                width: '60px',
                height: '6px',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '3px',
                overflow: 'hidden',
                display: 'inline-block',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${completionRate}%`,
                  backgroundColor: completionRate >= 80 ? 'var(--status-success)' : completionRate >= 50 ? 'var(--status-warning)' : 'var(--status-error)',
                }}
              />
            </div>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="page-container">
          <div className="flex justify-between align-center mb-lg">
            <div>
              <h1 className="m-0 mb-xs" style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold' }}>Hiệu suất Tài xế (Shipper Performance)</h1>
              <p className="text-secondary m-0">Đánh giá số lượng chuyến hàng, tỷ lệ giao thành công và quãng đường di chuyển.</p>
            </div>
          </div>

          {/* Date filter form */}
          <div className="card mb-xl">
            <form onSubmit={handleFilter} className="flex align-center gap-md" style={{ flexWrap: 'wrap' }}>
              <div style={{ minWidth: '180px' }}>
                <FormField
                  label="Từ ngày"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div style={{ minWidth: '180px' }}>
                <FormField
                  label="Đến ngày"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="flex gap-sm align-end" style={{ marginTop: '20px' }}>
                <Button type="submit" variant="primary">
                  🔍 Lọc báo cáo
                </Button>
                <Button type="button" onClick={handleReset} variant="secondary">
                  Đặt lại
                </Button>
              </div>
            </form>
          </div>

          {loading ? (
            <div className="flex justify-center align-center" style={{ minHeight: '300px' }}>
              <div className="loader"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-lg">
              {/* Chart Section */}
              {reportData.length > 0 && (
                <div className="grid grid-2" style={{ gap: 'var(--space-lg)' }}>
                  {/* Batches Chart */}
                  <div className="card">
                    <h3 className="m-0 mb-md">Số chuyến gom vs Số chuyến hoàn thành</h3>
                    <div style={{ width: '100%', height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3e" />
                          <XAxis dataKey="name" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'var(--surface-popover)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                            itemStyle={{ color: 'var(--text-primary)' }}
                          />
                          <Legend wrapperStyle={{ color: '#94a3b8' }} />
                          <Bar dataKey="Tổng chuyến" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Hoàn thành" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Distance Chart */}
                  <div className="card">
                    <h3 className="m-0 mb-md">Quãng đường đã di chuyển (km)</h3>
                    <div style={{ width: '100%', height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3e" />
                          <XAxis dataKey="name" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'var(--surface-popover)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                            itemStyle={{ color: 'var(--text-primary)' }}
                          />
                          <Legend wrapperStyle={{ color: '#94a3b8' }} />
                          <Bar dataKey="Quãng đường (km)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Table list */}
              <div className="card">
                <h3 className="m-0 mb-md">Bảng số liệu chi tiết hiệu suất shipper</h3>
                <DataTable
                  headers={reportHeaders}
                  data={reportData}
                  renderRow={renderReportRow}
                  emptyMessage="Không có dữ liệu trong khoảng thời gian đã chọn."
                />
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
