import { NextResponse } from 'next/server';
import { getPool, initDb } from '../db';
import jwt from 'jsonwebtoken';

export const runtime = 'nodejs';

function auth(req, roles=null) {
  const hdr = req.headers.get('authorization') || '';
  if (!hdr.startsWith('Bearer ')) return null;
  const token = hdr.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (roles && !roles.includes(decoded.role)) return null;
    return decoded;
  } catch { return null; }
}

export async function GET(req) {
  await initDb();
  const user = auth(req, ['manager','admin']); if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const pool = getPool();
    const r = await pool.query("SELECT id, role, phone, username, full_name, created_at FROM users ORDER BY id DESC");
    return NextResponse.json(r.rows);
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'list_users_failed' }, { status: 500 });
  }
}

export async function POST(req) {
  await initDb();
  const user = auth(req, ['manager','admin']); if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json();
  let { role, phone, username, full_name, password } = body || {};
  role = (role || 'staff').toLowerCase();
  if (!password) return NextResponse.json({ error: 'missing_password' }, { status: 400 });
  if (user.role === 'manager' && role !== 'staff') return NextResponse.json({ error: 'manager_can_only_create_staff' }, { status: 403 });
  if (user.role !== 'admin' && role === 'admin') return NextResponse.json({ error: 'forbidden_create_admin' }, { status: 403 });
  try {
    const pool = getPool();
    const hash = require('bcryptjs').hashSync(password, 10);
    const r = await pool.query(
      "INSERT INTO users (role, phone, username, full_name, password_hash) VALUES ($1,$2,$3,$4,$5) RETURNING id, role, phone, username, full_name, created_at",
      [role, phone || null, username || null, full_name || null, hash]
    );
    return NextResponse.json(r.rows[0], { status: 201 });
  } catch (e) {
    console.error(e);
    if (e.code === '23505') return NextResponse.json({ error: 'username_taken' }, { status: 400 });
    return NextResponse.json({ error: 'create_user_failed' }, { status: 500 });
  }
}
