import pool from '../../config/database.js';

export const getRevenueAnalytics = async () => {
  // Daily revenue with running total (window function)
  const daily = await pool.query(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as order_count,
      SUM(final_amount) as daily_revenue,
      SUM(SUM(final_amount)) OVER (ORDER BY DATE(created_at)) as running_total,
      AVG(final_amount) as avg_order_value
    FROM orders
    WHERE status = 'completed'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT 30
  `);

  // Top 5 events by revenue (ROW_NUMBER)
  const topEvents = await pool.query(`
    SELECT 
      e.title,
      e.category,
      COUNT(o.id) as tickets_sold,
      SUM(o.final_amount) as total_revenue,
      ROW_NUMBER() OVER (ORDER BY SUM(o.final_amount) DESC) as rank
    FROM orders o
    JOIN events e ON o.event_id = e.id
    WHERE o.status = 'completed'
    GROUP BY e.id, e.title, e.category
    ORDER BY total_revenue DESC
    LIMIT 5
  `);

  // Weekly comparison (LAG window function)
  const weekly = await pool.query(`
    WITH weekly_revenue AS (
      SELECT 
        DATE_TRUNC('week', created_at) as week,
        SUM(final_amount) as revenue
      FROM orders
      WHERE status = 'completed'
      GROUP BY DATE_TRUNC('week', created_at)
    )
    SELECT 
      week,
      revenue,
      LAG(revenue) OVER (ORDER BY week) as prev_week_revenue,
      ROUND(
        ((revenue - LAG(revenue) OVER (ORDER BY week)) / 
         NULLIF(LAG(revenue) OVER (ORDER BY week), 0)) * 100, 
        2
      ) as growth_percent
    FROM weekly_revenue
    ORDER BY week DESC
    LIMIT 12
  `);

  // Summary stats
  const summary = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM users) as total_users,
      (SELECT COUNT(*) FROM users WHERE role = 'organizer') as total_organizers,
      (SELECT COUNT(*) FROM events WHERE status = 'published') as active_events,
      (SELECT COUNT(*) FROM venues) as total_venues,
      (SELECT COUNT(*) FROM orders WHERE status = 'completed') as total_orders,
      (SELECT COALESCE(SUM(final_amount), 0) FROM orders WHERE status = 'completed') as total_revenue
  `);

  return {
    summary: summary.rows[0],
    dailyRevenue: daily.rows,
    topEvents: topEvents.rows,
    weeklyGrowth: weekly.rows,
  };
};

export const getAllOrders = async ({ status, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  let query = `
    SELECT o.id, o.status, o.total_amount, o.final_amount, o.created_at,
           u.email as user_email, u.first_name as user_name,
           e.title as event_title
    FROM orders o
    JOIN users u ON o.user_id = u.id
    JOIN events e ON o.event_id = e.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    query += ` AND o.status = $${params.length + 1}`;
    params.push(status);
  }
  
  query += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);
  
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM orders o WHERE 1=1 ${status ? "AND o.status = $1" : ""}`,
    status ? [status] : []
  );
  
  return {
    orders: result.rows,
    pagination: {
      page,
      limit,
      total: parseInt(countResult.rows[0].count),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
    },
  };
};

export const getAuditLogs = async ({ action, entity, page = 1, limit = 50 }) => {
  const offset = (page - 1) * limit;
  let query = `SELECT * FROM audit_logs WHERE 1=1`;
  const params = [];
  
  if (action) {
    query += ` AND action = $${params.length + 1}`;
    params.push(action);
  }
  if (entity) {
    query += ` AND entity = $${params.length + 1}`;
    params.push(entity);
  }
  
  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);
  return result.rows;
};