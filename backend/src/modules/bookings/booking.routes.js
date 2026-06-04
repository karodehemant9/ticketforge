import { Router } from 'express';
import { getAvailability, addToCart, getCart, removeFromCart, checkout, getMyOrders, getOrder } from './booking.controller.js';
import { authenticate } from '../auth/auth.middleware.js';

const router = Router();

router.get('/events/:eventId/availability', getAvailability);
router.post('/cart', authenticate, addToCart);
router.get('/cart', authenticate, getCart);
router.delete('/cart/:pricingId', authenticate, removeFromCart);
router.post('/checkout', authenticate, checkout);
router.get('/orders', authenticate, getMyOrders);
router.get('/orders/:id', authenticate, getOrder);

export default router;