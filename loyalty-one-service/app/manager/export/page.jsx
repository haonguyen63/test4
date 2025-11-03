'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ExportCSV() {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [msg, setMsg] = useState('');
  const router = useRouter();

  useEffect(()=>{
    setToken(localStorage.getItem('token') || '');
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
  },[]);

  useEffect(()=>{
    if (!token) router.push('/login');
  },[token, router]);

  const canSee = user && (user.role === 'manager' || user.role === 'admin');

  async function downloadCSV() {
    setMsg('');
    try {
      const res = await fetch('/api/reports/customers.csv', { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'customers.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMsg('Đã tải customers.csv');
    } catch (e) { setMsg('Lỗi: '+e.message); }
  }

  if (!canSee) return <div className="card"><p>Bạn không có quyền truy cập.</p></div>;

  return (
    <div className="card">
      <h2>Xuất CSV Khách hàng</h2>
      <button className="btn" onClick={downloadCSV}>Tải customers.csv</button>
      {msg && <p>{msg}</p>}
    </div>
  );
}
