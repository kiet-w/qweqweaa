import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { RoleGate } from '../RoleGate';

export const Sidebar = () => {
  const { logout, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="flex align-center justify-between p-md" style={{ borderBottom: '1px solid var(--border-primary)' }}>
        {!collapsed && <span style={{ fontWeight: 'bold', fontSize: 'var(--text-lg)', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Logistics Hub</span>}
        <button onClick={() => setCollapsed(!collapsed)} className="btn btn-secondary p-xs" style={{ minWidth: 'auto' }}>
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="flex-col gap-xs p-sm mt-md" style={{ flexGrow: 1 }}>
        <NavLink to="/" className={({ isActive }) => `btn w-full justify-between ${isActive ? 'btn-primary' : 'btn-secondary'}`}>
          <span>📊 Dashboard</span>
        </NavLink>

        <RoleGate roles={['ADMIN', 'WAREHOUSE_MANAGER']}>
          <NavLink to="/products" className={({ isActive }) => `btn w-full justify-between ${isActive ? 'btn-primary' : 'btn-secondary'}`}>
            <span>📦 Sản phẩm</span>
          </NavLink>

          <NavLink to="/warehouses" className={({ isActive }) => `btn w-full justify-between ${isActive ? 'btn-primary' : 'btn-secondary'}`}>
            <span>🏭 Nhà kho</span>
          </NavLink>

          <NavLink to="/inventory/transactions" className={({ isActive }) => `btn w-full justify-between ${isActive ? 'btn-primary' : 'btn-secondary'}`}>
            <span>📋 Giao dịch kho</span>
          </NavLink>

          <NavLink to="/shippers" className={({ isActive }) => `btn w-full justify-between ${isActive ? 'btn-primary' : 'btn-secondary'}`}>
            <span>🚚 Shipper</span>
          </NavLink>
        </RoleGate>

        <NavLink to="/delivery-orders" className={({ isActive }) => `btn w-full justify-between ${isActive ? 'btn-primary' : 'btn-secondary'}`}>
          <span>📨 Đơn giao hàng</span>
        </NavLink>

        <NavLink to="/delivery-batches" className={({ isActive }) => `btn w-full justify-between ${isActive ? 'btn-primary' : 'btn-secondary'}`}>
          <span>🗂️ Đơn ghép (Batch)</span>
        </NavLink>

        <RoleGate roles={['ADMIN', 'WAREHOUSE_MANAGER']}>
          <div className="mb-xs mt-md px-sm" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 'bold', textTransform: 'uppercase' }}>
            {!collapsed && 'Báo cáo'}
          </div>

          <NavLink to="/reports/inventory" className={({ isActive }) => `btn w-full justify-between ${isActive ? 'btn-primary' : 'btn-secondary'}`}>
            <span>📈 Đối soát kho</span>
          </NavLink>

          <NavLink to="/reports/shippers" className={({ isActive }) => `btn w-full justify-between ${isActive ? 'btn-primary' : 'btn-secondary'}`}>
            <span>⚡ Hiệu suất Shipper</span>
          </NavLink>
        </RoleGate>
      </nav>

      <div className="p-md" style={{ borderTop: '1px solid var(--border-primary)' }}>
        {!collapsed && (
          <div className="mb-sm text-center" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            Đang đăng nhập: <strong>{user?.role}</strong>
          </div>
        )}
        <button onClick={logout} className="btn btn-danger w-full">
          🚪 {collapsed ? '' : 'Đăng xuất'}
        </button>
      </div>
    </aside>
  );
};
export default Sidebar;
