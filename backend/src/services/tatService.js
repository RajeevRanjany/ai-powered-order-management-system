const pool = require('../config/db');
const { addBusinessHours, getBusinessHoursBetween } = require('./slaService');

// Expected business hours per stage (rule-based defaults)
const DEFAULT_STAGE_HOURS = {
  ORDER_PLACED:          1,
  PRESCRIPTION_VERIFIED: 2,
  LENS_ALLOCATED:        4,
  LENS_CUTTING:          8,
  COATING:              10,
  FRAME_FITTING:         4,
  QC:                    3,
  PACKED:                2,
  SHIPPED:               6,
  DELIVERED:             0,
  REORDER:              48, // procurement delay
};

const STAGE_ORDER = [
  'ORDER_PLACED', 'PRESCRIPTION_VERIFIED', 'LENS_ALLOCATED',
  'LENS_CUTTING', 'COATING', 'FRAME_FITTING', 'QC',
  'PACKED', 'SHIPPED', 'DELIVERED',
];

/**
 * Get average stage durations from completed historical orders.
 * Returns { STAGE_NAME: avgHours }
 */
async function getHistoricalStageDurations(lensType) {
  const result = await pool.query(
    `SELECT
       h1.status AS stage,
       AVG(EXTRACT(EPOCH FROM (h2.created_at - h1.created_at)) / 3600) AS avg_hours,
       COUNT(*) AS sample_count
     FROM order_status_history h1
     JOIN order_status_history h2
       ON h2.order_id = h1.order_id
      AND h2.created_at > h1.created_at
     JOIN orders o ON o.id = h1.order_id
     WHERE o.current_status = 'DELIVERED'
       AND o.lens_type = $1
       AND h2.order_id = h1.order_id
       AND h2.created_at = (
         SELECT MIN(h3.created_at) FROM order_status_history h3
         WHERE h3.order_id = h1.order_id AND h3.created_at > h1.created_at
       )
     GROUP BY h1.status`,
    [lensType]
  );

  const durations = {};
  for (const row of result.rows) {
    if (row.sample_count >= 3) {
      durations[row.stage] = parseFloat(row.avg_hours);
    }
  }
  return durations;
}

/**
 * Predict completion time and SLA risk for a single order.
 * Returns { riskLevel, predictedCompletionDate, slaBreach, reason }
 */
async function predictTAT(order) {
  const historicalDurations = await getHistoricalStageDurations(order.lens_type);

  const currentStageIndex = STAGE_ORDER.indexOf(order.current_status);
  if (currentStageIndex === -1 || order.current_status === 'DELIVERED') {
    return { riskLevel: 'SAFE', predictedCompletionDate: null, slaBreach: false, reason: 'Order complete or terminal.' };
  }

  // Get time spent so far in current stage
  const stageHistoryResult = await pool.query(
    `SELECT created_at FROM order_status_history
     WHERE order_id = $1 AND status = $2
     ORDER BY created_at DESC LIMIT 1`,
    [order.id, order.current_status]
  );

  const enteredCurrentStageAt = stageHistoryResult.rows[0]?.created_at || order.created_at;
  const hoursInCurrentStage = getBusinessHoursBetween(enteredCurrentStageAt, new Date());

  const expectedCurrentStageHours =
    historicalDurations[order.current_status] || DEFAULT_STAGE_HOURS[order.current_status] || 4;

  const remainingInCurrentStage = Math.max(0, expectedCurrentStageHours - hoursInCurrentStage);

  // Sum remaining stages
  const remainingStages = STAGE_ORDER.slice(currentStageIndex + 1);
  const remainingHours = remainingStages.reduce((acc, stage) => {
    return acc + (historicalDurations[stage] || DEFAULT_STAGE_HOURS[stage] || 4);
  }, remainingInCurrentStage);

  const predictedCompletion = addBusinessHours(new Date(), remainingHours);
  const slaDeadline = new Date(order.sla_deadline);
  const now = new Date();

  const hoursUntilDeadline = (slaDeadline - now) / 3600000;
  const slaBreach = predictedCompletion > slaDeadline || now > slaDeadline;

  let riskLevel = 'SAFE';
  let reason = 'Order is on track.';

  if (now > slaDeadline) {
    riskLevel = 'BREACHED';
    reason = `SLA deadline passed ${Math.abs(hoursUntilDeadline).toFixed(1)} hours ago. Currently at ${order.current_status}.`;
  } else if (predictedCompletion > slaDeadline) {
    riskLevel = 'BREACHED';
    reason = `Predicted completion exceeds SLA by ${((predictedCompletion - slaDeadline) / 3600000).toFixed(1)} hours.`;
  } else if (hoursUntilDeadline <= 4) {
    riskLevel = 'AT_RISK';
    reason = `Only ${hoursUntilDeadline.toFixed(1)} business hours remain before SLA deadline.`;
  } else if (hoursInCurrentStage > expectedCurrentStageHours * 1.5) {
    riskLevel = 'AT_RISK';
    reason = `Stage ${order.current_status} has taken ${hoursInCurrentStage.toFixed(1)}h vs expected ${expectedCurrentStageHours}h.`;
  }

  return {
    riskLevel,
    predictedCompletionDate: predictedCompletion.toISOString(),
    slaBreach,
    reason,
    remainingHours: parseFloat(remainingHours.toFixed(2)),
    hoursInCurrentStage: parseFloat(hoursInCurrentStage.toFixed(2)),
  };
}

/**
 * Run TAT prediction for all open orders, update DB, return at-risk list.
 */
async function scanAllOpenOrders() {
  const result = await pool.query(
    `SELECT * FROM orders
     WHERE current_status NOT IN ('DELIVERED', 'CANCELLED')
     ORDER BY sla_deadline ASC`
  );

  const atRisk = [];

  for (const order of result.rows) {
    const prediction = await predictTAT(order);

    await pool.query(
      `UPDATE orders
       SET risk_level = $1,
           predicted_completion_date = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [prediction.riskLevel, prediction.predictedCompletionDate, order.id]
    );

    if (prediction.riskLevel !== 'SAFE') {
      atRisk.push({ order, prediction });
    }
  }

  return atRisk;
}

module.exports = { predictTAT, scanAllOpenOrders };
