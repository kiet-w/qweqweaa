'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getOrders } from '@/lib/api/orders';
import { getWarehouses } from '@/lib/api/warehouses';
import { getShippers } from '@/lib/api/shippers';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/templates/AppLayout';
import { Button } from '@/components/atoms';
import { SearchBar, StatusBadge } from '@/components/molecules';
import { DataTable } from '@/components/organisms';

export default function DeliveryOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [shippers, setShippers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterWarehouseId, setFilterWarehouseId] = useState('');
  const [filterShipperId, setFilterShipperId] = useState('');

  const { showToast } = useToast();
  const { hasRole } = useAuth();

  const fetchOrdersData = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (filterStatus) filters.status = filterStatus;
      if (filterWarehouseId) filters.warehouseId = filterWarehouseId;
      if (filterShipperId) filters.shipperId = filterShipperId;
      const data = await getOrders(filters);
      setOrders(data);
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi tải danh sách đơn hàng', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterWarehouseId, filterShipperId, showToast]);

  // Initial fetch for metadata (warehouses, shippers)
  useEffect(() => {
    let active = true;
    const fetchMetadata = async () => {
      try {
        const [warehousesData, shippersData] = await Promise.all([
          getWarehouses(),
          getShippers(),
        ]);
        if (active) {
          setWarehouses(warehousesData);
          setShippers(shippersData);
        }
      } catch (err) {
        console.error(err);
      }
    };

    const timer = setTimeout(() => {
      fetchMetadata();
    }, 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  // Fetch orders when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrdersData();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchOrdersData]);

  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const idMatches = order.id.toString().includes(query);
    const nameMatches = order.recipientName?.toLowerCase().includes(query);
    const phoneMatches = order.recipientPhone?.toLowerCase().includes(query);
    const addressMatches = order.address?.toLowerCase().includes(query);
    return idMatches || nameMatches || phoneMatches || addressMatches;
  });

  const tableHeaders = [
    { label: 'Mã đơn' },
    { label: 'Người nhận' },
    { label: 'Số điện thoại' },
    { label: 'Địa chỉ' },
    { label: 'Kho hàng' },
    { label: 'Shipper' },
    { label: 'Trạng thái' },
    { label: 'Hành động', style: { width: '100px' } },
  ];

  const renderOrderRow = (order) => (
    <tr key={order.id}>
      <td>
        <strong>#{order.id}</strong>
      </td>
      <td>{order.recipientName}</td>
      <td>{order.recipientPhone}</td>
      <td
        style={{
          maxWidth: '250px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        title={order.address}
      >
        {order.address}
      </td>
      <td>{order.warehouse?.name || `Kho #${order.warehouseId}`}</td>
      <td>
        {order.shipper?.user?.name || (
          <span className="text-secondary" style={{ fontStyle: 'italic' }}>
            Chưa gán
          </span>
        )}
      </td>
      <td>
        <StatusBadge status={order.status} />
      </td>
      <td>
        <Link href={`/delivery-orders/${order.id}`} className="btn btn-secondary p-sm">
          Chi tiết
        </Link>
      </td>
    </tr>
  );

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="page-container">
          <div className="flex justify-between align-center mb-lg">
            <div>
              <h1 className="m-0 mb-xs" style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold' }}>Quản lý Đơn giao hàng</h1>
              <p className="text-secondary m-0">Xem danh sách, tìm kiếm, lọc và cập nhật trạng thái đơn giao hàng.</p>
            </div>
            {hasRole(['ADMIN', 'WAREHOUSE_MANAGER']) && (
              <Link href="/delivery-orders/new" className="btn btn-primary">
                + Tạo đơn hàng
              </Link>
            )}
          </div>

          <div className="card mb-lg">
            <div className="grid grid-4 gap-md" style={{ alignItems: 'end' }}>
              <div className="form-group mb-0">
                <label className="form-label">Tìm kiếm</label>
                <SearchBar
                  placeholder="Tên, SĐT, địa chỉ, mã..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="form-group mb-0">
                <label className="form-label">Trạng thái</label>
                <select
                  className="form-input"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="PENDING">Chờ xử lý</option>
                  <option value="ASSIGNED">Đã gán shipper</option>
                  <option value="PICKED_UP">Đã lấy hàng</option>
                  <option value="IN_TRANSIT">Đang giao</option>
                  <option value="DELIVERED">Đã giao</option>
                  <option value="FAILED">Thất bại</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </div>

              <div className="form-group mb-0">
                <label className="form-label">Kho hàng</label>
                <select
                  className="form-input"
                  value={filterWarehouseId}
                  onChange={(e) => setFilterWarehouseId(e.target.value)}
                >
                  <option value="">Tất cả kho</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group mb-0">
                <label className="form-label">Shipper</label>
                <select
                  className="form-input"
                  value={filterShipperId}
                  onChange={(e) => setFilterShipperId(e.target.value)}
                >
                  <option value="">Tất cả shipper</option>
                  {shippers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.user?.name || `Shipper #${s.id}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            <DataTable
              headers={tableHeaders}
              data={filteredOrders}
              renderRow={renderOrderRow}
              loading={loading}
              emptyMessage="Không tìm thấy đơn hàng nào."
            />
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
