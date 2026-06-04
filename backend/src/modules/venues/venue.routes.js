import { Router } from 'express';
import { createVenue, getMyVenues, getVenue } from './venue.controller.js';
import { authenticate, authorize } from '../auth/auth.middleware.js';

const router = Router();

router.post('/', authenticate, authorize('organizer'), createVenue);
router.get('/my', authenticate, authorize('organizer'), getMyVenues);
router.get('/:id', authenticate, getVenue);

export default router;