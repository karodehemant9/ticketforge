import pg from 'pg';
const { Pool } = pg;

export const testPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: 'ticketforge_test', // Separate test DB
});

export const setupTestDb = async () => {
  // Clean tables before each test
  await testPool.query(`
    TRUNCATE TABLE order_items, orders, event_pricing, events, seats, venue_sections, venues, refresh_tokens, audit_logs, users RESTART IDENTITY CASCADE
  `);
};

export const teardownTestDb = async () => {
  await testPool.end();
};