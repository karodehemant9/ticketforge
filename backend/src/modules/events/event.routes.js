import { Router } from 'express';
import { createEvent, publishEvent, getMyEvents, getEvents, getEvent } from './event.controller.js';
import { authenticate, authorize } from '../auth/auth.middleware.js';
import { upload } from '../../config/multer.js';

const router = Router();

router.post('/', authenticate, authorize('organizer'), upload.single('poster'), createEvent);
router.patch('/:id/publish', authenticate, authorize('organizer'), publishEvent);
router.get('/my', authenticate, authorize('organizer'), getMyEvents);
router.get('/', getEvents);
router.get('/:id', getEvent);

export default router;