import pool, { withTransaction } from '../../config/database.js';
import redis from '../../config/redis.js';
import { v4 as uuidv4 } from 'uuid';
import { ApiError } from '../../utils/ApiError.js';

const CART_TTL_SECONDS = 900;
const LOCK_TTL_SECONDS = 30;

export const getEventAvailability = async (eventId) => {
  const result = await pool.query(
    `SELECT ep.id as pricing_id, ep.base_price, ep.available_tickets, ep.sold_tickets,
            vs.id as section_id, vs.name as section_name, vs.section_type
     FROM event_pricing ep
     JOIN venue_sections vs ON ep.section_id = vs.id
     WHERE ep.event_id = $1`,
    [eventId]
  );
  return result.rows;
};

export const acquireLock = async (lockKey, ttlSeconds = LOCK_TTL_SECONDS) => {
  const token = uuidv4();
  const result = await redis.set(`lock:${lockKey}`, token, 'EX', ttlSeconds, 'NX');
  if (result === 'OK') {
    return { 
      acquired: true, 
      token, 
      release: async () => {
        const script = `
          if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
          else
            return 0
          end
        `;
        await redis.eval(script, 1, `lock:${lockKey}`, token);
      }
    };
  }
  return { acquired: false };
};

export const addToCart = async (userId, eventId, pricingId, quantity) => {
  const lockKey = `event:${eventId}:pricing:${pricingId}`;
  const lock = await acquireLock(lockKey);
  
  if (!lock.acquired) {
    throw ApiError.conflict('High demand! Please try again in a moment.', 'LOCK_BUSY');
  }

  try {
    const availResult = await pool.query(
      `SELECT available_tickets, sold_tickets, base_price, max_booking_quantity
       FROM event_pricing WHERE id = $1 FOR UPDATE`,
      [pricingId]
    );
    
    if (availResult.rows.length === 0) {
      throw ApiError.notFound('Pricing tier not found', 'PRICING_NOT_FOUND');
    }

    const pricing = availResult.rows[0];
    if (pricing.available_tickets - pricing.sold_tickets < quantity) {
      throw ApiError.conflict('Not enough tickets available', 'INSUFFICIENT_TICKETS');
    }

    if (quantity > pricing.max_booking_quantity) {
      throw ApiError.badRequest(`Max ${pricing.max_booking_quantity} tickets per booking`, 'MAX_QUANTITY_EXCEEDED');
    }

    const cartKey = `cart:${userId}`;
    const cartItem = {
      eventId,
      pricingId,
      quantity,
      unitPrice: pricing.base_price,
      addedAt: new Date().toISOString(),
    };

    await redis.hset(cartKey, pricingId, JSON.stringify(cartItem));
    await redis.expire(cartKey, CART_TTL_SECONDS);

    await pool.query(
      `UPDATE event_pricing 
       SET available_tickets = available_tickets - $1,
           sold_tickets = sold_tickets + $1
       WHERE id = $2`,
      [quantity, pricingId]
    );

    return { cartItem, ttlSeconds: CART_TTL_SECONDS };
  } finally {
    await lock.release();
  }
};

export const getCart = async (userId) => {
  const cartKey = `cart:${userId}`;
  const items = await redis.hgetall(cartKey);
  
  if (!items || Object.keys(items).length === 0) {
    return { items: [], total: 0, expiresAt: null };
  }

  const parsedItems = Object.values(items).map(v => JSON.parse(v));
  const ttl = await redis.ttl(cartKey);
  
  const total = parsedItems.reduce((sum, item) => {
    return sum + (parseFloat(item.unitPrice) * parseInt(item.quantity));
  }, 0);

  return {
    items: parsedItems,
    total: parseFloat(total.toFixed(2)),
    expiresAt: ttl > 0 ? new Date(Date.now() + ttl * 1000).toISOString() : null,
  };
};

export const removeFromCart = async (userId, pricingId) => {
  const cartKey = `cart:${userId}`;
  const itemStr = await redis.hget(cartKey, pricingId);
  
  if (!itemStr) {
    throw ApiError.notFound('Item not in cart', 'CART_ITEM_NOT_FOUND');
  }

  const item = JSON.parse(itemStr);

  await pool.query(
    `UPDATE event_pricing 
     SET available_tickets = available_tickets + $1,
         sold_tickets = sold_tickets - $1
     WHERE id = $2`,
    [item.quantity, pricingId]
  );

  await redis.hdel(cartKey, pricingId);
  
  const remaining = await redis.hlen(cartKey);
  if (remaining === 0) await redis.del(cartKey);

  return { removed: true };
};

export const createOrder = async (userId, idempotencyKey) => {
  if (idempotencyKey) {
    const existing = await pool.query(
      `SELECT id, status FROM orders WHERE idempotency_key = $1`,
      [idempotencyKey]
    );
    if (existing.rows.length > 0) {
      return { orderId: existing.rows[0].id, status: existing.rows[0].status, isDuplicate: true };
    }
  }

  const cart = await getCart(userId);
  if (cart.items.length === 0) {
    throw ApiError.badRequest('Cart is empty', 'EMPTY_CART');
  }

  for (const item of cart.items) {
    const result = await pool.query(
      `SELECT available_tickets FROM event_pricing WHERE id = $1`,
      [item.pricingId]
    );
    if (result.rows.length === 0 || result.rows[0].available_tickets < 0) {
      throw ApiError.conflict('Tickets no longer available. Please refresh.', 'INVENTORY_CHANGED');
    }
  }

  const orderId = uuidv4();
  const totalAmount = cart.total;
  const finalAmount = totalAmount;

  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO orders (id, user_id, event_id, status, total_amount, discount_amount, final_amount, idempotency_key, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() + INTERVAL '15 minutes')`,
      [orderId, userId, cart.items[0].eventId, 'reserved', totalAmount, 0, finalAmount, idempotencyKey || null]
    );

    for (const item of cart.items) {
      const itemId = uuidv4();
      await client.query(
        `INSERT INTO order_items (id, order_id, pricing_id, unit_price, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [itemId, orderId, item.pricingId, item.unitPrice, item.quantity]
      );
    }
  });

  await redis.del(`cart:${userId}`);

  return { orderId, status: 'reserved', totalAmount, finalAmount, isDuplicate: false };
};

export const getOrderById = async (orderId, userId) => {
  const result = await pool.query(
    `SELECT o.*, json_agg(json_build_object(
      'id', oi.id,
      'pricingId', oi.pricing_id,
      'unitPrice', oi.unit_price,
      'quantity', oi.quantity
    )) as items
     FROM orders o
     LEFT JOIN order_items oi ON o.id = oi.order_id
     WHERE o.id = $1 AND o.user_id = $2
     GROUP BY o.id`,
    [orderId, userId]
  );
  return result.rows[0] || null;
};

export const getMyOrders = async (userId) => {
  const result = await pool.query(
    `SELECT o.id, o.status, o.total_amount, o.final_amount, o.created_at,
            e.title as event_title, e.event_date
     FROM orders o
     JOIN events e ON o.event_id = e.id
     WHERE o.user_id = $1
     ORDER BY o.created_at DESC`,
    [userId]
  );
  return result.rows;
};