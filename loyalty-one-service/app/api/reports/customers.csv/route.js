import { NextResponse } from 'next/server';
import { getPool, initDb } from '../../db';
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
  const user = auth(req, ['manager','admin']); if (!user) return new Response('unauthorized', { status: 401 });
  try {
    const pool = getPool();
    const r = await pool.query("SELECT id, phone, full_name, points_balance, created_at FROM customers ORDER BY id ASC");
    const rows = r.rows;
    const header = 'id,phone,full_name,points_balance,created_at\n';
    const body = rows.map(o => `${o.id},${o.phone || ''},${(o.full_name||'').replaceAll(',',' ')},${o.points_balance},${o.created_at.toISOString()}`).join('\n') + '\n';
    return new Response(header + body, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="customers.csv"'
      }
    });
  } catch (e) {
    console.error(e); return new Response('csv_failed', { status: 500 });
  }
}
