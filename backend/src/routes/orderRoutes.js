const router = require('express').Router();
const { createOrder, getOrders, getOrderById, updateOrderStatus, getTATPrediction } = require('../controllers/orderController');

router.post('/',                     createOrder);
router.get('/',                      getOrders);
router.get('/:id',                   getOrderById);
router.patch('/:id/status',          updateOrderStatus);
router.get('/:id/tat-prediction',    getTATPrediction);

module.exports = router;
