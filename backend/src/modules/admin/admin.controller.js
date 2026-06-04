import { asyncHandler } from '../../utils/asyncHandler.js';
import * as adminService from './admin.service.js';

export const getAnalytics = asyncHandler(async (req, res) => {
  const data = await adminService.getRevenueAnalytics();
  res.status(200).json({ success: true, data });
});

export const getOrders = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const data = await adminService.getAllOrders({ status, page: parseInt(page) || 1, limit: parseInt(limit) || 20 });
  res.status(200).json({ success: true, data });
});

export const getAuditLogs = asyncHandler(async (req, res) => {
  const { action, entity, page, limit } = req.query;
  const data = await adminService.getAuditLogs({ action, entity, page: parseInt(page) || 1, limit: parseInt(limit) || 50 });
  res.status(200).json({ success: true, data });
});