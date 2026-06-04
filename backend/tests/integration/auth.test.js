import request from 'supertest';
import app from '../src/app.js';
import { setupTestDb, teardownTestDb } from './test-db.js';

describe('Auth Endpoints', () => {
  beforeEach(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  it('POST /api/v1/auth/register - should create new user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'attendee',
      });
    
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.userId).toBeDefined();
  });

  it('POST /api/v1/auth/register - should reject duplicate email', async () => {
    await request(app).post('/api/v1/auth/register').send({
      email: 'dup@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
    });

    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'dup@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_EXISTS');
  });

  it('POST /api/v1/auth/login - should return tokens', async () => {
    await request(app).post('/api/v1/auth/register').send({
      email: 'login@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
    });

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'login@example.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();
  });

  it('POST /api/v1/auth/login - should reject wrong password', async () => {
    await request(app).post('/api/v1/auth/register').send({
      email: 'wrong@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
    });

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'wrong@example.com',
      password: 'WrongPassword!',
    });

    expect(res.status).toBe(401);
  });
});