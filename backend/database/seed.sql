-- =============================================================
-- Seed Data — Lens Inventory + Sample Users + Orders
-- =============================================================

-- ─── USERS ────────────────────────────────────────────────────
INSERT INTO users (name, email, role, store_location) VALUES
  ('Admin User',     'admin@eyewear.com',   'admin',   'HQ'),
  ('Anita Sharma',   'anita@eyewear.com',   'manager', 'Mumbai - Andheri'),
  ('Ravi Kumar',     'ravi@eyewear.com',    'staff',   'Mumbai - Andheri'),
  ('Priya Nair',     'priya@eyewear.com',   'staff',   'Pune - FC Road'),
  ('Deepak Mehta',   'deepak@eyewear.com',  'manager', 'Pune - FC Road')
ON CONFLICT DO NOTHING;

-- =============================================================
-- LENS INVENTORY
-- SKU format: {TYPE}-{INDEX}-{COATING}-{SPH_RANGE}
-- Covers most commonly ordered power ranges
-- =============================================================

INSERT INTO lens_inventory (sku, lens_type, lens_index, coating, sph_min, sph_max, cyl_min, cyl_max, quantity_on_hand, reorder_point, unit_cost) VALUES

-- ── SINGLE VISION 1.50 ──
('SV-150-NONE-P0P4',      'SINGLE_VISION', 1.50, 'NONE',        0.00,  4.00,-2.00, 0.00, 25, 5, 180.00),
('SV-150-NONE-M0M4',      'SINGLE_VISION', 1.50, 'NONE',       -4.00,  0.00,-2.00, 0.00, 20, 5, 180.00),
('SV-150-NONE-M4M8',      'SINGLE_VISION', 1.50, 'NONE',       -8.00, -4.00,-2.00, 0.00, 12, 5, 200.00),
('SV-150-AR-P0P4',        'SINGLE_VISION', 1.50, 'AR',          0.00,  4.00,-2.00, 0.00, 18, 5, 250.00),
('SV-150-AR-M0M4',        'SINGLE_VISION', 1.50, 'AR',         -4.00,  0.00,-2.00, 0.00, 15, 5, 250.00),
('SV-150-BLUE_CUT-P0P4',  'SINGLE_VISION', 1.50, 'BLUE_CUT',   0.00,  4.00,-2.00, 0.00, 20, 5, 280.00),
('SV-150-BLUE_CUT-M0M4',  'SINGLE_VISION', 1.50, 'BLUE_CUT',  -4.00,  0.00,-2.00, 0.00, 15, 5, 280.00),

-- ── SINGLE VISION 1.56 ──
('SV-156-NONE-P0P6',      'SINGLE_VISION', 1.56, 'NONE',        0.00,  6.00,-2.50, 0.00, 22, 5, 220.00),
('SV-156-NONE-M0M6',      'SINGLE_VISION', 1.56, 'NONE',       -6.00,  0.00,-2.50, 0.00, 18, 5, 220.00),
('SV-156-AR-P0P6',        'SINGLE_VISION', 1.56, 'AR',          0.00,  6.00,-2.50, 0.00, 16, 5, 290.00),
('SV-156-AR-M0M6',        'SINGLE_VISION', 1.56, 'AR',         -6.00,  0.00,-2.50, 0.00, 14, 5, 290.00),
('SV-156-BLUE_CUT-P0P6',  'SINGLE_VISION', 1.56, 'BLUE_CUT',   0.00,  6.00,-2.50, 0.00, 10, 5, 320.00),
('SV-156-PHOTO-M0M4',     'SINGLE_VISION', 1.56, 'PHOTOCHROMIC',-4.00, 0.00,-2.00, 0.00,  8, 3, 450.00),

