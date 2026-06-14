'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '@/lib/api/warehouses';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/templates/AppLayout';
import { Button, Badge } from '@/components/atoms';
import { FormField, SearchBar } from '@/components/molecules';
import { Modal, DataTable } from '@/components/organisms';

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  const { showToast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const isAdmin = user?.role === 'ADMIN';
  const canManage = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE_MANAGER';

  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWarehouses();
      setWarehouses(data);
    } catch (err) {
      console.error(err);
      showToast('Không thể tải danh sách kho bãi', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWarehouses().catch(console.error);
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchWarehouses]);

  const handleOpenAddModal = () => {
    setName('');
    setAddress('');
    setLat('');
    setLng('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setName(warehouse.name);
    setAddress(warehouse.address);
    setLat(warehouse.lat ? warehouse.lat.toString() : '');
    setLng(warehouse.lng ? warehouse.lng.toString() : '');
    setIsEditModalOpen(true);
  };

  const handleAddWarehouse = async (e) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      showToast('Vui lòng điền tên và địa chỉ kho', 'warning');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        name,
        address,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
      };
      await createWarehouse(payload);
      showToast('Thêm kho bãi thành công!', 'success');
      setIsAddModalOpen(false);
      await fetchWarehouses();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Không thể tạo kho bãi';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditWarehouse = async (e) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      showToast('Vui lòng điền tên và địa chỉ kho', 'warning');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        name,
        address,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
      };
      await updateWarehouse(selectedWarehouse.id, payload);
      showToast('Cập nhật kho bãi thành công!', 'success');
      setIsEditModalOpen(false);
      await fetchWarehouses();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Không thể cập nhật thông tin';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteWarehouse = async (id, warehouseName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa kho bãi "${warehouseName}" không?`)) {
      return;
    }

    try {
      await deleteWarehouse(id);
      showToast('Đã xóa kho bãi thành công!', 'success');
      await fetchWarehouses();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Không thể xóa kho bãi';
      showToast(msg, 'error');
    }
  };

  const filteredWarehouses = warehouses.filter((w) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tableHeaders = [
    { label: 'Mã kho' },
    { label: 'Tên kho bãi' },
    { label: 'Địa chỉ' },
    { label: 'Vĩ độ (Lat)' },
    { label: 'Kinh độ (Lng)' },
    { label: 'Trạng thái' },
    { label: 'Hành động' },
  ];

  const renderWarehouseRow = (w) => (
    <tr key={w.id}>
      <td>
        <strong>#{w.id}</strong>
      </td>
      <td>{w.name}</td>
      <td>{w.address}</td>
      <td>{w.lat !== null ? w.lat.toFixed(4) : <span className="text-tertiary">N/A</span>}</td>
      <td>{w.lng !== null ? w.lng.toFixed(4) : <span className="text-tertiary">N/A</span>}</td>
      <td>
        <Badge variant={w.isActive ? 'completed' : 'failed'}>
          {w.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
        </Badge>
      </td>
      <td>
        <div className="flex gap-xs">
          <Button
            onClick={() => router.push(`/warehouses/${w.id}/stock`)}
            variant="secondary"
            className="btn-sm"
          >
            📦 Xem tồn kho
          </Button>
          {canManage && (
            <Button
              onClick={() => handleOpenEditModal(w)}
              variant="secondary"
              className="btn-sm"
            >
              ✏️ Sửa
            </Button>
          )}
          {isAdmin && (
            <Button
              onClick={() => handleDeleteWarehouse(w.id, w.name)}
              variant="danger"
              className="btn-sm"
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
          {/* Header */}
          <div className="flex justify-between align-center mb-lg">
            <div>
              <h1 className="m-0 mb-xs" style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold' }}>Quản lý Kho bãi</h1>
              <p className="text-secondary m-0">Quản lý mạng lưới các địa điểm kho lưu trữ sản phẩm và xuất nhập kho.</p>
            </div>

            {canManage && (
              <Button onClick={handleOpenAddModal} variant="primary">
                ➕ Thêm kho bãi
              </Button>
            )}
          </div>

          {/* Filter and Content */}
          <div className="card">
            <div className="flex justify-between align-center mb-md" style={{ gap: 'var(--space-md)' }}>
              <div style={{ flex: '1', maxWidth: '350px' }}>
                <SearchBar
                  placeholder="Tìm kiếm theo tên hoặc địa chỉ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                Tổng số: <strong>{filteredWarehouses.length}</strong> kho bãi
              </span>
            </div>

            <DataTable
              headers={tableHeaders}
              data={filteredWarehouses}
              renderRow={renderWarehouseRow}
              loading={loading}
              emptyMessage="Không tìm thấy kho bãi nào phù hợp."
            />
          </div>

          {/* Add Warehouse Modal */}
          <Modal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            title="Thêm kho bãi mới"
          >
            <form onSubmit={handleAddWarehouse}>
              <FormField
                label="Tên kho bãi *"
                type="text"
                required
                placeholder="Ví dụ: Kho Quận 1"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <FormField
                label="Địa chỉ *"
                type="text"
                required
                placeholder="Ví dụ: 123 Nguyễn Huệ, Quận 1, TP.HCM"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />

              <div className="grid grid-2 gap-md mb-lg">
                <FormField
                  label="Vĩ độ (Latitude)"
                  type="number"
                  step="0.000001"
                  placeholder="Ví dụ: 10.7731"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                />
                <FormField
                  label="Kinh độ (Longitude)"
                  type="number"
                  step="0.000001"
                  placeholder="Ví dụ: 106.7030"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-md">
                <Button
                  onClick={() => setIsAddModalOpen(false)}
                  variant="secondary"
                  disabled={actionLoading}
                >
                  Hủy bỏ
                </Button>
                <Button type="submit" variant="primary" disabled={actionLoading}>
                  {actionLoading ? 'Đang tạo...' : 'Tạo kho bãi'}
                </Button>
              </div>
            </form>
          </Modal>

          {/* Edit Warehouse Modal */}
          <Modal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            title="Cập nhật thông tin kho bãi"
          >
            <form onSubmit={handleEditWarehouse}>
              <FormField
                label="Tên kho bãi *"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <FormField
                label="Địa chỉ *"
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />

              <div className="grid grid-2 gap-md mb-lg">
                <FormField
                  label="Vĩ độ (Latitude)"
                  type="number"
                  step="0.000001"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                />
                <FormField
                  label="Kinh độ (Longitude)"
                  type="number"
                  step="0.000001"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-md">
                <Button
                  onClick={() => setIsEditModalOpen(false)}
                  variant="secondary"
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
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
