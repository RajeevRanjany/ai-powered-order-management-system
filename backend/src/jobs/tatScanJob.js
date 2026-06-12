const cron = require('node-cron');
const { scanAllOpenOrders } = require('../services/tatService');
const { createAndDispatchAlert } = require('../services/alertService');

function startTATScanJob() {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log(`[TAT Scan] Starting at ${new Date().toISOString()}`);
    try {
      const atRiskOrders = await scanAllOpenOrders();
      console.log(`[TAT Scan] Found ${atRiskOrders.length} at-risk orders`);

      for (const { order, prediction } of atRiskOrders) {
        await createAndDispatchAlert(order, prediction);
      }
    } catch (err) {
      console.error('[TAT Scan] Error:', err.message);
    }
  });

  console.log('[TAT Scan] Scheduled every 15 minutes');
}

module.exports = { startTATScanJob };
