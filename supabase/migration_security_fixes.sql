-- ============================================================
-- Production security & hardening fixes
-- Run this in the Supabase SQL Editor once.
--
-- Fixes:
--   H1 — Coupon codes were world-readable via the public read policy on offers.
--        Solution: restrict column-level SELECT for anon / authenticated roles.
--   H3 — SECURITY DEFINER functions did not pin search_path, opening a
--        function hijack vector if a malicious schema lands earlier on the
--        search path.
--   H4 — Coupon slot was consumed even when order creation later failed.
--        Solution: a decrement_coupon_uses RPC that the API can call to
--        roll the reservation back.
--   M1 — Order codes were sequential (KH-1000, KH-1001…) and leaked volume.
--        Solution: append a short random suffix.
-- ============================================================

-- ── H1: restrict public column access on offers ─────────────────────────────
-- The detail page and validate-coupon route use the service-role key and are
-- unaffected. Only direct browser queries via the anon/authenticated key are
-- restricted.

REVOKE SELECT ON public.offers FROM anon, authenticated;

GRANT SELECT
  (id, title, image_url, expires_at, is_active, order_index,
   benefit_type, benefit_value, min_order_amount, created_at)
  ON public.offers
  TO anon, authenticated;

-- offer_products is fine — it has no secret columns. delivery_zones and
-- settings are intentionally public (fees & store info displayed on UI).

-- ── H3: pin search_path on every SECURITY DEFINER function ──────────────────

ALTER FUNCTION public.handle_new_user()
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.handle_order_status_change()
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.create_order_with_points(
  uuid, integer, integer, integer, integer, integer, jsonb, jsonb,
  uuid, integer, integer
) SET search_path = public, pg_catalog;

ALTER FUNCTION public.increment_coupon_uses(uuid)
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.admin_adjust_points(uuid, integer, text, text)
  SET search_path = public, pg_catalog;

-- generate_order_code is plain (not SECURITY DEFINER) but pinning is still
-- good hygiene since it's invoked from a trigger context.
ALTER FUNCTION public.generate_order_code()
  SET search_path = public, pg_catalog;

-- ── H4: coupon decrement RPC for rollback on order-creation failure ─────────

CREATE OR REPLACE FUNCTION public.decrement_coupon_uses(p_coupon_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  UPDATE public.offers
    SET uses_count = GREATEST(0, uses_count - 1)
    WHERE id = p_coupon_id;
$$;

-- Lock down execution to server-side roles only (service_role / postgres).
REVOKE EXECUTE ON FUNCTION public.decrement_coupon_uses(uuid) FROM PUBLIC, anon, authenticated;

-- ── M1: order code random suffix ────────────────────────────────────────────
-- Keeps the sequence (still useful for ordering) but appends a 4-char hex
-- token so two codes can no longer be subtracted to estimate volume.

CREATE OR REPLACE FUNCTION public.generate_order_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.order_code := 'KH-' ||
    nextval('public.order_code_seq') || '-' ||
    upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4));
  RETURN NEW;
END;
$$;
