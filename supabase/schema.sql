-- ============================================================
-- Khaldoun Restaurant — Full Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE categories (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  icon         text,
  image_url    text,
  order_index  integer     DEFAULT 0,
  is_visible   boolean     DEFAULT true,
  created_at   timestamp   DEFAULT now()
);

-- Migration (run if table already exists):
-- ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url text;

CREATE TABLE products (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   uuid        REFERENCES categories(id) ON DELETE CASCADE,
  name          text        NOT NULL,
  description   text,
  base_price    integer,
  image_url     text,
  is_available  boolean     DEFAULT true,
  cta_type      text        DEFAULT 'add_to_cart',
  order_index   integer     DEFAULT 0,
  created_at    timestamp   DEFAULT now()
);

CREATE TABLE product_variants (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid        REFERENCES products(id) ON DELETE CASCADE,
  variant_name  text        NOT NULL,
  price         integer     NOT NULL,
  is_available  boolean     DEFAULT true,
  order_index   integer     DEFAULT 0
);

CREATE TABLE users (
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id          uuid    UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number     text    UNIQUE NOT NULL,
  name             text,
  default_address  text,
  points_balance   integer DEFAULT 0,
  created_at       timestamp DEFAULT now()
);

CREATE TABLE delivery_zones (
  id         uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_name  text      NOT NULL,
  fee        integer   NOT NULL,
  is_active  boolean   DEFAULT true,
  created_at timestamp DEFAULT now()
);

