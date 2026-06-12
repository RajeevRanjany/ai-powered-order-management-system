
-- USERS
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(255)  UNIQUE NOT NULL,
  role          VARCHAR(20)   NOT NULL DEFAULT 'staff'
                  CHECK (role IN ('admin', 'staff', 'manager')),
  store_location VARCHAR(100),
  created_at    TIMESTAMPTZ   DEFAULT NOW()
);

-- LENS INVENTORY
CREATE TABLE IF NOT EXISTS lens_inventory (
  id               SERIAL PRIMARY KEY,
  sku              VARCHAR(60)   UNIQUE NOT NULL,
  lens_type        VARCHAR(30)   NOT NULL
                     CHECK (lens_type IN ('SINGLE_VISION', 'PROGRESSIVE', 'BIFOCAL')),
  lens_index       NUMERIC(4,2)  NOT NULL
                     CHECK (lens_index IN (1.50, 1.56, 1.60, 1.67, 1.74)),
  coating          VARCHAR(30)   NOT NULL DEFAULT 'NONE'
                     CHECK (coating IN ('AR', 'PHOTOCHROMIC', 'BLUE_CUT', 'TINTED', 'NONE')),

  sph_min          NUMERIC(5,2)  NOT NULL,
  sph_max          NUMERIC(5,2)  NOT NULL,
  cyl_min          NUMERIC(5,2)  NOT NULL DEFAULT 0.00,
  cyl_max          NUMERIC(5,2)  NOT NULL DEFAULT 0.00,
  -- Stock
  
  quantity_on_hand INTEGER       NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
  reorder_point    INTEGER       NOT NULL DEFAULT 5,
  unit_cost        NUMERIC(10,2),
  created_at       TIMESTAMPTZ   DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   DEFAULT NOW()
);

-- ─── ORDERS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id              SERIAL PRIMARY KEY,
  order_number    VARCHAR(30)   UNIQUE NOT NULL,

  -- Customer
  customer_name   VARCHAR(150)  NOT NULL,
  customer_phone  VARCHAR(20),
  customer_email  VARCHAR(255),

  -- Prescription — Right Eye
  sph_right       NUMERIC(5,2),
  cyl_right       NUMERIC(5,2),
  axis_right      SMALLINT      CHECK (axis_right BETWEEN 0 AND 180),
  add_right       NUMERIC(4,2),

  -- Prescription — Left Eye
  sph_left        NUMERIC(5,2),
  cyl_left        NUMERIC(5,2),
  axis_left       SMALLINT      CHECK (axis_left BETWEEN 0 AND 180),
  add_left        NUMERIC(4,2),

  -- Lens Config
  lens_type       VARCHAR(30)   NOT NULL
                    CHECK (lens_type IN ('SINGLE_VISION', 'PROGRESSIVE', 'BIFOCAL')),
  lens_index      NUMERIC(4,2)  NOT NULL,
  coating         VARCHAR(30)   NOT NULL DEFAULT 'NONE'
                    CHECK (coating IN ('AR', 'PHOTOCHROMIC', 'BLUE_CUT', 'TINTED', 'NONE')),

  -- Frame
  frame_brand     VARCHAR(100),
  frame_model     VARCHAR(100),

  -- Order Metadata
  source_channel  VARCHAR(20)   NOT NULL DEFAULT 'STORE'
                    CHECK (source_channel IN ('STORE', 'ONLINE', 'B2B')),
  store_location  VARCHAR(100),

  -- Status & SLA
  current_status  VARCHAR(30)   NOT NULL DEFAULT 'ORDER_PLACED'
                    CHECK (current_status IN (
                      'ORDER_PLACED', 'PRESCRIPTION_VERIFIED', 'LENS_ALLOCATED',
                      'LENS_CUTTING', 'COATING', 'FRAME_FITTING', 'QC',
                      'PACKED', 'SHIPPED', 'DELIVERED',
                      'CANCELLED', 'ON_HOLD', 'REORDER'
                    )),
  sla_deadline    TIMESTAMPTZ   NOT NULL,

  -- Inventory link
  lens_inventory_id INTEGER      REFERENCES lens_inventory(id),
  lens_in_house   BOOLEAN       DEFAULT FALSE,
  procurement_required BOOLEAN  DEFAULT FALSE,

  -- TAT Prediction
  risk_level      VARCHAR(20)   DEFAULT 'SAFE'
                    CHECK (risk_level IN ('SAFE', 'AT_RISK', 'BREACHED')),
  predicted_completion_date TIMESTAMPTZ,
  breach_notified BOOLEAN       DEFAULT FALSE,

  created_by      INTEGER       REFERENCES users(id),
  created_at      TIMESTAMPTZ   DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   DEFAULT NOW()
);

-- ─── ORDER STATUS HISTORY ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_status_history (
  id           SERIAL PRIMARY KEY,
  order_id     INTEGER       NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status       VARCHAR(30)   NOT NULL,
  changed_by   VARCHAR(100),
  delay_reason TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ   DEFAULT NOW()
);

-- ─── ALERTS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
  id                    SERIAL PRIMARY KEY,
  order_id              INTEGER       NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  alert_type            VARCHAR(30)   NOT NULL
                          CHECK (alert_type IN ('AT_RISK', 'BREACHED', 'STAGE_OVERDUE')),
  message               TEXT          NOT NULL,
  risk_level            VARCHAR(20)   NOT NULL,
  predicted_delay_hours NUMERIC(6,2),
  email_sent            BOOLEAN       DEFAULT FALSE,
  email_sent_at         TIMESTAMPTZ,
  acknowledged          BOOLEAN       DEFAULT FALSE,
  acknowledged_at       TIMESTAMPTZ,
  acknowledged_by       VARCHAR(100),
  created_at            TIMESTAMPTZ   DEFAULT NOW()
);

-- ─── INDEXES ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_status       ON orders(current_status);
CREATE INDEX IF NOT EXISTS idx_orders_lens_type    ON orders(lens_type);
CREATE INDEX IF NOT EXISTS idx_orders_store        ON orders(store_location);
CREATE INDEX IF NOT EXISTS idx_orders_sla          ON orders(sla_deadline);
CREATE INDEX IF NOT EXISTS idx_orders_risk         ON orders(risk_level);
CREATE INDEX IF NOT EXISTS idx_orders_created      ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_status_history_order ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_status_history_time  ON order_status_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_order        ON alerts(order_id);
CREATE INDEX IF NOT EXISTS idx_alerts_unacked      ON alerts(acknowledged) WHERE acknowledged = FALSE;

-- ─── UPDATED_AT TRIGGER ───────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER lens_inventory_updated_at
  BEFORE UPDATE ON lens_inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
