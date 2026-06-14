import { useState, useEffect, useCallback } from 'react';
import { getShippers, createShipper, updateShipper } from '../lib/api/shippers';
import { register } from '../lib/api/auth';
import { useToast } from '../contexts/ToastContext';

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

  if (loading) {
    return (
      <div className="flex justify-center align-center h-full" style={{ minHeight: '400px' }}>
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex justify-between align-center mb-lg">
        <div>
          <h1 className="m-0 mb-xs" style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold' }}>Hồ sơ tài xế giao nhận (Shippers)</h1>
          <p className="text-secondary m-0">Quản lý danh sách nhân viên giao hàng, phương tiện di chuyển và trạng thái trực tuyến.</p>
        </div>

        <button onClick={handleOpenAddModal} className="btn btn-primary">
          ➕ Thêm Shipper mới
        </button>
      </div>

      {/* Filter and Content */}
      <div className="card">
        <div className="flex justify-between align-center mb-md" style={{ gap: 'var(--space-md)' }}>
          <input
            type="text"
            placeholder="Tìm kiếm tài xế theo tên, SĐT, loại xe..."
            className="form-input"
            style={{ maxWidth: '350px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Tổng số: <strong>{filteredShippers.length}</strong> tài xế
          </span>
        </div>

        {filteredShippers.length === 0 ? (
          <div className="text-center p-lg text-secondary">Không tìm thấy shipper nào.</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã tài xế</th>
                  <th>Mã người dùng</th>
                  <th>Họ và tên</th>
                  <th>Số điện thoại</th>
                  <th>Loại phương tiện</th>
                  <th>Trạng thái giao nhận</th>
                  <th>Cập nhật nhanh</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredShippers.map((s) => (
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
                      <span className="badge badge-optimized">
                        🚗 {s.vehicleType || 'Không có'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${s.isAvailable ? 'badge-completed' : 'badge-failed'}`}>
                        {s.isAvailable ? 'Sẵn sàng' : 'Bận / Ngoại tuyến'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleAvailability(s)}
                        className={`btn ${s.isAvailable ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                        style={{ padding: '2px 8px', fontSize: '11px' }}
                      >
                        {s.isAvailable ? '🔴 Đặt Bận' : '🟢 Sẵn sàng'}
                      </button>
                    </td>
                    <td>
                      <button
                        onClick={() => handleOpenEditModal(s)}
                        className="btn btn-secondary btn-sm"
                      >
                        ✏️ Sửa thông tin
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Shipper Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <h3 className="m-0 mb-sm">Thêm Shipper vào hệ thống</h3>

            {/* Modal Tabs */}
            <div className="flex gap-md mb-md" style={{ borderBottom: '1px solid var(--border-primary)', paddingBottom: '8px' }}>
              <button
                type="button"
                className={`btn btn-sm ${activeTab === 'link' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('link')}
              >
                Liên kết TK có sẵn (User ID)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${activeTab === 'register' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('register')}
              >
                Đăng ký tài khoản mới tinh
              </button>
            </div>

            <form onSubmit={handleAddShipper}>
              {activeTab === 'link' ? (
                <div className="form-group mb-md">
                  <label className="form-label">Mã tài khoản người dùng (User ID) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Ví dụ: 3"
                    className="form-input"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                    Tài khoản này bắt buộc phải có vai trò SHIPPER trong cơ sở dữ liệu.
                  </span>
                </div>
              ) : (
                <>
                  <div className="form-row mb-md">
                    <div className="form-group">
                      <label className="form-label">Họ và tên *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Lê Văn Tài"
                        className="form-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email đăng nhập *</label>
                      <input
                        type="email"
                        required
                        placeholder="Ví dụ: shipper3@store.vn"
                        className="form-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group mb-md">
                    <label className="form-label">Mật khẩu mới (tối thiểu 6 ký tự) *</label>
                    <input
                      type="password"
                      required
                      placeholder="Mật khẩu của tài xế"
                      className="form-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="form-row mb-lg">
                <div className="form-group">
                  <label className="form-label">Số điện thoại *</label>
                  <input
                    type="text"
                    required
                    placeholder="Số liên hệ giao hàng"
                    className="form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

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
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={actionLoading}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Đang tạo hồ sơ...' : 'Thêm Shipper'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Shipper Modal */}
      {isEditModalOpen && selectedShipper && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="m-0 mb-xs">Cập nhật hồ sơ tài xế</h3>
            <p className="text-secondary mb-md">Tài xế: <strong>{selectedShipper.user?.name}</strong></p>
            <form onSubmit={handleEditShipper}>
              <div className="form-group mb-md">
                <label className="form-label">Số điện thoại liên hệ *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
              </div>

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
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={actionLoading}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
