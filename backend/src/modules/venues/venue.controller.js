import { asyncHandler } from '../../utils/asyncHandler.js';
import * as venueService from './venue.service.js';
import { ApiError } from '../../utils/ApiError.js';

export const createVenue = asyncHandler(async (req, res) => {
  const venue = await venueService.createVenue({
    organizerId: req.user.userId,
    ...req.body,
    capacity: parseInt(req.body.capacity),
  });
  res.status(201).json({ success: true, data: venue, message: 'Venue created' });
});

export const getMyVenues = asyncHandler(async (req, res) => {
  const venues = await venueService.getVenuesByOrganizer(req.user.userId);
  res.status(200).json({ success: true, data: venues });
});

export const getVenue = asyncHandler(async (req, res) => {
  const venue = await venueService.getVenueById(req.params.id);
  if (!venue) throw ApiError.notFound('Venue not found', 'VENUE_NOT_FOUND');
  res.status(200).json({ success: true, data: venue });
});