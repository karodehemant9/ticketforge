import pg from 'pg';
import env from './env.js';

const { Pool } = pg;

const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err.message);
});

pool.on('connect', () => {
  console.log('✅ PostgreSQL connected');
});

pool.query('SELECT 1')
  .then(() => console.log('✅ PostgreSQL connected'))
  .catch((err) => console.error('❌ PostgreSQL connection failed:', err.message));

export const checkDbHealth = async () => {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
};

export const withTransaction = async (fn) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default pool;