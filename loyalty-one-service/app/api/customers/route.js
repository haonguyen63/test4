import { NextResponse } from 'next/server';
import { getPool, initDb } from '../db';

export const runtime = 'nodejs';

function auth(req, roles=null) {
  const hdr = req.headers.get('authorization') || '';
  if (!hdr.startsWith('Bearer ')) return null;
  const token = hdr.slice(7);
  try {
    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    if (roles && !roles.includes(decoded.role)) return null;
    return decoded;
  } catch { return null; }
}

export async function GET(req) {
  await initDb();
  const user = auth(req, ['staff','manager','admin']); if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const phone = new URL(req.url).searchParams.get('phone');
  if (!phone) return NextResponse.json({ error: 'missing_phone' }, { status: 400 });
  try {
    const pool = getPool();
    const r = await pool.query("SELECT id, phone, full_name, points_balance FROM customers WHERE phone=$1", [phone]);
    if (r.rowCount === 0) return NextResponse.json(null);
    return NextResponse.json(r.rows[0]);
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'search_failed' }, { status: 500 });
  }
}

export async function POST(req) {
  await initDb();
  const user = auth(req, ['staff','manager','admin']); if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json();
  const { phone, full_name } = body || {};
  if (!phone) return NextResponse.json({ error: 'missing_phone' }, { status: 400 });
  try {
    const pool = getPool();
    const exist = await pool.query("SELECT id, phone, full_name, points_balance FROM customers WHERE phone=$1", [phone]);
    if (exist.rowCount) return NextResponse.json(exist.rows[0]);
    const r = await pool.query("INSERT INTO customers (phone, full_name) VALUES ($1,$2) RETURNING id, phone, full_name, points_balance", [phone, full_name || null]);
    return NextResponse.json(r.rows[0], { status: 201 });
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'create_failed' }, { status: 500 });
  }
}
