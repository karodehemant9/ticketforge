import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import authRoutes from './modules/auth/auth.routes.js';
import healthRoutes from './modules/health/health.routes.js';
import venueRoutes from './modules/venues/venue.routes.js';
import eventRoutes from './modules/events/event.routes.js';
import bookingRoutes from './modules/bookings/booking.routes.js';
import sseRoutes from './modules/saga/sse.routes.js';
import { errorHandler } from './utils/errorHandler.js';
import { ApiError } from './utils/ApiError.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? ['https://yourdomain.com'] : ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Too many requests' },
    });
  },
});
app.use(limiter);

const bookingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Booking too fast. Slow down.' } },
});
app.use('/api/v1/bookings/cart', bookingLimiter);
app.use('/api/v1/bookings/checkout', bookingLimiter);

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use('/uploads', express.static('uploads'));
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/venues', venueRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/sse', sseRoutes);

app.use((req, res, next) => {
  next(ApiError.notFound(`Route ${req.originalUrl} not found`, 'ROUTE_NOT_FOUND'));
});

app.use(errorHandler);

export default app;