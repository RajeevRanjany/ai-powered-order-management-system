const pool = require('../config/db');
const { getAllInventory, getLowStockItems, updateStock, findMatchingInventory } = require('../services/inventoryService');
const { recommendInventoryStocking } = require('../services/geminiService');

async function getInventory(req, res, next) {
  try {
    const { lens_type, coating, low_stock } = req.query;

    if (low_stock === 'true') {
      const items = await getLowStockItems();
      return res.json({ success: true, inventory: items });
    }

    let query = 'SELECT * FROM lens_inventory WHERE 1=1';
    const params = [];
    let idx = 1;

    if (lens_type) { query += ` AND lens_type = $${idx++}`; params.push(lens_type); }
    if (coating)   { query += ` AND coating = $${idx++}`;   params.push(coating); }

    query += ' ORDER BY lens_type, lens_index, coating';

    const result = await pool.query(query, params);
    res.json({ success: true, inventory: result.rows });
  } catch (err) {
    next(err);
  }
}

async function checkAvailability(req, res, next) {
  try {
    const { lens_type, lens_index, coating, sph_right, sph_left, cyl_right, cyl_left } = req.body;
    const item = await findMatchingInventory({ lens_type, lens_index, coating, sph_right, sph_left, cyl_right, cyl_left });

    if (!item || item.quantity_on_hand < 1) {
      return res.json({
        success: true,
        available: false,
        status: 'PROCUREMENT_REQUIRED',
        message: 'Lens not available in stock. Procurement will be required.',
        quantity: item?.quantity_on_hand || 0,
      });
    }

    res.json({
      success: true,
      available: true,
      status: 'IN_HOUSE_AVAILABLE',
      message: `${item.quantity_on_hand} units available in stock.`,
      quantity: item.quantity_on_hand,
      sku: item.sku,
    });
  } catch (err) {
    next(err);
  }
}

async function updateInventoryStock(req, res, next) {
  try {
    const { sku } = req.params;
    const { quantity } = req.body;

    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({ success: false, error: 'quantity must be a non-negative number' });
    }

    const item = await updateStock(sku, quantity);
    if (!item) return res.status(404).json({ success: false, error: 'SKU not found' });

    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

async function getStockingRecommendations(req, res, next) {
  try {
    const [lowStock, recentOrders] = await Promise.all([
      getLowStockItems(),
      pool.query(
        `SELECT lens_type, lens_index, coating FROM orders
         WHERE created_at > NOW() - INTERVAL '30 days'`
      ),
    ]);

    const recommendation = await recommendInventoryStocking(lowStock, recentOrders.rows);
    res.json({ success: true, recommendation, lowStockCount: lowStock.length });
  } catch (err) {
    next(err);
  }
}

module.exports = { getInventory, checkAvailability, updateInventoryStock, getStockingRecommendations };
