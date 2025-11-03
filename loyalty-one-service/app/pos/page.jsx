'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API } from '../lib/apiBase';
import { safeFetch } from '../lib/http';

function useAuth() {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  useEffect(()=>{
    setToken(localStorage.getItem('token') || '');
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
  },[]);
  return { token, user };
}

export default function POS() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState('0912345678');
  const [fullName, setFullName] = useState('');
  const [customer, setCustomer] = useState(null);
  const [amount, setAmount] = useState(250000);
  const [redeem, setRedeem] = useState(0);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  useEffect(()=>{
    if (!token) router.push('/login');
  },[token, router]);

  async function search() {
    setErr(''); setCustomer(null);
    try {
      const data = await safeFetch(`${API}/customers?phone=${encodeURIComponent(phone)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCustomer(data);
      if (data && data.full_name) setFullName(data.full_name);
    } catch(e){ setErr(String(e.message)); }
  }

  async function createIfNotExists() {
    setErr('');
    try {
      const data = await safeFetch(`${API}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ phone, full_name: fullName || null })
      });
      setCustomer({ id: data.id, phone: data.phone, full_name: data.full_name, points_balance: 0 });
    } catch(e){ setErr(String(e.message)); }
  }

  async function createOrder() {
    setErr(''); setResult(null);
    try {
      const data = await safeFetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ phone, amount_vnd: Number(amount), redeem_points: Number(redeem) || 0 })
      });
      setResult(data);
      await search();
    } catch(e){ setErr(String(e.message)); }
  }

  return (
    <div className="card">
      <h2>Điểm bán hàng</h2>
      <p>Đăng nhập: <span className="badge">{user?.role}</span></p>
      <div className="row">
        <div>
          <label>Số điện thoại khách</label>
          <input className="input" value={phone} onChange={e=>setPhone(e.target.value)} />
        </div>
        <div>
          <label>Tên khách (nếu tạo mới)</label>
          <input className="input" value={fullName} onChange={e=>setFullName(e.target.value)} />
        </div>
      </div>
      <div style={{height:8}}/>
      <div className="row">
        <button className="btn" onClick={search}>Tìm khách</button>
        <button className="btn" onClick={createIfNotExists}>Tạo khách (nếu chưa có)</button>
      </div>
      <hr/>
      {customer === null ? <p><small>Chưa có dữ liệu. Nhấn "Tìm khách".</small></p> :
       customer ? (
        <div>
          <p><b>{customer.full_name || '(chưa có tên)'}</b> – {customer.phone} — Số dư điểm: <span className="badge">{customer.points_balance}</span></p>
        </div>
       ) : <p>Khách chưa tồn tại. Nhập tên và bấm "Tạo khách".</p>
      }
      <hr/>
      <div className="row">
        <div>
          <label>Giá trị đơn (VND)</label>
          <input className="input" type="number" value={amount} onChange={e=>setAmount(e.target.value)} />
        </div>
        <div>
          <label>Đổi điểm (tùy chọn)</label>
          <input className="input" type="number" value={redeem} onChange={e=>setRedeem(e.target.value)} />
          <small>Min 50, Max 10000. 1 điểm = 10đ.</small>
        </div>
      </div>
      <div style={{height:8}}/>
      <button className="btn" onClick={createOrder}>Tạo đơn</button>
      {result && (
        <div className="card" style={{marginTop:12}}>
          <h3>Kết quả</h3>
          <p>Order #{result.order_id}</p>
          <p>+ Điểm tích: {result.earned_points}</p>
          <p>- Điểm đổi: {result.redeemed_points}</p>
          <p>→ Thanh toán còn: {result.net_amount_vnd.toLocaleString()} VND</p>
          <p>Số dư mới: <b>{result.new_balance}</b> điểm</p>
        </div>
      )}
      {err && <p style={{color:'#fca5a5'}}>Lỗi: {err}</p>}
    </div>
  );
}
