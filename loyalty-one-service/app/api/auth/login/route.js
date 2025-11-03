import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getPool, initDb } from '../../db';

export const runtime = 'nodejs';

function sign(user) {
  const payload = { id: user.id, role: user.role, username: user.username, phone: user.phone, full_name: user.full_name };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

export async function POST(req) {
  await initDb();
  const pool = getPool();
  const body = await req.json();
  const { username, phone, password } = body || {};
  if (!password || (!username && !phone)) return NextResponse.json({ error: 'missing_credentials' }, { status: 400 });
  try {
    const byUser = username ? await pool.query("SELECT * FROM users WHERE username=$1", [username]) : { rowCount: 0 };
    const byPhone = phone ? await pool.query("SELECT * FROM users WHERE phone=$1", [phone]) : { rowCount: 0 };
    const row = byUser.rowCount ? byUser.rows[0] : (byPhone.rowCount ? byPhone.rows[0] : null);
    if (!row) return NextResponse.json({ error: 'invalid_user' }, { status: 401 });
    const ok = bcrypt.compareSync(password, row.password_hash);
    if (!ok) return NextResponse.json({ error: 'invalid_password' }, { status: 401 });
    const token = sign(row);
    return NextResponse.json({ token, user: { id: row.id, role: row.role, username: row.username, phone: row.phone, full_name: row.full_name } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'login_failed' }, { status: 500 });
  }
}
