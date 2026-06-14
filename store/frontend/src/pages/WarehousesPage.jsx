import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '../lib/api/warehouses';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

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
  const navigate = useNavigate();

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
          <h1 className="m-0 mb-xs" style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold' }}>Quản lý Kho bãi</h1>
          <p className="text-secondary m-0">Quản lý mạng lưới các địa điểm kho lưu trữ sản phẩm và xuất nhập kho.</p>
        </div>

        {canManage && (
          <button onClick={handleOpenAddModal} className="btn btn-primary">
            ➕ Thêm kho bãi
          </button>
        )}
      </div>

      {/* Filter and Content */}
      <div className="card">
        <div className="flex justify-between align-center mb-md" style={{ gap: 'var(--space-md)' }}>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc địa chỉ..."
            className="form-input"
            style={{ maxWidth: '350px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Tổng số: <strong>{filteredWarehouses.length}</strong> kho bãi
          </span>
        </div>

        {filteredWarehouses.length === 0 ? (
          <div className="text-center p-lg text-secondary">Không tìm thấy kho bãi nào phù hợp.</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã kho</th>
                  <th>Tên kho bãi</th>
                  <th>Địa chỉ</th>
                  <th>Vĩ độ (Lat)</th>
                  <th>Kinh độ (Lng)</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredWarehouses.map((w) => (
                  <tr key={w.id}>
                    <td>
                      <strong>#{w.id}</strong>
                    </td>
                    <td>{w.name}</td>
                    <td>{w.address}</td>
                    <td>{w.lat !== null ? w.lat.toFixed(4) : <span className="text-tertiary">N/A</span>}</td>
                    <td>{w.lng !== null ? w.lng.toFixed(4) : <span className="text-tertiary">N/A</span>}</td>
                    <td>
                      <span className={`badge ${w.isActive ? 'badge-completed' : 'badge-failed'}`}>
                        {w.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-xs">
                        <button
                          onClick={() => navigate(`/warehouses/${w.id}/stock`)}
                          className="btn btn-secondary btn-sm"
                        >
                          📦 Xem tồn kho
                        </button>
                        {canManage && (
                          <button
                            onClick={() => handleOpenEditModal(w)}
                            className="btn btn-secondary btn-sm"
                          >
                            ✏️ Sửa
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteWarehouse(w.id, w.name)}
                            className="btn btn-danger btn-sm"
                          >
                            🗑️ Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Warehouse Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="m-0 mb-md">Thêm kho bãi mới</h3>
            <form onSubmit={handleAddWarehouse}>
              <div className="form-group mb-md">
                <label className="form-label">Tên kho bãi *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="Ví dụ: Kho Quận 1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group mb-md">
                <label className="form-label">Địa chỉ *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="Ví dụ: 123 Nguyễn Huệ, Quận 1, TP.HCM"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="form-row mb-lg">
                <div className="form-group">
                  <label className="form-label">Vĩ độ (Latitude)</label>
                  <input
                    type="number"
                    step="0.000001"
                    className="form-input"
                    placeholder="Ví dụ: 10.7731"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Kinh độ (Longitude)</label>
                  <input
                    type="number"
                    step="0.000001"
                    className="form-input"
                    placeholder="Ví dụ: 106.7030"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-md">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={actionLoading}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Đang tạo...' : 'Tạo kho bãi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Warehouse Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="m-0 mb-md">Cập nhật thông tin kho bãi</h3>
            <form onSubmit={handleEditWarehouse}>
              <div className="form-group mb-md">
                <label className="form-label">Tên kho bãi *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group mb-md">
                <label className="form-label">Địa chỉ *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="form-row mb-lg">
                <div className="form-group">
                  <label className="form-label">Vĩ độ (Latitude)</label>
                  <input
                    type="number"
                    step="0.000001"
                    className="form-input"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Kinh độ (Longitude)</label>
                  <input
                    type="number"
                    step="0.000001"
                    className="form-input"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                  />
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
