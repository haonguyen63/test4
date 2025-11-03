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

const POINT_PER_1000_VND = 1;
const REDEEM_POINT_TO_VND = 10;
const REDEEM_MIN_POINTS = 50;
const REDEEM_MAX_POINTS = 10000;

export async function POST(req) {
  await initDb();
  const user = auth(req, ['staff','manager','admin']); if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json();
  const { phone, amount_vnd, redeem_points } = body || {};
  const amount = parseInt(amount_vnd || 0, 10);
  let redeem = parseInt(redeem_points || 0, 10) || 0;
  if (!phone || !Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  try {
    const pool = getPool();
    let c = await pool.query("SELECT * FROM customers WHERE phone=$1", [phone]);
    if (c.rowCount === 0) {
      const created = await pool.query("INSERT INTO customers (phone) VALUES ($1) RETURNING *", [phone]);
      c = { rows: [created.rows[0]], rowCount: 1 };
    }
    const cust = c.rows[0];

    const earned = Math.floor(amount / 1000) * POINT_PER_1000_VND;

    redeem = Math.max(0, redeem);
    if (redeem > 0) {
      if (redeem < REDEEM_MIN_POINTS) return NextResponse.json({ error: 'redeem_min_50_points' }, { status: 400 });
      if (redeem > REDEEM_MAX_POINTS) return NextResponse.json({ error: 'redeem_max_10000_points' }, { status: 400 });
      if (redeem > cust.points_balance) return NextResponse.json({ error: 'insufficient_points' }, { status: 400 });
      const maxRedeemByAmount = Math.floor(amount / REDEEM_POINT_TO_VND);
      if (redeem > maxRedeemByAmount) redeem = maxRedeemByAmount;
    }

    const net = Math.max(0, amount - redeem * REDEEM_POINT_TO_VND);
    const newBalance = cust.points_balance + earned - redeem;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("UPDATE customers SET points_balance=$1 WHERE id=$2", [newBalance, cust.id]);
      const ins = await client.query(
        "INSERT INTO orders (customer_id, amount_vnd, earned_points, redeemed_points, net_amount_vnd) VALUES ($1,$2,$3,$4,$5) RETURNING id",
        [cust.id, amount, earned, redeem, net]
      );
      await client.query('COMMIT');
      return NextResponse.json({ order_id: ins.rows[0].id, earned_points: earned, redeemed_points: redeem, net_amount_vnd: net, new_balance: newBalance });
    } catch (e) {
      await client.query('ROLLBACK');
      console.error(e); return NextResponse.json({ error: 'order_failed' }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (e) {
    console.error(e); return NextResponse.json({ error: 'order_failed' }, { status: 500 });
  }
}
