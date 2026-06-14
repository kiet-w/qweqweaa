'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getShippers, createShipper, updateShipper } from '@/lib/api/shippers';
import { register } from '@/lib/api/auth';
import { useToast } from '@/contexts/ToastContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/templates/AppLayout';
import { Button, Badge } from '@/components/atoms';
import { FormField, SearchBar } from '@/components/molecules';
import { Modal, DataTable } from '@/components/organisms';

// Standard JWT decoder helper
function decodeToken(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export default function ShippersPage() {
  const [shippers, setShippers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedShipper, setSelectedShipper] = useState(null);

  // Add Shipper Form State
  const [activeTab, setActiveTab] = useState('link'); // 'link' or 'register'
  const [userId, setUserId] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('xe máy');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Edit Shipper Form State
  const [editPhone, setEditPhone] = useState('');
  const [editVehicleType, setEditVehicleType] = useState('xe máy');
  const [editAvailable, setEditAvailable] = useState(true);

  const { showToast } = useToast();

  const fetchShippers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getShippers();
      setShippers(data);
    } catch (err) {
      console.error(err);
      showToast('Không thể tải danh sách shipper', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchShippers().catch(console.error);
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchShippers]);

  const handleOpenAddModal = () => {
    setActiveTab('link');
    setUserId('');
    setPhone('');
    setVehicleType('xe máy');
    setName('');
    setEmail('');
    setPassword('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (shipper) => {
    setSelectedShipper(shipper);
    setEditPhone(shipper.phone);
    setEditVehicleType(shipper.vehicleType || 'xe máy');
    setEditAvailable(shipper.isAvailable);
    setIsEditModalOpen(true);
  };

  const handleToggleAvailability = async (shipper) => {
    try {
      const updated = await updateShipper(shipper.id, {
        isAvailable: !shipper.isAvailable,
      });
      setShippers((prev) =>
        prev.map((s) => (s.id === shipper.id ? { ...s, isAvailable: updated.isAvailable } : s))
      );
      showToast(
        `Shipper "${shipper.user?.name}" hiện đang ${updated.isAvailable ? 'sẵn sàng' : 'bận'}`,
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast('Không thể cập nhật trạng thái', 'error');
    }
  };

  const handleAddShipper = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      let finalUserId = null;

      if (activeTab === 'link') {
        if (!userId || !phone) {
          showToast('Vui lòng nhập ID người dùng và số điện thoại', 'warning');
          setActionLoading(false);
          return;
        }
        finalUserId = parseInt(userId, 10);
      } else {
        if (!name.trim() || !email.trim() || password.length < 6 || !phone.trim()) {
          showToast('Vui lòng nhập đầy đủ thông tin. Mật khẩu ít nhất 6 ký tự', 'warning');
          setActionLoading(false);
          return;
        }

        // 1. Register user with role SHIPPER
        const registerPayload = {
          name,
          email,
          password,
          phone,
          role: 'SHIPPER',
        };
        const registerRes = await register(registerPayload);
        const decoded = decodeToken(registerRes.accessToken);
        if (!decoded || !decoded.sub) {
          throw new Error('Đăng ký thành công nhưng token không hợp lệ');
        }
        finalUserId = decoded.sub;
      }

      // 2. Create shipper profile
      const shipperPayload = {
        userId: finalUserId,
        phone,
        vehicleType,
      };
      await createShipper(shipperPayload);

      showToast('Thêm shipper thành công!', 'success');
      setIsAddModalOpen(false);
      await fetchShippers();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Không thể đăng ký/tạo hồ sơ shipper';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditShipper = async (e) => {
    e.preventDefault();
    if (!editPhone.trim()) {
      showToast('Vui lòng nhập số điện thoại', 'warning');
      return;
    }

    setActionLoading(true);
    try {
      await updateShipper(selectedShipper.id, {
        phone: editPhone,
        vehicleType: editVehicleType,
        isAvailable: editAvailable,
      });
      showToast('Cập nhật thông tin shipper thành công!', 'success');
      setIsEditModalOpen(false);
      await fetchShippers();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Lỗi khi cập nhật thông tin';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredShippers = shippers.filter((s) =>
    (s.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.phone || '').includes(searchQuery) ||
    (s.vehicleType || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tableHeaders = [
    { label: 'Mã tài xế' },
    { label: 'Mã người dùng' },
    { label: 'Họ và tên' },
    { label: 'Số điện thoại' },
    { label: 'Loại phương tiện' },
    { label: 'Trạng thái giao nhận' },
    { label: 'Cập nhật nhanh' },
    { label: 'Hành động' },
  ];

  const renderShipperRow = (s) => (
    <tr key={s.id}>
      <td>
        <strong>#{s.id}</strong>
      </td>
      <td>#{s.userId}</td>
      <td>
        <strong>{s.user?.name}</strong>
        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{s.user?.email}</div>
      </td>
      <td>{s.phone}</td>
      <td>
        <Badge variant="optimized">
          🚗 {s.vehicleType || 'Không có'}
        </Badge>
      </td>
      <td>
        <Badge variant={s.isAvailable ? 'completed' : 'failed'}>
          {s.isAvailable ? 'Sẵn sàng' : 'Bận / Ngoại tuyến'}
        </Badge>
      </td>
      <td>
        <Button
          onClick={() => handleToggleAvailability(s)}
          variant={s.isAvailable ? 'secondary' : 'primary'}
          style={{ padding: '2px 8px', fontSize: '11px' }}
        >
          {s.isAvailable ? '🔴 Đặt Bận' : '🟢 Sẵn sàng'}
        </Button>
      </td>
      <td>
        <Button
          onClick={() => handleOpenEditModal(s)}
          variant="secondary"
          className="btn-sm"
        >
          ✏️ Sửa thông tin
        </Button>
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
              <h1 className="m-0 mb-xs" style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold' }}>Hồ sơ tài xế giao nhận (Shippers)</h1>
              <p className="text-secondary m-0">Quản lý danh sách nhân viên giao hàng, phương tiện di chuyển và trạng thái trực tuyến.</p>
            </div>

            <Button onClick={handleOpenAddModal} variant="primary">
              ➕ Thêm Shipper mới
            </Button>
          </div>

          {/* Filter and Content */}
          <div className="card">
            <div className="flex justify-between align-center mb-md" style={{ gap: 'var(--space-md)' }}>
              <div style={{ flex: '1', maxWidth: '350px' }}>
                <SearchBar
                  placeholder="Tìm kiếm tài xế theo tên, SĐT, loại xe..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                Tổng số: <strong>{filteredShippers.length}</strong> tài xế
              </span>
            </div>

            <DataTable
              headers={tableHeaders}
              data={filteredShippers}
              renderRow={renderShipperRow}
              loading={loading}
              emptyMessage="Không tìm thấy shipper nào."
            />
          </div>

          {/* Add Shipper Modal */}
          <Modal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            title="Thêm Shipper vào hệ thống"
            maxWidth="550px"
          >
            {/* Modal Tabs */}
            <div className="flex gap-md mb-md" style={{ borderBottom: '1px solid var(--border-primary)', paddingBottom: '8px' }}>
              <Button
                variant={activeTab === 'link' ? 'primary' : 'secondary'}
                style={{ padding: '6px 12px', fontSize: 'var(--text-xs)' }}
                onClick={() => setActiveTab('link')}
              >
                Liên kết TK có sẵn (User ID)
              </Button>
              <Button
                variant={activeTab === 'register' ? 'primary' : 'secondary'}
                style={{ padding: '6px 12px', fontSize: 'var(--text-xs)' }}
                onClick={() => setActiveTab('register')}
              >
                Đăng ký tài khoản mới tinh
              </Button>
            </div>

            <form onSubmit={handleAddShipper}>
              {activeTab === 'link' ? (
                <>
                  <FormField
                    label="Mã tài khoản người dùng (User ID) *"
                    type="number"
                    required
                    placeholder="Ví dụ: 3"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '-8px', marginBottom: '16px' }}>
                    Tài khoản này bắt buộc phải có vai trò SHIPPER trong cơ sở dữ liệu.
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-2 gap-md">
                    <FormField
                      label="Họ và tên *"
                      type="text"
                      required
                      placeholder="Ví dụ: Lê Văn Tài"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <FormField
                      label="Email đăng nhập *"
                      type="email"
                      required
                      placeholder="Ví dụ: shipper3@store.vn"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <FormField
                    label="Mật khẩu mới (tối thiểu 6 ký tự) *"
                    type="password"
                    required
                    placeholder="Mật khẩu của tài xế"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </>
              )}

              <div className="grid grid-2 gap-md mb-lg">
                <FormField
                  label="Số điện thoại *"
                  type="text"
                  required
                  placeholder="Số liên hệ giao hàng"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />

                <div className="form-group">
                  <label className="form-label">Phương tiện di chuyển</label>
                  <select
                    className="form-input"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                  >
                    <option value="xe máy">Xe máy</option>
                    <option value="xe tải nhỏ">Xe tải nhỏ</option>
                    <option value="xe bán tải">Xe bán tải</option>
                    <option value="xe tải 3 tấn">Xe tải 3 tấn</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-md">
                <Button
                  onClick={() => setIsAddModalOpen(false)}
                  variant="secondary"
                  disabled={actionLoading}
                >
                  Hủy
                </Button>
                <Button type="submit" variant="primary" disabled={actionLoading}>
                  {actionLoading ? 'Đang tạo hồ sơ...' : 'Thêm Shipper'}
                </Button>
              </div>
            </form>
          </Modal>

          {/* Edit Shipper Modal */}
          <Modal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            title="Cập nhật hồ sơ tài xế"
          >
            {selectedShipper && (
              <>
                <p className="text-secondary mb-md">Tài xế: <strong>{selectedShipper.user?.name}</strong></p>
                <form onSubmit={handleEditShipper}>
                  <FormField
                    label="Số điện thoại liên hệ *"
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />

                  <div className="form-group mb-md">
                    <label className="form-label">Phương tiện di chuyển</label>
                    <select
                      className="form-input"
                      value={editVehicleType}
                      onChange={(e) => setEditVehicleType(e.target.value)}
                    >
                      <option value="xe máy">Xe máy</option>
                      <option value="xe tải nhỏ">Xe tải nhỏ</option>
                      <option value="xe bán tải">Xe bán tải</option>
                      <option value="xe tải 3 tấn">Xe tải 3 tấn</option>
                    </select>
                  </div>

                  <div className="form-group mb-lg">
                    <label className="form-label">Trạng thái giao hàng trực tuyến</label>
                    <div style={{ marginTop: '8px' }}>
                      <label className="flex align-center gap-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editAvailable}
                          onChange={(e) => setEditAvailable(e.target.checked)}
                          style={{ width: '18px', height: '18px' }}
                        />
                        Sẵn sàng nhận chuyến hàng (Trực tuyến)
                      </label>
                    </div>
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
              </>
            )}
          </Modal>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
