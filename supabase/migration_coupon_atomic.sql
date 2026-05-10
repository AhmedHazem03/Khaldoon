-- Migration: atomic coupon increment with max_uses check
-- Replaces the plain increment with a check-and-increment that returns
-- true if the slot was reserved, false if the coupon is already exhausted.
--
-- Run this in the Supabase SQL Editor on existing databases.

CREATE OR REPLACE FUNCTION increment_coupon_uses(p_coupon_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_updated boolean;
BEGIN
  UPDATE offers
    SET uses_count = uses_count + 1
  WHERE id = p_coupon_id
    AND (max_uses IS NULL OR uses_count < max_uses);

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;