CREATE TABLE orders (
  id                uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code        text    UNIQUE NOT NULL DEFAULT '',
  user_id           uuid    REFERENCES users(id),
  customer_name     text    NOT NULL,
  customer_phone    text    NOT NULL,
  delivery_address  text,
  order_type        text    NOT NULL,
  zone_id           uuid    REFERENCES delivery_zones(id),
  notes             text,
  status            text    DEFAULT 'pending',
  subtotal          integer NOT NULL,
  delivery_fee      integer DEFAULT 0,
  discount_amount   integer DEFAULT 0,
  total_price       integer NOT NULL,
  points_used       integer DEFAULT 0,
  points_earned     integer DEFAULT 0,
  points_status     text    DEFAULT 'pending',
  whatsapp_opened   boolean DEFAULT false,
  offer_discount    integer DEFAULT 0,      -- EGP discount from coupon/offer
  coupon_id         uuid    REFERENCES offers(id),
  guest_token       text,
  created_at        timestamp DEFAULT now(),

  CONSTRAINT chk_zone_required CHECK (order_type = 'pickup' OR zone_id IS NOT NULL),
  CONSTRAINT chk_status CHECK (status IN ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'))
);

CREATE TABLE order_items (
  id            uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid      REFERENCES orders(id) ON DELETE CASCADE,
  product_id    uuid      REFERENCES products(id) ON DELETE SET NULL,
  variant_id    uuid      REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name  text      NOT NULL,
  variant_name  text,
  unit_price    integer   NOT NULL,
  quantity      integer   NOT NULL DEFAULT 1,
  subtotal      integer   NOT NULL,

  CONSTRAINT chk_order_item_subtotal CHECK (subtotal = unit_price * quantity)
);

CREATE TABLE point_transactions (
  id                uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid      REFERENCES users(id) ON DELETE CASCADE,
  order_id          uuid      REFERENCES orders(id),
  transaction_type  text      NOT NULL,
  points            integer   NOT NULL CHECK (points > 0),
  note              text,
  created_at        timestamp DEFAULT now()
);

CREATE TABLE offers (
  id               uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text,
  image_url        text,
  expires_at       timestamp,
  is_active        boolean   DEFAULT true,
  order_index      integer   DEFAULT 0,
  -- benefit_type: display_only | discount_pct | discount_fixed | points_multiplier | coupon_pct | coupon_fixed
  benefit_type     text      DEFAULT 'display_only',
  benefit_value    numeric   DEFAULT 0,
  coupon_code      text,                   -- for coupon_* types only
  min_order_amount integer   DEFAULT 0,    -- min subtotal to use coupon
  max_uses         integer,                -- NULL = unlimited
  uses_count       integer   DEFAULT 0,
  created_at       timestamp DEFAULT now()
);

CREATE TABLE offer_products (
  id          uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id    uuid      NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  product_id  uuid      REFERENCES products(id) ON DELETE CASCADE,
  order_index integer   DEFAULT 0,
  created_at  timestamp DEFAULT now(),
  UNIQUE (offer_id, product_id)
);

-- ============================================================
-- MIGRATION v2: Run these ALTER statements on existing databases
-- ============================================================

-- ALTER TABLE offers
--   ADD COLUMN IF NOT EXISTS benefit_type     text    DEFAULT 'display_only',
--   ADD COLUMN IF NOT EXISTS benefit_value    numeric DEFAULT 0,
--   ADD COLUMN IF NOT EXISTS coupon_code      text,
--   ADD COLUMN IF NOT EXISTS min_order_amount integer DEFAULT 0,
--   ADD COLUMN IF NOT EXISTS max_uses         integer,
--   ADD COLUMN IF NOT EXISTS uses_count       integer DEFAULT 0;
--
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_offers_coupon_code
--   ON offers(coupon_code) WHERE coupon_code IS NOT NULL;
--
-- ALTER TABLE orders
--   ADD COLUMN IF NOT EXISTS offer_discount integer DEFAULT 0,
--   ADD COLUMN IF NOT EXISTS coupon_id      uuid REFERENCES offers(id);
--
-- CREATE TABLE IF NOT EXISTS offer_products (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   offer_id uuid NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
--   product_id uuid REFERENCES products(id) ON DELETE CASCADE,
--   order_index integer DEFAULT 0,
--   created_at timestamp DEFAULT now(),
--   UNIQUE (offer_id, product_id)
-- );

CREATE TABLE settings (
  key   text PRIMARY KEY,
  value text
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_orders_customer_phone   ON orders(customer_phone);
CREATE INDEX idx_orders_created_at       ON orders(created_at DESC);
CREATE INDEX idx_orders_status           ON orders(status);
CREATE INDEX idx_orders_order_code       ON orders(order_code);
CREATE INDEX idx_users_phone_number      ON users(phone_number);
CREATE INDEX idx_order_items_order_id    ON order_items(order_id);
CREATE INDEX idx_point_tx_user_id        ON point_transactions(user_id);
CREATE INDEX idx_orders_created_status   ON orders(created_at DESC, status);
CREATE INDEX idx_order_items_product     ON order_items(product_id, order_id);
CREATE INDEX idx_products_category_avail ON products(category_id, is_available, order_index);
CREATE INDEX idx_orders_guest_token      ON orders(guest_token) WHERE guest_token IS NOT NULL;
CREATE INDEX idx_offer_products_offer    ON offer_products(offer_id);
CREATE INDEX idx_offer_products_product  ON offer_products(product_id);
CREATE UNIQUE INDEX idx_offers_coupon_code ON offers(coupon_code) WHERE coupon_code IS NOT NULL;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger 1: handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (auth_id, phone_number, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
    COALESCE(NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger 2: generate_order_code
CREATE SEQUENCE order_code_seq START 1000;

CREATE OR REPLACE FUNCTION generate_order_code()
RETURNS trigger AS $$
BEGIN
  NEW.order_code := 'KH-' || nextval('order_code_seq');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_code
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_code();

-- Trigger 3: handle_order_status_change
CREATE OR REPLACE FUNCTION handle_order_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- On confirmed: award earned points to user balance
  IF OLD.status != 'confirmed' AND NEW.status = 'confirmed'
     AND NEW.points_earned > 0 AND NEW.user_id IS NOT NULL THEN
    UPDATE users
      SET points_balance = points_balance + NEW.points_earned
      WHERE id = NEW.user_id;
    INSERT INTO point_transactions (user_id, order_id, transaction_type, points)
      VALUES (NEW.user_id, NEW.id, 'earned', NEW.points_earned);
    NEW.points_status := 'confirmed';
  END IF;

  -- On cancellation of a previously confirmed order: reverse earned points
  IF OLD.status = 'confirmed' AND NEW.status = 'cancelled'
     AND OLD.points_earned > 0 AND OLD.user_id IS NOT NULL THEN
    UPDATE users
      SET points_balance = GREATEST(0, points_balance - OLD.points_earned)
      WHERE id = OLD.user_id;
    INSERT INTO point_transactions (user_id, order_id, transaction_type, points, note)
      VALUES (OLD.user_id, OLD.id, 'reversed', OLD.points_earned,
              'تراجع — إلغاء طلب ' || OLD.order_code);
    NEW.points_status := 'cancelled';
  END IF;

  -- On any cancellation: refund points_used
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled'
     AND OLD.points_used > 0 AND OLD.user_id IS NOT NULL THEN
    UPDATE users
      SET points_balance = points_balance + OLD.points_used
      WHERE id = OLD.user_id;
    INSERT INTO point_transactions (user_id, order_id, transaction_type, points, note)
      VALUES (OLD.user_id, OLD.id, 'refunded', OLD.points_used,
              'استرداد خصم — إلغاء طلب ' || OLD.order_code);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_status_change
  BEFORE UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION handle_order_status_change();

-- ============================================================
-- RPCs
-- ============================================================

CREATE OR REPLACE FUNCTION create_order_with_points(
  p_user_id        uuid,
  p_points_to_use  integer,
  p_subtotal       integer,
  p_delivery_fee   integer,
  p_discount       integer,     -- EGP value of redeemed points
  p_total          integer,
  p_order_data     jsonb,
  p_items          jsonb,
  p_coupon_id      uuid    DEFAULT NULL,
  p_offer_discount integer DEFAULT 0,   -- EGP discount from coupon/product offer
  p_bonus_points   integer DEFAULT 0    -- extra points from multiplier offers
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_balance        integer;
  v_order_id       uuid;
  v_points_per_100 integer;
  v_points_earned  integer;
  v_item           jsonb;
BEGIN
  IF p_points_to_use < 0 THEN
    RAISE EXCEPTION 'invalid_points: لا يجوز نقاط سالبة';
  END IF;

  SELECT points_balance INTO v_balance
  FROM users WHERE id = p_user_id FOR UPDATE;

  IF v_balance < p_points_to_use THEN
    RAISE EXCEPTION 'insufficient_points';
  END IF;

  SELECT COALESCE(CAST(value AS integer), 1)
  INTO v_points_per_100
  FROM settings WHERE key = 'points_per_100_egp';

  v_points_earned := FLOOR(p_subtotal::numeric / 100) * COALESCE(v_points_per_100, 1) + p_bonus_points;

  INSERT INTO orders (
    user_id, customer_name, customer_phone, delivery_address,
    order_type, zone_id, notes,
    subtotal, delivery_fee, discount_amount, offer_discount, total_price,
    points_used, points_earned, coupon_id
  ) VALUES (
    p_user_id,
    p_order_data->>'customer_name',
    p_order_data->>'customer_phone',
    p_order_data->>'delivery_address',
    p_order_data->>'order_type',
    NULLIF(p_order_data->>'zone_id', '')::uuid,
    p_order_data->>'notes',
    p_subtotal, p_delivery_fee, p_discount, p_offer_discount, p_total,
    p_points_to_use, v_points_earned,
    p_coupon_id
  ) RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO order_items (
      order_id, product_id, variant_id,
      product_name, variant_name,
      unit_price, quantity, subtotal
    ) VALUES (
      v_order_id,
      (v_item->>'product_id')::uuid,
      NULLIF(v_item->>'variant_id', '')::uuid,
      v_item->>'product_name',
      NULLIF(v_item->>'variant_name', ''),
      (v_item->>'unit_price')::integer,
      (v_item->>'quantity')::integer,
      (v_item->>'unit_price')::integer * (v_item->>'quantity')::integer
    );
  END LOOP;

  IF p_points_to_use > 0 THEN
    UPDATE users SET points_balance = points_balance - p_points_to_use
    WHERE id = p_user_id;
    INSERT INTO point_transactions (user_id, order_id, transaction_type, points)
    VALUES (p_user_id, v_order_id, 'redeemed', p_points_to_use);
  END IF;

  -- NOTE: 'earned' points are NOT inserted here.
  -- The handle_order_status_change trigger inserts the 'earned' record
  -- when order status changes to 'confirmed'. Inserting here would cause duplicates.

  RETURN v_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION admin_adjust_points(
  p_user_id   uuid,
  p_amount    integer,
  p_type      text,
  p_note      text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_balance integer;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'invalid_amount: يجب أن يكون المبلغ أكبر من صفر';
  END IF;
  IF p_type NOT IN ('manual_add', 'manual_deduct') THEN
    RAISE EXCEPTION 'invalid_type: يجب أن يكون النوع manual_add أو manual_deduct';
  END IF;

  SELECT points_balance INTO v_balance
  FROM users WHERE id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  IF p_type = 'manual_deduct' AND v_balance < p_amount THEN
    RAISE EXCEPTION 'insufficient_points';
  END IF;

  IF p_type = 'manual_add' THEN
    UPDATE users SET points_balance = points_balance + p_amount WHERE id = p_user_id;
  ELSE
    UPDATE users SET points_balance = GREATEST(0, points_balance - p_amount) WHERE id = p_user_id;
  END IF;

  INSERT INTO point_transactions (user_id, order_id, transaction_type, points, note)
  VALUES (p_user_id, NULL, p_type, p_amount, p_note);
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones   ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_products   ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "public read categories"       ON categories       FOR SELECT USING (true);
CREATE POLICY "public read products"         ON products         FOR SELECT USING (true);
CREATE POLICY "public read product_variants" ON product_variants FOR SELECT USING (true);
CREATE POLICY "public read offers"           ON offers           FOR SELECT USING (true);
CREATE POLICY "public read offer_products"   ON offer_products   FOR SELECT USING (true);
CREATE POLICY "public read delivery_zones"   ON delivery_zones   FOR SELECT USING (true);
CREATE POLICY "public read settings"         ON settings         FOR SELECT USING (true);

-- User-scoped policies
CREATE POLICY "users read own profile"
  ON users FOR SELECT
  USING (auth.uid() = auth_id);

CREATE POLICY "users update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = auth_id);

CREATE POLICY "users read own orders"
  ON orders FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "users read own transactions"
  ON point_transactions FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Admin full access (role checked via JWT app_metadata)
CREATE POLICY "admin full access categories"
  ON categories FOR ALL
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "admin full access products"
  ON products FOR ALL
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "admin full access product_variants"
  ON product_variants FOR ALL
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "admin full access offers"
  ON offers FOR ALL
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "admin full access offer_products"
  ON offer_products FOR ALL
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "admin full access delivery_zones"
  ON delivery_zones FOR ALL
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "admin full access settings"
  ON settings FOR ALL
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "admin full access users"
  ON users FOR ALL
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "admin full access orders"
  ON orders FOR ALL
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "admin full access order_items"
  ON order_items FOR ALL
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "admin full access point_transactions"
  ON point_transactions FOR ALL
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- ============================================================
-- SETTINGS SEED DATA (T019)
-- ============================================================

INSERT INTO settings (key, value) VALUES
  ('whatsapp_order_number',   '201064414303'),
  ('whatsapp_social_url',     'https://wa.me/201064414303'),
  ('facebook_url',            ''),
  ('instagram_url',           ''),
  ('tiktok_url',              ''),
  ('phone_1',                 '01064414303'),
  ('phone_2',                 '01120301003'),
  ('phone_3',                 '01228889102'),
  ('restaurant_address',      'شارع مستشفى الهلال بجوار كبده الفلاح'),
  ('delivery_enabled',        'true'),
  ('pickup_enabled',          'true'),
  ('points_per_100_egp',      '1'),
  ('point_value_egp',         '0.5'),
  ('max_points_discount_pct', '20'),
  ('stat_customers',          '5000'),
  ('stat_years',              '10'),
  ('working_hours',           '10:00 ص — 2:00 ص'),
  ('is_ordering_open',        'true')
ON CONFLICT (key) DO NOTHING;