-- ── SINGLE VISION 1.60 ──
('SV-160-NONE-M0M8',      'SINGLE_VISION', 1.60, 'NONE',       -8.00,  0.00,-3.00, 0.00, 14, 4, 280.00),
('SV-160-AR-M0M8',        'SINGLE_VISION', 1.60, 'AR',         -8.00,  0.00,-3.00, 0.00, 10, 4, 360.00),
('SV-160-BLUE_CUT-M0M6',  'SINGLE_VISION', 1.60, 'BLUE_CUT',  -6.00,  0.00,-3.00, 0.00,  8, 3, 380.00),

-- ── SINGLE VISION 1.67 (High Index) ──
('SV-167-NONE-M6M12',     'SINGLE_VISION', 1.67, 'NONE',      -12.00, -6.00,-3.00, 0.00,  8, 3, 480.00),
('SV-167-AR-M6M12',       'SINGLE_VISION', 1.67, 'AR',        -12.00, -6.00,-3.00, 0.00,  6, 3, 560.00),

-- ── SINGLE VISION 1.74 (Ultra High Index) ──
('SV-174-AR-M12M20',      'SINGLE_VISION', 1.74, 'AR',        -20.00,-12.00,-4.00, 0.00,  4, 2, 850.00),

-- ── PROGRESSIVE 1.56 ──
('PR-156-NONE-ADD1A2',    'PROGRESSIVE',   1.56, 'NONE',       -4.00,  4.00,-2.00, 0.00, 10, 3, 650.00),
('PR-156-AR-ADD1A2',      'PROGRESSIVE',   1.56, 'AR',         -4.00,  4.00,-2.00, 0.00,  8, 3, 780.00),
('PR-156-BLUE_CUT-ADD1A2','PROGRESSIVE',   1.56, 'BLUE_CUT',  -4.00,  4.00,-2.00, 0.00,  6, 3, 820.00),

-- ── PROGRESSIVE 1.60 ──
('PR-160-AR-ADD1A2',      'PROGRESSIVE',   1.60, 'AR',         -6.00,  4.00,-2.50, 0.00,  6, 3, 950.00),
('PR-160-PHOTO-ADD1A2',   'PROGRESSIVE',   1.60, 'PHOTOCHROMIC',-4.00, 4.00,-2.00, 0.00,  4, 2,1200.00),

-- ── PROGRESSIVE 1.67 ──
('PR-167-AR-ADD1A2',      'PROGRESSIVE',   1.67, 'AR',         -8.00,  4.00,-3.00, 0.00,  4, 2,1150.00),

-- ── BIFOCAL 1.50 ──
('BF-150-NONE-P0P4',      'BIFOCAL',       1.50, 'NONE',        0.00,  4.00,-2.00, 0.00, 10, 3, 350.00),
('BF-150-AR-M0M4',        'BIFOCAL',       1.50, 'AR',         -4.00,  0.00,-2.00, 0.00,  8, 3, 420.00),

-- ── BIFOCAL 1.56 ──
('BF-156-NONE-M0M6',      'BIFOCAL',       1.56, 'NONE',       -6.00,  0.00,-2.50, 0.00,  8, 3, 400.00),
('BF-156-AR-M0M6',        'BIFOCAL',       1.56, 'AR',         -6.00,  0.00,-2.50, 0.00,  6, 3, 480.00)

ON CONFLICT (sku) DO NOTHING;

-- =============================================================
-- SAMPLE ORDERS (mix of statuses for dashboard demo)
-- =============================================================

INSERT INTO orders (
  order_number, customer_name, customer_phone, customer_email,
  sph_right, cyl_right, axis_right, sph_left, cyl_left, axis_left,
  lens_type, lens_index, coating, frame_brand, frame_model,
  source_channel, store_location, current_status, sla_deadline,
  lens_in_house, procurement_required, risk_level
) VALUES

('ORD-2026-00001', 'Rahul Verma',   '9876543210', 'rahul@email.com',
  -1.50, -0.50, 90,  -1.75, -0.50, 85,
  'SINGLE_VISION', 1.56, 'AR', 'Ray-Ban', 'RB3447',
  'STORE', 'Mumbai - Andheri', 'LENS_CUTTING',
  NOW() + INTERVAL '2 days', TRUE, FALSE, 'SAFE'),

