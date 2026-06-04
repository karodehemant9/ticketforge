import { asyncHandler } from '../../utils/asyncHandler.js';
import * as eventService from './event.service.js';
import { ApiError } from '../../utils/ApiError.js';

export const createEvent = asyncHandler(async (req, res) => {
  const posterUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const event = await eventService.createEvent({
    organizerId: req.user.userId,
    posterUrl,
    title: req.body.title,
    description: req.body.description,
    category: req.body.category,
    eventDate: req.body.eventDate,
    durationMinutes: parseInt(req.body.durationMinutes) || 120,
    venueId: req.body.venueId,
  });
  res.status(201).json({ success: true, data: event, message: 'Event created' });
});

export const publishEvent = asyncHandler(async (req, res) => {
  const event = await eventService.publishEvent(req.params.id, req.user.userId);
  res.status(200).json({ success: true, data: event, message: 'Event published' });
});

export const getMyEvents = asyncHandler(async (req, res) => {
  const events = await eventService.getOrganizerEvents(req.user.userId);
  res.status(200).json({ success: true, data: events });
});

export const getEvents = asyncHandler(async (req, res) => {
  const { search, page, limit } = req.query;
  const data = await eventService.getPublicEvents({
    search,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
  });
  res.status(200).json({ success: true, data });
});

export const getEvent = asyncHandler(async (req, res) => {
  const event = await eventService.getEventById(req.params.id);
  if (!event) throw ApiError.notFound('Event not found', 'EVENT_NOT_FOUND');
  res.status(200).json({ success: true, data: event });
});