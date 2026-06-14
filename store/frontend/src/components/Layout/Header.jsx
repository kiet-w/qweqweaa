import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const Header = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Simple path to breadcrumb translation
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    if (paths.length === 0) return <span>Dashboard</span>;

    return (
      <div className="flex align-center gap-xs" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
        <Link to="/" style={{ color: 'var(--accent-primary)' }}>Trang chủ</Link>
        {paths.map((path, idx) => {
          const to = `/${paths.slice(0, idx + 1).join('/')}`;
          const label = path === 'inventory' ? 'Kho' : path === 'transactions' ? 'Giao dịch' : path === 'delivery-orders' ? 'Đơn hàng' : path === 'delivery-batches' ? 'Đơn ghép' : path === 'reports' ? 'Báo cáo' : path;
          const isLast = idx === paths.length - 1;

          return (
            <React.Fragment key={to}>
              <span>/</span>
              {isLast ? (
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{label}</span>
              ) : (
                <Link to={to} style={{ color: 'var(--accent-primary)' }}>{label}</Link>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <header className="header">
      <div>{getBreadcrumbs()}</div>
      <div className="flex align-center gap-md">
        <div className="flex-col align-end">
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Tài khoản #{user?.id}</span>
          <span className="badge badge-assigned" style={{ fontSize: '10px', padding: '2px 6px' }}>{user?.role}</span>
        </div>
      </div>
    </header>
  );
};
export default Header;