('ORD-2026-00002', 'Sneha Patil',   '9123456789', 'sneha@email.com',
  -3.00, -1.00, 180, -2.75, -0.75, 175,
  'PROGRESSIVE', 1.60, 'AR', 'Oakley', 'OX8046',
  'STORE', 'Pune - FC Road', 'PRESCRIPTION_VERIFIED',
  NOW() + INTERVAL '5 days', TRUE, FALSE, 'SAFE'),

('ORD-2026-00003', 'Amit Joshi',    '9988776655', 'amit@email.com',
  -5.50, -1.25, 45,  -6.00, -1.50, 50,
  'SINGLE_VISION', 1.67, 'NONE', 'Titan', 'TW2001',
  'ONLINE', 'Mumbai - Andheri', 'ORDER_PLACED',
  NOW() + INTERVAL '1 day', FALSE, TRUE, 'AT_RISK'),

('ORD-2026-00004', 'Meera Nambiar', '9012345678', 'meera@email.com',
  1.00, -0.25, 90,   0.75, -0.50, 85,
  'SINGLE_VISION', 1.50, 'BLUE_CUT', 'Vogue', 'VO5184',
  'STORE', 'Mumbai - Andheri', 'QC',
  NOW() + INTERVAL '4 hours', TRUE, FALSE, 'AT_RISK'),

('ORD-2026-00005', 'Kiran Shah',    '9654321098', 'kiran@email.com',
  -8.00, -2.00, 135, -7.75, -1.75, 140,
  'SINGLE_VISION', 1.74, 'AR', 'Persol', 'PO3007V',
  'B2B', 'Pune - FC Road', 'COATING',
  NOW() - INTERVAL '2 hours', FALSE, TRUE, 'BREACHED'),

('ORD-2026-00006', 'Divya Rao',     '9321654987', 'divya@email.com',
  -2.00, -0.75, 90,  -2.25, -0.50, 95,
  'BIFOCAL', 1.56, 'AR', 'Lenskart', 'LK4490',
  'ONLINE', 'Pune - FC Road', 'FRAME_FITTING',
  NOW() + INTERVAL '1 day', TRUE, FALSE, 'SAFE'),

('ORD-2026-00007', 'Suresh Iyer',   '9876001122', 'suresh@email.com',
  -1.00, 0.00, 0,    -1.25, -0.25, 80,
  'SINGLE_VISION', 1.56, 'NONE', 'Fastrack', 'FT1234',
  'STORE', 'Mumbai - Andheri', 'PACKED',
  NOW() + INTERVAL '8 hours', TRUE, FALSE, 'SAFE'),

('ORD-2026-00008', 'Nisha Gupta',   '9445566778', 'nisha@email.com',
  -4.25, -1.50, 160, -4.00, -1.25, 165,
  'PROGRESSIVE', 1.56, 'PHOTOCHROMIC', 'Titan', 'TW3020',
  'STORE', 'Pune - FC Road', 'REORDER',
  NOW() + INTERVAL '6 days', FALSE, TRUE, 'AT_RISK'),

('ORD-2026-00009', 'Arun Pillai',   '9550011223', 'arun@email.com',
  0.50, -0.50, 90,   0.75, -0.25, 85,
  'SINGLE_VISION', 1.50, 'AR', 'John Jacobs', 'JJ3001',
  'STORE', 'Mumbai - Andheri', 'DELIVERED',
  NOW() - INTERVAL '1 day', TRUE, FALSE, 'SAFE'),

('ORD-2026-00010', 'Pooja Singh',   '9667788990', 'pooja@email.com',
  -6.50, -2.00, 75,  -6.75, -2.25, 80,
  'SINGLE_VISION', 1.67, 'AR', 'Carrera', 'CA1023',
  'B2B', 'Mumbai - Andheri', 'LENS_ALLOCATED',
  NOW() + INTERVAL '12 hours', TRUE, FALSE, 'AT_RISK')

