import jwt from 'jsonwebtoken';
import env from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Access token required', 'MISSING_TOKEN');
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Token expired', 'TOKEN_EXPIRED');
    }
    throw ApiError.unauthorized('Invalid token', 'INVALID_TOKEN');
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required', 'MISSING_AUTH');
    }
    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden('Insufficient permissions', 'FORBIDDEN');
    }
    next();
  };
};