const router = require('express').Router();
const { getInventory, checkAvailability, updateInventoryStock, getStockingRecommendations } = require('../controllers/inventoryController');

router.get('/',                      getInventory);
router.post('/check',                checkAvailability);
router.patch('/:sku/stock',          updateInventoryStock);
router.get('/recommendations',       getStockingRecommendations);

module.exports = router;