ON CONFLICT (order_number) DO NOTHING;

-- ─── SEED STATUS HISTORY for sample orders ────────────────────
DO $$
DECLARE
  o RECORD;
BEGIN
  FOR o IN SELECT id, order_number, current_status, created_at FROM orders LOOP
    -- Every order gets ORDER_PLACED
    INSERT INTO order_status_history (order_id, status, changed_by, created_at)
    VALUES (o.id, 'ORDER_PLACED', 'System', o.created_at)
    ON CONFLICT DO NOTHING;

    -- Add intermediate stages based on current status
    IF o.current_status NOT IN ('ORDER_PLACED', 'CANCELLED') THEN
      INSERT INTO order_status_history (order_id, status, changed_by, created_at)
      VALUES (o.id, 'PRESCRIPTION_VERIFIED', 'Staff', o.created_at + INTERVAL '1 hour')
      ON CONFLICT DO NOTHING;
    END IF;

    IF o.current_status IN ('LENS_ALLOCATED','LENS_CUTTING','COATING','FRAME_FITTING',
                             'QC','PACKED','SHIPPED','DELIVERED','REORDER') THEN
      INSERT INTO order_status_history (order_id, status, changed_by, created_at)
      VALUES (o.id, 'LENS_ALLOCATED', 'Staff', o.created_at + INTERVAL '3 hours')
      ON CONFLICT DO NOTHING;
    END IF;

    IF o.current_status IN ('LENS_CUTTING','COATING','FRAME_FITTING','QC','PACKED','SHIPPED','DELIVERED') THEN
      INSERT INTO order_status_history (order_id, status, changed_by, created_at)
      VALUES (o.id, 'LENS_CUTTING', 'Staff', o.created_at + INTERVAL '8 hours')
      ON CONFLICT DO NOTHING;
    END IF;

    IF o.current_status IN ('COATING','FRAME_FITTING','QC','PACKED','SHIPPED','DELIVERED') THEN
      INSERT INTO order_status_history (order_id, status, changed_by, created_at)
      VALUES (o.id, 'COATING', 'Staff', o.created_at + INTERVAL '18 hours')
      ON CONFLICT DO NOTHING;
    END IF;

    IF o.current_status IN ('FRAME_FITTING','QC','PACKED','SHIPPED','DELIVERED') THEN
      INSERT INTO order_status_history (order_id, status, changed_by, created_at)
      VALUES (o.id, 'FRAME_FITTING', 'Staff', o.created_at + INTERVAL '26 hours')
      ON CONFLICT DO NOTHING;
    END IF;

    IF o.current_status IN ('QC','PACKED','SHIPPED','DELIVERED') THEN
      INSERT INTO order_status_history (order_id, status, changed_by, created_at)
      VALUES (o.id, 'QC', 'Staff', o.created_at + INTERVAL '30 hours')
      ON CONFLICT DO NOTHING;
    END IF;

    IF o.current_status IN ('PACKED','SHIPPED','DELIVERED') THEN
      INSERT INTO order_status_history (order_id, status, changed_by, created_at)
      VALUES (o.id, 'PACKED', 'Staff', o.created_at + INTERVAL '34 hours')
      ON CONFLICT DO NOTHING;
    END IF;

    IF o.current_status IN ('SHIPPED','DELIVERED') THEN
      INSERT INTO order_status_history (order_id, status, changed_by, created_at)
      VALUES (o.id, 'SHIPPED', 'Staff', o.created_at + INTERVAL '36 hours')
      ON CONFLICT DO NOTHING;
    END IF;

    IF o.current_status = 'DELIVERED' THEN
      INSERT INTO order_status_history (order_id, status, changed_by, created_at)
      VALUES (o.id, 'DELIVERED', 'Staff', o.created_at + INTERVAL '60 hours')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;
