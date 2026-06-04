import { asyncHandler } from '../../utils/asyncHandler.js';
import * as authService from './auth.service.js';
import { ApiError } from '../../utils/ApiError.js';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().optional(),
  role: z.enum(['attendee', 'organizer']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const register = asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.errors[0].message, 'VALIDATION_ERROR');
  }

  const result = await authService.registerUser(parsed.data);
  res.status(201).json({
    success: true,
    data: result,
    message: 'User registered successfully',
  });
});

export const login = asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.errors[0].message, 'VALIDATION_ERROR');
  }

  const { user, tokens } = await authService.loginUser(parsed.data);

  res.cookie('accessToken', tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    success: true,
    data: { user, tokens },
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
  if (!refreshToken) {
    throw ApiError.badRequest('Refresh token required', 'MISSING_REFRESH_TOKEN');
  }

  const tokens = await authService.refreshAccessToken(refreshToken);

  res.cookie('accessToken', tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
  });

  res.status(200).json({
    success: true,
    data: tokens,
  });
});

export const logout = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) throw ApiError.unauthorized('Not authenticated', 'MISSING_AUTH');

  const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
  await authService.logoutUser(userId, refreshToken);

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

export const me = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) throw ApiError.unauthorized('Not authenticated', 'MISSING_AUTH');

  const user = await authService.getUserById(userId);
  if (!user) throw ApiError.notFound('User not found', 'USER_NOT_FOUND');

  res.status(200).json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      phone: user.phone,
      isVerified: user.is_verified,
    },
  });
});