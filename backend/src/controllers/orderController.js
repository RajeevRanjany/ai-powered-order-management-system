const pool = require('../config/db');
const { checkAndDeductStock } = require('../services/inventoryService');
const { calculateSLADeadline } = require('../services/slaService');
const { predictTAT } = require('../services/tatService');

// Valid status transitions
const TRANSITIONS = {
  ORDER_PLACED:          ['PRESCRIPTION_VERIFIED', 'CANCELLED', 'ON_HOLD'],
  PRESCRIPTION_VERIFIED: ['LENS_ALLOCATED', 'REORDER', 'ON_HOLD'],
  LENS_ALLOCATED:        ['LENS_CUTTING', 'ON_HOLD'],
  LENS_CUTTING:          ['COATING', 'QC', 'ON_HOLD'],
  COATING:               ['FRAME_FITTING', 'ON_HOLD'],
  FRAME_FITTING:         ['QC', 'ON_HOLD'],
  QC:                    ['PACKED', 'REORDER'],    // REORDER = QC failure path
  PACKED:                ['SHIPPED'],
  SHIPPED:               ['DELIVERED'],
  REORDER:               ['LENS_ALLOCATED', 'CANCELLED'],
  ON_HOLD:               ['ORDER_PLACED', 'PRESCRIPTION_VERIFIED', 'LENS_ALLOCATED', 'LENS_CUTTING', 'COATING', 'FRAME_FITTING', 'QC'],
  DELIVERED:             [],
  CANCELLED:             [],
};

function generateOrderNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `ORD-${year}-${rand}`;
}

async function createOrder(req, res, next) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      customer_name, customer_phone, customer_email,
      sph_right, cyl_right, axis_right, add_right,
      sph_left, cyl_left, axis_left, add_left,
      lens_type, lens_index, coating,
      frame_brand, frame_model,
      source_channel, store_location, created_by,
    } = req.body;

    // Check inventory
    const stockResult = await checkAndDeductStock(
      { lens_type, lens_index, coating, sph_right, sph_left, cyl_right, cyl_left },
      client
    );

    const lensInHouse = stockResult.available;
    const procurementRequired = !lensInHouse;

    // Calculate SLA deadline
    const slaDeadline = calculateSLADeadline({
      lens_type, lens_index: parseFloat(lens_index), coating,
      source_channel, lens_in_house: lensInHouse,
    });

    const orderNumber = generateOrderNumber();

    const result = await client.query(
      `INSERT INTO orders (
         order_number, customer_name, customer_phone, customer_email,
         sph_right, cyl_right, axis_right, add_right,
         sph_left, cyl_left, axis_left, add_left,
         lens_type, lens_index, coating,
         frame_brand, frame_model,
         source_channel, store_location,
         sla_deadline, lens_inventory_id, lens_in_house, procurement_required,
         current_status, created_by
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25
       ) RETURNING *`,
      [
        orderNumber, customer_name, customer_phone, customer_email,
        sph_right, cyl_right, axis_right, add_right,
        sph_left, cyl_left, axis_left, add_left,
        lens_type, parseFloat(lens_index), coating,
        frame_brand, frame_model,
        source_channel, store_location,
        slaDeadline, stockResult.inventoryId, lensInHouse, procurementRequired,
        'ORDER_PLACED', created_by || null,
      ]
    );

    const order = result.rows[0];

    // Write initial status history
    await client.query(
      `INSERT INTO order_status_history (order_id, status, changed_by) VALUES ($1, 'ORDER_PLACED', 'System')`,
      [order.id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      order,
      inventory: {
        status: lensInHouse ? 'IN_HOUSE_AVAILABLE' : 'PROCUREMENT_REQUIRED',
        message: lensInHouse
          ? 'Lens found in inventory. Stock deducted.'
          : 'Lens not in stock. Procurement required from supplier.',
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

async function getOrders(req, res, next) {
  try {
    const { status, lens_type, store_location, risk_level, page = 1, limit = 20 } = req.query;

    const conditions = [];
    const params = [];
    let idx = 1;

    if (status)         { conditions.push(`o.current_status = $${idx++}`);  params.push(status); }
    if (lens_type)      { conditions.push(`o.lens_type = $${idx++}`);       params.push(lens_type); }
    if (store_location) { conditions.push(`o.store_location = $${idx++}`);  params.push(store_location); }
    if (risk_level)     { conditions.push(`o.risk_level = $${idx++}`);      params.push(risk_level); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [dataResult, countResult] = await Promise.all([
      pool.query(
        `SELECT o.*,
           EXTRACT(EPOCH FROM (o.sla_deadline - NOW())) / 3600 AS hours_until_sla
         FROM orders o ${where}
         ORDER BY o.sla_deadline ASC
         LIMIT $${idx++} OFFSET $${idx++}`,
        [...params, parseInt(limit), offset]
      ),
      pool.query(`SELECT COUNT(*) FROM orders o ${where}`, params),
    ]);

    res.json({
      success: true,
      orders: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    next(err);
  }
}

async function getOrderById(req, res, next) {
  try {
    const { id } = req.params;

    const [orderResult, historyResult] = await Promise.all([
      pool.query(`SELECT * FROM orders WHERE id = $1`, [id]),
      pool.query(
        `SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY created_at ASC`,
        [id]
      ),
    ]);

    if (!orderResult.rows[0]) return res.status(404).json({ success: false, error: 'Order not found' });

    res.json({ success: true, order: orderResult.rows[0], history: historyResult.rows });
  } catch (err) {
    next(err);
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, changed_by, delay_reason, notes } = req.body;

    const orderResult = await pool.query(`SELECT * FROM orders WHERE id = $1`, [id]);
    const order = orderResult.rows[0];
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const allowed = TRANSITIONS[order.current_status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot transition from ${order.current_status} to ${status}. Allowed: ${allowed.join(', ')}`,
      });
    }

    await pool.query(
      `UPDATE orders SET current_status = $1, updated_at = NOW() WHERE id = $2`,
      [status, id]
    );

    await pool.query(
      `INSERT INTO order_status_history (order_id, status, changed_by, delay_reason, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, status, changed_by || 'Staff', delay_reason || null, notes || null]
    );

    const updatedOrder = (await pool.query(`SELECT * FROM orders WHERE id = $1`, [id])).rows[0];
    res.json({ success: true, order: updatedOrder });
  } catch (err) {
    next(err);
  }
}

async function getTATPrediction(req, res, next) {
  try {
    const { id } = req.params;
    const orderResult = await pool.query(`SELECT * FROM orders WHERE id = $1`, [id]);
    const order = orderResult.rows[0];
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const prediction = await predictTAT(order);
    res.json({ success: true, prediction });
  } catch (err) {
    next(err);
  }
}

module.exports = { createOrder, getOrders, getOrderById, updateOrderStatus, getTATPrediction };
