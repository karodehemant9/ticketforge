import pool, { withTransaction } from '../../config/database.js';
import redis from '../../config/redis.js';
import { v4 as uuidv4 } from 'uuid';

export const createEvent = async (data) => {
  const { organizerId, venueId, title, description, category, eventDate, durationMinutes, posterUrl } = data;
  const id = uuidv4();

  await withTransaction(async (client) => {
    // Create event
    await client.query(
      `INSERT INTO events (id, organizer_id, venue_id, title, description, category, event_date, duration_minutes, poster_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft')`,
      [id, organizerId, venueId, title, description, category, eventDate, durationMinutes || 120, posterUrl]
    );

    // Auto-create pricing for each venue section (default prices)
    const sectionsResult = await client.query(
      `SELECT id, capacity FROM venue_sections WHERE venue_id = $1`,
      [venueId]
    );

    for (const section of sectionsResult.rows) {
      const pricingId = uuidv4();
      const basePrice = section.capacity > 100 ? 500 : 1000; // Simple default pricing
      await client.query(
        `INSERT INTO event_pricing (id, event_id, section_id, base_price, available_tickets, sold_tickets)
         VALUES ($1, $2, $3, $4, $5, 0)`,
        [pricingId, id, section.id, basePrice, section.capacity]
      );
    }
  });

  await redis.del('events:list:1:all');
  return { id };
};

export const publishEvent = async (eventId, organizerId) => {
  const result = await pool.query(
    `UPDATE events SET status = 'published', updated_at = NOW()
     WHERE id = $1 AND organizer_id = $2 RETURNING *`,
    [eventId, organizerId]
  );
  if (result.rows.length === 0) throw new Error('Event not found or unauthorized');
  await redis.del('events:list:1:all');
  return result.rows[0];
};

export const getOrganizerEvents = async (organizerId) => {
  const result = await pool.query(
    `SELECT e.*, v.name as venue_name, v.city as venue_city
     FROM events e
     JOIN venues v ON e.venue_id = v.id
     WHERE e.organizer_id = $1
     ORDER BY e.created_at DESC`,
    [organizerId]
  );
  return result.rows;
};

export const getPublicEvents = async ({ search, page = 1, limit = 10 }) => {
  const cacheKey = `events:list:${page}:${search || 'all'}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const offset = (page - 1) * limit;
  let query = `
    SELECT e.*, v.name as venue_name, v.city as venue_city,
           u.first_name as organizer_first_name, u.last_name as organizer_last_name
    FROM events e
    JOIN venues v ON e.venue_id = v.id
    JOIN users u ON e.organizer_id = u.id
    WHERE e.status = 'published'
  `;
  const params = [];
  
  if (search) {
    query += ` AND (e.title ILIKE $1 OR e.description ILIKE $1)`;
    params.push(`%${search}%`);
  }
  
  query += ` ORDER BY e.event_date ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);
  
  let countQuery = `SELECT COUNT(*) FROM events e WHERE e.status = 'published'`;
  if (search) countQuery += ` AND (e.title ILIKE $1 OR e.description ILIKE $1)`;
  const countResult = await pool.query(countQuery, search ? [`%${search}%`] : []);
  const total = parseInt(countResult.rows[0].count);

  const data = {
    events: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };

  await redis.setex(cacheKey, 300, JSON.stringify(data));
  return data;
};

export const getEventById = async (id) => {
  const result = await pool.query(
    `SELECT e.*, v.name as venue_name, v.address as venue_address, v.city as venue_city,
            u.first_name as organizer_first_name, u.last_name as organizer_last_name
     FROM events e
     JOIN venues v ON e.venue_id = v.id
     JOIN users u ON e.organizer_id = u.id
     WHERE e.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};