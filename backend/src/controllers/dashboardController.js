const pool = require('../config/db');

async function getSummary(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE current_status NOT IN ('DELIVERED','CANCELLED'))                    AS active_orders,
        COUNT(*) FILTER (WHERE current_status = 'DELIVERED')                                       AS delivered_today,
        COUNT(*) FILTER (WHERE risk_level = 'AT_RISK'  AND current_status NOT IN ('DELIVERED','CANCELLED')) AS at_risk,
        COUNT(*) FILTER (WHERE risk_level = 'BREACHED' AND current_status NOT IN ('DELIVERED','CANCELLED')) AS breached,
        COUNT(*) FILTER (WHERE current_status = 'QC' OR current_status = 'REORDER')               AS needs_attention,
        COUNT(*) FILTER (WHERE procurement_required = TRUE
                           AND current_status NOT IN ('DELIVERED','CANCELLED'))                     AS pending_procurement
      FROM orders
    `);

    res.json({ success: true, summary: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function getOrdersByStatus(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT current_status AS status, COUNT(*) AS count
      FROM orders
      WHERE current_status NOT IN ('DELIVERED','CANCELLED')
      GROUP BY current_status
      ORDER BY count DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

async function getOrdersByLensType(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT lens_type, COUNT(*) AS total,
        COUNT(*) FILTER (WHERE current_status NOT IN ('DELIVERED','CANCELLED')) AS active,
        COUNT(*) FILTER (WHERE risk_level = 'BREACHED') AS breached
      FROM orders
      GROUP BY lens_type
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

async function getOrdersByStore(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT
        COALESCE(store_location, 'Unknown') AS store,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE current_status NOT IN ('DELIVERED','CANCELLED')) AS active,
        COUNT(*) FILTER (WHERE risk_level IN ('AT_RISK','BREACHED')
                           AND current_status NOT IN ('DELIVERED','CANCELLED')) AS at_risk
      FROM orders
      GROUP BY store_location
      ORDER BY active DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

async function getActiveOrders(req, res, next) {
  try {
    const { status, lens_type, store_location, risk_level } = req.query;

    const conditions = [`o.current_status NOT IN ('DELIVERED','CANCELLED')`];
    const params = [];
    let idx = 1;

    if (status)         { conditions.push(`o.current_status = $${idx++}`);  params.push(status); }
    if (lens_type)      { conditions.push(`o.lens_type = $${idx++}`);       params.push(lens_type); }
    if (store_location) { conditions.push(`o.store_location = $${idx++}`);  params.push(store_location); }
    if (risk_level)     { conditions.push(`o.risk_level = $${idx++}`);      params.push(risk_level); }

    const result = await pool.query(
      `SELECT
         o.*,
         ROUND(EXTRACT(EPOCH FROM (o.sla_deadline - NOW())) / 3600, 1) AS hours_until_sla,
         (SELECT h.created_at FROM order_status_history h
          WHERE h.order_id = o.id ORDER BY h.created_at DESC LIMIT 1) AS last_status_change
       FROM orders o
       WHERE ${conditions.join(' AND ')}
       ORDER BY o.sla_deadline ASC`,
      params
    );

    res.json({ success: true, orders: result.rows, total: result.rows.length });
  } catch (err) {
    next(err);
  }
}

async function getSLAPerformance(req, res, next) {
  try {
    const { days = 30 } = req.query;
    const result = await pool.query(`
      SELECT
        lens_type,
        COUNT(*) AS total_delivered,
        COUNT(*) FILTER (WHERE updated_at <= sla_deadline) AS on_time,
        ROUND(
          COUNT(*) FILTER (WHERE updated_at <= sla_deadline)::numeric / NULLIF(COUNT(*),0) * 100, 1
        ) AS on_time_pct,
        ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600), 1) AS avg_tat_hours
      FROM orders
      WHERE current_status = 'DELIVERED'
        AND updated_at > NOW() - ($1 || ' days')::interval
      GROUP BY lens_type
    `, [parseInt(days)]);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSummary, getOrdersByStatus, getOrdersByLensType, getOrdersByStore, getActiveOrders, getSLAPerformance };
