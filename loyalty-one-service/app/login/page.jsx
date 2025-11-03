'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API } from '../lib/apiBase';
import { safeFetch } from '../lib/http';

export default function Login() {
  const [username, setUsername] = useState('admin'); // có thể nhập số ĐT
  const [password, setPassword] = useState('changeme');
  const [error, setError] = useState('');
  const router = useRouter();

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const body = { username, phone: username, password };
      const data = await safeFetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/pos');
    } catch (err) {
      setError(err.message);
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
