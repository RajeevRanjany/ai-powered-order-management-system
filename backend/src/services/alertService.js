const pool = require('../config/db');
const { generateAlertMessage } = require('./geminiService');
const { sendAlertEmail } = require('./emailService');

async function createAndDispatchAlert(order, prediction) {
  // Deduplication: skip if unacknowledged alert of same type sent in last 4 hours
  const existing = await pool.query(
    `SELECT id FROM alerts
     WHERE order_id = $1
       AND alert_type = $2
       AND acknowledged = FALSE
       AND created_at > NOW() - INTERVAL '4 hours'
     LIMIT 1`,
    [order.id, prediction.riskLevel === 'BREACHED' ? 'BREACHED' : 'AT_RISK']
  );

  if (existing.rows.length > 0) return null;

  const alertMessage = await generateAlertMessage(order, prediction);
  const alertType = prediction.riskLevel === 'BREACHED' ? 'BREACHED' : 'AT_RISK';

  const result = await pool.query(
    `INSERT INTO alerts (order_id, alert_type, message, risk_level, predicted_delay_hours)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [order.id, alertType, alertMessage, prediction.riskLevel, prediction.remainingHours || 0]
  );

  const alert = result.rows[0];

  // Send email
  try {
    await sendAlertEmail({ order, prediction, alertMessage });
    await pool.query(
      `UPDATE alerts SET email_sent = TRUE, email_sent_at = NOW() WHERE id = $1`,
      [alert.id]
    );
    // Mark order as notified
    await pool.query(
      `UPDATE orders SET breach_notified = TRUE WHERE id = $1`,
      [order.id]
    );
  } catch (err) {
    console.error(`Email send failed for order ${order.order_number}:`, err.message);
  }

  return alert;
}

async function acknowledgeAlert(alertId, acknowledgedBy) {
  const result = await pool.query(
    `UPDATE alerts
     SET acknowledged = TRUE, acknowledged_at = NOW(), acknowledged_by = $2
     WHERE id = $1
     RETURNING *`,
    [alertId, acknowledgedBy]
  );
  return result.rows[0];
}

async function getAlerts({ acknowledged, orderId, page = 1, limit = 20 }) {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (acknowledged !== undefined) {
    conditions.push(`a.acknowledged = $${idx++}`);
    params.push(acknowledged);
  }
  if (orderId) {
    conditions.push(`a.order_id = $${idx++}`);
    params.push(orderId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const result = await pool.query(
    `SELECT a.*, o.order_number, o.customer_name, o.lens_type, o.current_status, o.store_location
     FROM alerts a
     JOIN orders o ON o.id = a.order_id
     ${where}
     ORDER BY a.created_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, limit, offset]
  );

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM alerts a ${where}`,
    params
  );

  return { alerts: result.rows, total: parseInt(countResult.rows[0].count) };
}

module.exports = { createAndDispatchAlert, acknowledgeAlert, getAlerts };
