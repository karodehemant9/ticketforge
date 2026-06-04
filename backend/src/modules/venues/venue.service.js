import pool from '../../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export const createVenue = async (data) => {
  const { organizerId, name, address, city, capacity } = data;
  const id = uuidv4();

  await pool.query(
    `INSERT INTO venues (id, organizer_id, name, address, city, capacity)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, organizerId, name, address, city, capacity]
  );

  // Auto-create default sections: General (80%) and VIP (20%)
  const generalId = uuidv4();
  const vipId = uuidv4();
  const generalCapacity = Math.floor(capacity * 0.8);
  const vipCapacity = capacity - generalCapacity;

  await pool.query(
    `INSERT INTO venue_sections (id, venue_id, name, section_type, capacity) VALUES
     ($1, $2, 'General Admission', 'general', $3),
     ($4, $2, 'VIP', 'vip', $5)`,
    [generalId, id, generalCapacity, vipId, vipCapacity]
  );

  return { id, sectionsCreated: 2 };
};

export const getVenuesByOrganizer = async (organizerId) => {
  const result = await pool.query(
    `SELECT id, name, address, city, capacity, is_active, created_at
     FROM venues WHERE organizer_id = $1 ORDER BY created_at DESC`,
    [organizerId]
  );
  return result.rows;
};

export const getVenueById = async (id) => {
  const result = await pool.query(
    `SELECT v.*, u.first_name as organizer_first_name, u.last_name as organizer_last_name
     FROM venues v
     JOIN users u ON v.organizer_id = u.id
     WHERE v.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

export const getVenueSections = async (venueId) => {
  const result = await pool.query(
    `SELECT id, name, section_type, capacity FROM venue_sections WHERE venue_id = $1`,
    [venueId]
  );
  return result.rows;
};