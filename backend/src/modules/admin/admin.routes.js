import { Router } from 'express';
import { getAnalytics, getOrders, getAuditLogs } from './admin.controller.js';
import { authenticate, authorize } from '../auth/auth.middleware.js';

const router = Router();

router.get('/analytics', authenticate, authorize('admin'), getAnalytics);
router.get('/orders', authenticate, authorize('admin'), getOrders);
router.get('/audit-logs', authenticate, authorize('admin'), getAuditLogs);

export default router;