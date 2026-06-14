'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { RoleGate } from '../RoleGate';

export const Sidebar = () => {
  const { logout, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const getLinkClass = (href) => {
    const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
    return `btn w-full justify-between ${isActive ? 'btn-primary' : 'btn-secondary'}`;
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="flex align-center justify-between p-md" style={{ borderBottom: '1px solid var(--border-primary)' }}>
        {!collapsed && (
          <span style={{ fontWeight: 'bold', fontSize: 'var(--text-lg)', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Logistics Hub
          </span>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="btn btn-secondary p-xs" style={{ minWidth: 'auto' }}>
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="flex-col gap-xs p-sm mt-md" style={{ flexGrow: 1 }}>
        <Link href="/" className={getLinkClass('/')}>
          <span>📊 Dashboard</span>
        </Link>

        <RoleGate roles={['ADMIN', 'WAREHOUSE_MANAGER']}>
          <Link href="/products" className={getLinkClass('/products')}>
            <span>📦 Sản phẩm</span>
          </Link>

          <Link href="/warehouses" className={getLinkClass('/warehouses')}>
            <span>🏭 Nhà kho</span>
          </Link>

          <Link href="/inventory/transactions" className={getLinkClass('/inventory/transactions')}>
            <span>📋 Giao dịch kho</span>
          </Link>

          <Link href="/shippers" className={getLinkClass('/shippers')}>
            <span>🚚 Shipper</span>
          </Link>
        </RoleGate>

        <Link href="/delivery-orders" className={getLinkClass('/delivery-orders')}>
          <span>📨 Đơn giao hàng</span>
        </Link>

        <Link href="/delivery-batches" className={getLinkClass('/delivery-batches')}>
          <span>🗂️ Đơn ghép (Batch)</span>
        </Link>

        <RoleGate roles={['ADMIN', 'WAREHOUSE_MANAGER']}>
          <div className="mb-xs mt-md px-sm" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 'bold', textTransform: 'uppercase' }}>
            {!collapsed && 'Báo cáo'}
          </div>

          <Link href="/reports/inventory" className={getLinkClass('/reports/inventory')}>
            <span>📈 Đối soát kho</span>
          </Link>

          <Link href="/reports/shippers" className={getLinkClass('/reports/shippers')}>
            <span>⚡ Hiệu suất Shipper</span>
          </Link>
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
