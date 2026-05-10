-- Migration: Award points immediately on order creation (no admin confirmation needed)
-- Run this in the Supabase SQL Editor

-- 1. Update trigger: remove the "award on confirmed" block
--    Keep only: reverse on cancellation + refund points_used on cancellation
CREATE OR REPLACE FUNCTION handle_order_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- On any cancellation: reverse earned points (awarded immediately at order creation)
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled'
     AND OLD.points_earned > 0 AND OLD.user_id IS NOT NULL THEN
    UPDATE users
      SET points_balance = GREATEST(0, points_balance - OLD.points_earned)
      WHERE id = OLD.user_id;
    INSERT INTO point_transactions (user_id, order_id, transaction_type, points, note)
      VALUES (OLD.user_id, OLD.id, 'reversed', OLD.points_earned,
              'تراجع — إلغاء طلب ' || OLD.order_code);
    NEW.points_status := 'cancelled';
  END IF;

  -- On any cancellation: refund points_used (redeemed discount)
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

-- 2. Update RPC: award points immediately inside create_order_with_points
CREATE OR REPLACE FUNCTION create_order_with_points(
  p_user_id        uuid,
  p_points_to_use  integer,
  p_subtotal       integer,
  p_delivery_fee   integer,
  p_discount       integer,
  p_total          integer,
  p_order_data     jsonb,
  p_items          jsonb,
  p_coupon_id      uuid    DEFAULT NULL,
  p_offer_discount integer DEFAULT 0,
  p_bonus_points   integer DEFAULT 0
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
    points_used, points_earned, coupon_id, points_status
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
    p_coupon_id, 'confirmed'
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

  -- Award earned points immediately — no admin confirmation required
  IF v_points_earned > 0 THEN
    UPDATE users SET points_balance = points_balance + v_points_earned
    WHERE id = p_user_id;
    INSERT INTO point_transactions (user_id, order_id, transaction_type, points)
    VALUES (p_user_id, v_order_id, 'earned', v_points_earned);
  END IF;

  RETURN v_order_id;
END;
$$;
