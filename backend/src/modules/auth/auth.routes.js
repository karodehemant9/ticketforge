import { Router } from 'express';
import { register, login, refresh, logout, me } from './auth.controller.js';
import { authenticate, authorize } from './auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);

router.get('/organizer-only', authenticate, authorize('organizer'), (req, res) => {
  res.json({ success: true, message: 'Organizer access granted' });
});

router.get('/admin-only', authenticate, authorize('admin'), (req, res) => {
  res.json({ success: true, message: 'Admin access granted' });
});

export default router;