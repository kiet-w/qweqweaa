'use client';

import React, { useState, useEffect } from 'react';
import { getWarehouses } from '@/lib/api/warehouses';
import { getInventoryReport } from '@/lib/api/admin';
import { useToast } from '@/contexts/ToastContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/templates/AppLayout';
import { Badge } from '@/components/atoms';
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

export default function InventoryReportPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const data = await getWarehouses();
        setWarehouses(data);
        if (data.length > 0) {
          setSelectedWarehouseId(data[0].id.toString());
        }
      } catch (err) {
        console.error(err);
        showToast('Không thể tải danh sách kho', 'error');
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(() => {
      fetchWarehouses().catch(console.error);
    }, 0);
    return () => clearTimeout(timer);
  }, [showToast]);

  useEffect(() => {
    if (!selectedWarehouseId) return;

    const fetchReport = async () => {
      setReportLoading(true);
      try {
        const data = await getInventoryReport(parseInt(selectedWarehouseId, 10));
        setReportData(data);
      } catch (err) {
        console.error(err);
        showToast('Không thể tải báo cáo tồn kho', 'error');
      } finally {
        setReportLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchReport().catch(console.error);
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedWarehouseId, showToast]);

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

  // Formatting chart data
  const chartData = reportData.map(item => ({
    name: item.sku,
    'Tồn hiện tại': item.currentStock,
    'Tổng Nhập': item.totalImport,
    'Tổng Xuất': item.totalExport,
  }));

  const reportHeaders = [
    { label: 'SKU' },
    { label: 'Tên sản phẩm' },
    { label: 'Nhập kho (+)' },
    { label: 'Xuất kho (-)' },
    { label: 'Điều chỉnh (±)' },
    { label: 'Hàng trả về (+)' },
    { label: 'Tồn lý thuyết' },
    { label: 'Tồn thực tế' },
    { label: 'Chênh lệch' },
  ];

  const renderReportRow = (row) => (
    <tr key={row.productId}>
      <td><strong>{row.sku}</strong></td>
      <td>{row.productName}</td>
      <td className="text-success">+{row.totalImport}</td>
      <td className="text-error">-{row.totalExport}</td>
      <td style={{ color: row.totalAdjustment < 0 ? 'var(--status-error)' : row.totalAdjustment > 0 ? 'var(--status-success)' : 'var(--text-secondary)' }}>
        {row.totalAdjustment > 0 ? `+${row.totalAdjustment}` : row.totalAdjustment}
      </td>
      <td style={{ color: 'var(--accent-secondary)' }}>+{row.totalReturn}</td>
      <td>{row.expectedBalance}</td>
      <td><strong>{row.currentStock}</strong></td>
      <td>
        {row.discrepancy === 0 ? (
          <Badge variant="completed" style={{ color: 'var(--status-success)', backgroundColor: 'rgba(34,197,94,0.1)' }}>Khớp</Badge>
        ) : (
          <Badge variant="failed" style={{ fontWeight: 'bold' }}>
            {row.discrepancy > 0 ? `+${row.discrepancy} (Thừa)` : `${row.discrepancy} (Thiếu)`}
          </Badge>
        )}
      </td>
    </tr>
  );

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="page-container">
          <div className="flex justify-between align-center mb-lg">
            <div>
              <h1 className="m-0 mb-xs" style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold' }}>Báo cáo Đối soát Tồn kho</h1>
              <p className="text-secondary m-0">So sánh số lượng nhập/xuất/điều chỉnh thực tế và chênh lệch tồn kho.</p>
            </div>

            <div className="flex align-center gap-sm">
              <label className="form-label m-0" style={{ marginRight: '8px' }}>Chọn kho bãi:</label>
              <select
                className="form-input"
                style={{ width: '220px' }}
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {reportLoading ? (
            <div className="flex justify-center align-center" style={{ minHeight: '300px' }}>
              <div className="loader"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-lg">
              {/* Recharts chart */}
              {reportData.length > 0 && (
                <div className="card">
                  <h3 className="m-0 mb-md">Biểu đồ so sánh tồn kho theo SKU</h3>
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
                        <Bar dataKey="Tồn hiện tại" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Tổng Nhập" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Tổng Xuất" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Data grid */}
              <div className="card">
                <h3 className="m-0 mb-md">Bảng số liệu chi tiết đối soát tồn kho</h3>
                <DataTable
                  headers={reportHeaders}
                  data={reportData}
                  renderRow={renderReportRow}
                  emptyMessage="Kho bãi được chọn chưa có hàng hóa hoặc giao dịch tồn kho nào."
                />
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
