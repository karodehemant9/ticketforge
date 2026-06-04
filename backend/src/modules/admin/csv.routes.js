import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import pool from '../../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

const router = Router();

router.post('/events', asyncHandler(async (req, res) => {
  if (!req.body.csvData && !req.file) {
    throw ApiError.badRequest('CSV data required', 'MISSING_CSV');
  }

  const results = { success: 0, failed: 0, errors: [] };
  const stream = req.file 
    ? req.file.buffer 
    : Readable.from([req.body.csvData]);

  const parser = csvParser({
    headers: ['title', 'description', 'category', 'eventDate', 'venueId', 'basePrice', 'capacity'],
    skipLines: req.file ? 1 : 0, // Skip header if file upload
  });

  const rows = [];
  await new Promise((resolve, reject) => {
    const source = req.file 
      ? Readable.from(req.file.buffer.toString().split('\n'))
      : Readable.from([req.body.csvData]);
    
    source
      .pipe(csvParser())
      .on('data', (row) => rows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  for (const row of rows) {
    try {
      const eventId = uuidv4();
      await pool.query(
        `INSERT INTO events (id, organizer_id, venue_id, title, description, category, event_date, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft')`,
        [eventId, req.user.userId, row.venueId, row.title, row.description || '', row.category || 'other', row.eventDate]
      );
      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push({ row: row.title, error: err.message });
    }
  }

  res.status(200).json({
    success: true,
    data: results,
    message: `Processed ${results.success + results.failed} events`,
  });
}));

export default router;