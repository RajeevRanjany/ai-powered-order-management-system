const router = require('express').Router();
const { getSummary, getOrdersByStatus, getOrdersByLensType, getOrdersByStore, getActiveOrders, getSLAPerformance } = require('../controllers/dashboardController');

router.get('/summary',               getSummary);
router.get('/active-orders',         getActiveOrders);
router.get('/orders-by-status',      getOrdersByStatus);
router.get('/orders-by-lens-type',   getOrdersByLensType);
router.get('/orders-by-store',       getOrdersByStore);
router.get('/sla-performance',       getSLAPerformance);

module.exports = router;
