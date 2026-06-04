import { asyncHandler } from '../../utils/asyncHandler.js';
import * as bookingService from './booking.service.js';
import { ApiError } from '../../utils/ApiError.js';

export const getAvailability = asyncHandler(async (req, res) => {
  const availability = await bookingService.getEventAvailability(req.params.eventId);
  res.status(200).json({ success: true, data: availability });
});

export const addToCart = asyncHandler(async (req, res) => {
  const { eventId, pricingId, quantity } = req.body;
  const result = await bookingService.addToCart(req.user.userId, eventId, pricingId, parseInt(quantity));
  res.status(200).json({ success: true, data: result, message: 'Added to cart' });
});

export const getCart = asyncHandler(async (req, res) => {
  const cart = await bookingService.getCart(req.user.userId);
  res.status(200).json({ success: true, data: cart });
});

export const removeFromCart = asyncHandler(async (req, res) => {
  await bookingService.removeFromCart(req.user.userId, req.params.pricingId);
  res.status(200).json({ success: true, message: 'Removed from cart' });
});

export const checkout = asyncHandler(async (req, res) => {
  const { idempotencyKey } = req.body;
  const result = await bookingService.createOrder(req.user.userId, idempotencyKey);
  res.status(result.isDuplicate ? 200 : 201).json({
    success: true,
    data: result,
    message: result.isDuplicate ? 'Order already processed' : 'Order reserved successfully',
  });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await bookingService.getMyOrders(req.user.userId);
  res.status(200).json({ success: true, data: orders });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await bookingService.getOrderById(req.params.id, req.user.userId);
  if (!order) throw ApiError.notFound('Order not found', 'ORDER_NOT_FOUND');
  res.status(200).json({ success: true, data: order });
});