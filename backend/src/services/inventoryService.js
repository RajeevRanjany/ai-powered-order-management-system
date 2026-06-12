const pool = require('../config/db');

/**
 * Find matching inventory for an order's lens config + prescription power.
 * Returns the best-match row or null.
 */
async function findMatchingInventory({ lens_type, lens_index, coating, sph_right, sph_left, cyl_right, cyl_left }) {
  // Use the stronger eye's power for matching
  const sph = Math.abs(sph_right || 0) >= Math.abs(sph_left || 0) ? (sph_right || 0) : (sph_left || 0);
  const cyl = Math.abs(cyl_right || 0) >= Math.abs(cyl_left || 0) ? (cyl_right || 0) : (cyl_left || 0);

  const result = await pool.query(
    `SELECT * FROM lens_inventory
     WHERE lens_type  = $1
       AND lens_index = $2
       AND coating    = $3
       AND sph_min   <= $4 AND sph_max >= $4
       AND cyl_min   <= $5 AND cyl_max >= $5
     ORDER BY quantity_on_hand DESC
     LIMIT 1`,
    [lens_type, parseFloat(lens_index), coating, sph, cyl]
  );

  return result.rows[0] || null;
}

/**
 * Check availability and optionally deduct stock (within a transaction).
 * Returns { available: bool, inventoryId, qty }
 */
async function checkAndDeductStock(orderData, client) {
  const db = client || pool;

  const inventory = await findMatchingInventory(orderData);

  if (!inventory || inventory.quantity_on_hand < 1) {
    return { available: false, inventoryId: inventory?.id || null, qty: inventory?.quantity_on_hand || 0 };
  }

  // Deduct one unit
  await db.query(
    `UPDATE lens_inventory
     SET quantity_on_hand = quantity_on_hand - 1, updated_at = NOW()
     WHERE id = $1`,
    [inventory.id]
  );

  return { available: true, inventoryId: inventory.id, qty: inventory.quantity_on_hand - 1 };
}

async function getLowStockItems() {
  const result = await pool.query(
    `SELECT * FROM lens_inventory
     WHERE quantity_on_hand <= reorder_point
     ORDER BY (quantity_on_hand::float / NULLIF(reorder_point,0)) ASC`
  );
  return result.rows;
}

async function getAllInventory() {
  const result = await pool.query(
    `SELECT * FROM lens_inventory ORDER BY lens_type, lens_index, coating`
  );
  return result.rows;
}

async function updateStock(sku, quantity) {
  const result = await pool.query(
    `UPDATE lens_inventory
     SET quantity_on_hand = $1, updated_at = NOW()
     WHERE sku = $2
     RETURNING *`,
    [quantity, sku]
  );
  return result.rows[0];
}

module.exports = { checkAndDeductStock, getLowStockItems, getAllInventory, updateStock, findMatchingInventory };
