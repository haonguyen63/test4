'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { safeFetch } from '../../lib/http';

export default function Users() {
  const router = useRouter();

  // Đợi đọc xong localStorage rồi mới quyết định redirect
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);

  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ role: 'staff', phone: '', username: '', full_name: '', password: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const t = typeof window !== 'undefined' ? (localStorage.getItem('token') || '') : '';
    const u = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    setToken(t);
    if (u) {
      try { setUser(JSON.parse(u)); } catch {}
    }
    setReady(true);
  }, []);

  // Chỉ redirect khi đã ready mà vẫn không có token
  useEffect(() => {
    if (ready && !token) router.replace('/login');
  }, [ready, token, router]);

  const canSee = !!user && (user.role === 'manager' || user.role === 'admin');

  async function refresh(tok) {
    try {
      const data = await safeFetch(`/api/users`, {
        headers: { 'Authorization': `Bearer ${tok}` }
      });
      setUsers(data);
    } catch (e) {
      setMsg(e.message);
    }
  }

  useEffect(() => {
    if (ready && token && canSee) {
      refresh(token);
    }
  }, [ready, token, canSee]);

  async function createUser() {
    setMsg('');
    try {
      await safeFetch(`/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      setForm({ role: (user?.role === 'admin' ? 'staff' : 'staff'), phone: '', username: '', full_name: '', password: '' });
      refresh(token);
    } catch (e) {
      setMsg('Lỗi: ' + e.message);
    }
  }

  // Khi chưa ready: không render để tránh nháy trang
  if (!ready) return null;
  // Nếu không có token, effect ở trên sẽ điều hướng về /login
  if (!token) return null;

  if (!canSee) {
    return <div className="card"><p>Bạn không có quyền truy cập.</p></div>;
  }

  const roleOptions = user?.role === 'admin'
    ? [{ v: 'staff', t: 'Nhân viên' }, { v: 'manager', t: 'Trưởng quầy' }]
    : [{ v: 'staff', t: 'Nhân viên' }];

  return (
    <div className="card">
      <h2>Quản trị người dùng</h2>
      <div className="row">
        <div>
          <label>Vai trò</label>
          <select
            className="select"
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}
          >
            {roleOptions.map(o => <option key={o.v} value={o.v}>{o.t}</option>)}
          </select>
        </div>
        <div>
          <label>Họ tên</label>
          <input
            className="input"
            value={form.full_name}
            onChange={e => setForm({ ...form, full_name: e.target.value })}
          />
        </div>
      </div>

      <div className="row">
        <div>
          <label>Số điện thoại</label>
          <input
            className="input"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div>
          <label>Username (tùy chọn)</label>
          <input
            className="input"
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
          />
        </div>
      </div>

      <div className="row">
        <div>
          <label>Mật khẩu</label>
          <input
            className="input"
            type="password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'end' }}>
          <button className="btn" onClick={createUser}>Tạo user</button>
        </div>
      </div>

      {msg && <p>{msg}</p>}

      <hr />
      <h3>Danh sách user</h3>
      <ul>
        {users.map(u => (
          <li key={u.id}>
            <span className="badge">{u.role}</span> — {u.full_name || '(no name)'} — {u.phone || u.username || ''}
          </li>
        ))}
      </ul>
    </div>
  );
}
