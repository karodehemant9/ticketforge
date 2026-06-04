import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import pool, { withTransaction } from '../../config/database.js';
import env from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';

const REFRESH_DAYS = 7;

export const hashPassword = async (password) => {
  return bcrypt.hash(password, env.BCRYPT_ROUNDS);
};

export const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

export const generateTokens = (payload) => {
  const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRY });
  const refreshToken = jwt.sign(
    { userId: payload.userId, tokenId: uuidv4() },
    env.JWT_REFRESH_SECRET,
    { expiresIn: `${REFRESH_DAYS}d` }
  );
  return { accessToken, refreshToken };
};

export const registerUser = async (input) => {
  const { email, password, firstName, lastName, phone, role = 'attendee' } = input;

  if (role === 'admin') {
    throw ApiError.forbidden('Cannot register as admin', 'INVALID_ROLE');
  }

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw ApiError.conflict('Email already registered', 'EMAIL_EXISTS');
  }

  const userId = uuidv4();
  const passwordHash = await hashPassword(password);

  await pool.query(
    `INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [userId, email, passwordHash, firstName, lastName, phone || null, role]
  );

  return { userId };
};

export const loginUser = async (input) => {
  const { email, password } = input;

  const result = await pool.query(
    `SELECT id, email, password_hash, first_name, last_name, role, is_active
     FROM users WHERE email = $1 LIMIT 1`,
    [email]
  );

  const users = result.rows;
  if (users.length === 0) {
    throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const user = users[0];
  if (!user.is_active) {
    throw ApiError.forbidden('Account is deactivated', 'ACCOUNT_INACTIVE');
  }

  const isValid = await comparePassword(password, user.password_hash);
  if (!isValid) {
    throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    firstName: user.first_name,
  };

  const tokens = generateTokens(payload);
  const refreshTokenId = uuidv4();
  const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);

  await withTransaction(async (client) => {
    await client.query(
      'UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1',
      [user.id]
    );
    await client.query(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '${REFRESH_DAYS} days')`,
      [refreshTokenId, user.id, refreshTokenHash]
    );
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
    },
    tokens,
  };
};

export const refreshAccessToken = async (refreshToken) => {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch {
    throw ApiError.unauthorized('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
  }

  const result = await pool.query(
    `SELECT rt.id as rt_id, rt.user_id, rt.token_hash, rt.expires_at,
            u.email, u.role, u.first_name, u.is_active as user_active
     FROM refresh_tokens rt
     JOIN users u ON rt.user_id = u.id
     WHERE rt.user_id = $1 AND rt.is_revoked = FALSE
     ORDER BY rt.created_at DESC LIMIT 1`,
    [decoded.userId]
  );

  const tokens = result.rows;
  if (tokens.length === 0) {
    throw ApiError.unauthorized('Refresh token not found or revoked', 'TOKEN_REVOKED');
  }

  const tokenRecord = tokens[0];
  if (new Date(tokenRecord.expires_at) < new Date()) {
    throw ApiError.unauthorized('Refresh token expired', 'TOKEN_EXPIRED');
  }

  const isValidHash = await bcrypt.compare(refreshToken, tokenRecord.token_hash);
  if (!isValidHash) {
    throw ApiError.unauthorized('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
  }

  if (!tokenRecord.user_active) {
    throw ApiError.forbidden('Account is deactivated', 'ACCOUNT_INACTIVE');
  }

  const payload = {
    userId: tokenRecord.user_id,
    email: tokenRecord.email,
    role: tokenRecord.role,
    firstName: tokenRecord.first_name,
  };

  const newTokens = generateTokens(payload);
  const newTokenId = uuidv4();
  const newTokenHash = await bcrypt.hash(newTokens.refreshToken, 10);

  await withTransaction(async (client) => {
    await client.query(
      'UPDATE refresh_tokens SET is_revoked = TRUE WHERE id = $1',
      [tokenRecord.rt_id]
    );
    await client.query(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '${REFRESH_DAYS} days')`,
      [newTokenId, tokenRecord.user_id, newTokenHash]
    );
  });

  return newTokens;
};

export const logoutUser = async (userId, _refreshToken) => {
  await pool.query(
    'UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1',
    [userId]
  );
};

export const getUserById = async (userId) => {
  const result = await pool.query(
    `SELECT id, email, first_name, last_name, role, phone, is_verified, created_at
     FROM users WHERE id = $1 LIMIT 1`,
    [userId]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
};