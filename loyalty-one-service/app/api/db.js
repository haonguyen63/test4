import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;
let pool;
let inited = false;

export function getPool() {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

export async function initDb() {
  if (inited) return;
  inited = true;
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      role TEXT NOT NULL CHECK (role IN ('admin','manager','staff')),
      phone TEXT,
      username TEXT UNIQUE,
      full_name TEXT,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      phone TEXT UNIQUE NOT NULL,
      full_name TEXT,
      points_balance INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      amount_vnd INTEGER NOT NULL,
      earned_points INTEGER NOT NULL,
      redeemed_points INTEGER NOT NULL,
      net_amount_vnd INTEGER NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  const admin = await pool.query("SELECT id FROM users WHERE username=$1", ['admin']);
  if (admin.rowCount === 0) {
    const hash = bcrypt.hashSync('changeme', 10);
    await pool.query("INSERT INTO users (role, username, full_name, password_hash) VALUES ('admin','admin','Administrator',$1)", [hash]);
    console.log('Seeded admin/changeme');
  }
}
