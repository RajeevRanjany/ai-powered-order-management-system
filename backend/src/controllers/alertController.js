const { getAlerts, acknowledgeAlert, createAndDispatchAlert } = require('../services/alertService');
const { explainOrderRisk } = require('../services/geminiService');
const { predictTAT, scanAllOpenOrders } = require('../services/tatService');
const pool = require('../config/db');

async function listAlerts(req, res, next) {
  try {
    const { acknowledged, order_id, page, limit } = req.query;
    const result = await getAlerts({
      acknowledged: acknowledged === undefined ? undefined : acknowledged === 'true',
      orderId: order_id,
      page: parseInt(page || 1),
      limit: parseInt(limit || 20),
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function acknowledge(req, res, next) {
  try {
    const { id } = req.params;
    const { acknowledged_by } = req.body;
    const alert = await acknowledgeAlert(parseInt(id), acknowledged_by || 'Staff');
    if (!alert) return res.status(404).json({ success: false, error: 'Alert not found' });
    res.json({ success: true, alert });
  } catch (err) {
    next(err);
  }
}

async function explainRisk(req, res, next) {
  try {
    const { order_id } = req.params;

    const orderResult = await pool.query(`SELECT * FROM orders WHERE id = $1`, [order_id]);
    const order = orderResult.rows[0];
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const [prediction, historyResult] = await Promise.all([
      predictTAT(order),
      pool.query(
        `SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY created_at ASC`,
        [order_id]
      ),
    ]);

    const explanation = await explainOrderRisk(order, prediction, historyResult.rows);
    res.json({ success: true, explanation, prediction });
  } catch (err) {
    next(err);
  }
}

async function triggerScan(req, res, next) {
  try {
    const atRiskOrders = await scanAllOpenOrders();
    const dispatched = [];

    for (const { order, prediction } of atRiskOrders) {
      const alert = await createAndDispatchAlert(order, prediction);
      if (alert) dispatched.push({ order_number: order.order_number, risk: prediction.riskLevel, alert_id: alert.id });
    }

    res.json({
      success: true,
      scanned: atRiskOrders.length,
      alerts_created: dispatched.length,
      detail: dispatched,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { listAlerts, acknowledge, explainRisk, triggerScan };
