import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { login as loginApi } from '../lib/api/auth';
import { useToast } from '../contexts/ToastContext';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Vui lòng điền đầy đủ email và mật khẩu', 'warning');
      return;
    }

    setLoading(true);
    try {
      const data = await loginApi(email, password);
      login(data.accessToken, data.refreshToken);
      showToast('Đăng nhập thành công', 'success');
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Email hoặc mật khẩu không chính xác';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex align-center justify-center" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 className="text-center mb-md" style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 'bold', fontSize: 'var(--text-3xl)' }}>
          Logistics Portal
        </h2>
        <p className="text-center text-secondary mb-lg" style={{ fontSize: 'var(--text-sm)' }}>
          Hệ thống Quản lý và Điều phối Giao hàng
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="admin@store.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-full mt-md" disabled={loading}>
            {loading ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
};
export default LoginPage;
