const router = require('express').Router();
const { listAlerts, acknowledge, explainRisk, triggerScan } = require('../controllers/alertController');

router.get('/',                             listAlerts);
router.post('/trigger-scan',               triggerScan);
router.patch('/:id/acknowledge',            acknowledge);
router.get('/explain/:order_id',            explainRisk);

module.exports = router;
