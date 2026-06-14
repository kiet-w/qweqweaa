'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { login as loginApi } from '../../lib/api/auth';
import { useToast } from '../../contexts/ToastContext';
import { FormField } from '../../components/molecules';
import { Button } from '../../components/atoms';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const from = searchParams.get('from') || '/';

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
      router.replace(from);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Email hoặc mật khẩu không chính xác';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormField
        label="Email"
        type="email"
        placeholder="admin@store.vn"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
        required
      />

      <FormField
        label="Mật khẩu"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
        required
      />

      <Button type="submit" className="w-full mt-md" disabled={loading}>
        {loading ? 'Đang xác thực...' : 'Đăng nhập'}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex align-center justify-center" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 className="text-center mb-md" style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 'bold', fontSize: 'var(--text-3xl)' }}>
          Logistics Portal
        </h2>
        <p className="text-center text-secondary mb-lg" style={{ fontSize: 'var(--text-sm)' }}>
          Hệ thống Quản lý và Điều phối Giao hàng
        </p>
        <Suspense fallback={<div>Đang tải...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
