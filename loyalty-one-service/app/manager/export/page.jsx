'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ExportCSV() {
  const router = useRouter();

  // Đợi đọc xong localStorage rồi mới quyết định redirect
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
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

  async function downloadCSV() {
    setMsg('');
    try {
      const res = await fetch('/api/reports/customers.csv', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'download_failed');
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

  return (
    <div className="card">
      <h2>Xuất CSV Khách hàng</h2>
      <button className="btn" onClick={downloadCSV}>Tải customers.csv</button>
      {msg && <p>{msg}</p>}
    </div>
  );
}
