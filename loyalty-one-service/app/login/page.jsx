'use client';
import { useState } from 'react';

export default function Login() {
  const [username, setUsername] = useState('admin');   // có thể gõ số ĐT
  const [password, setPassword] = useState('changeme');
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, phone: username, password })
      });
      const ct = res.headers.get('content-type') || '';
      const text = await res.text();
      const data = ct.includes('application/json') ? JSON.parse(text) : null;

      if (!res.ok) {
        const msg = (data && (data.error || data.message)) ||
                    (ct.includes('text/html') ? 'Server returned HTML instead of JSON' : text);
        throw new Error(msg || 'login_failed');
      }

      // Lưu token + user
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Điều hướng chắc chắn
      window.location.href = '/pos';
    } catch (err) {
      setError(err.message || 'login_failed');
    }
  }

  return (
    <div className="card">
      <h2>Đăng nhập</h2>
      <form onSubmit={onSubmit}>
        <label>Username (hoặc Số điện thoại)</label>
        <input className="input" value={username} onChange={e=>setUsername(e.target.value)} />
        <label>Mật khẩu</label>
        <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <div style={{height:8}}/>
        <button className="btn" type="submit">Đăng nhập</button>
        {error && <p style={{color:'#fca5a5'}}>Lỗi: {error}</p>}
      </form>
    </div>
  );
}
