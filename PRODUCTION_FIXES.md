# Production Readiness Fixes — Khaldoun Restaurant

**Date:** 2026-05-14
**Branch:** main
**Type-check:** ✅ passes (`npx tsc --noEmit`)

This document records every change applied in response to the production-readiness review. Each entry is keyed by the issue ID from the review (H = high, M = medium, L = low).

---

## ⚠️ Required deploy steps

1. **Run the SQL migration** in the Supabase SQL Editor:
   [supabase/migration_security_fixes.sql](supabase/migration_security_fixes.sql)
2. **Regenerate DB types** so the new `decrement_coupon_uses` RPC is typed:
   ```bash
   supabase gen types typescript --project-id <ref> > types/database.ts
   ```
   Then remove the temporary cast in [app/api/orders/route.ts](app/api/orders/route.ts#L9) (the `rollbackCoupon` helper).
3. **Commit `next-env.d.ts`** to git — it's no longer ignored.
4. **Verify CSP** in production by browsing key flows (checkout, OAuth sign-in, admin upload) with DevTools open. If any third-party domain is blocked, extend the directives in [vercel.json](vercel.json).
5. **First deploy will invalidate persisted carts** — see L8 below.

---

## 🔴 High-severity fixes

### H1 — Coupon codes were world-readable via Supabase anon key
**Files:**
- [supabase/migration_security_fixes.sql](supabase/migration_security_fixes.sql#L18)

**Fix:** Replaced the unrestricted `public read offers` policy with column-level `GRANT SELECT`. Anon and authenticated roles can now read only display columns; sensitive columns (`coupon_code`, `max_uses`, `uses_count`) are reachable only via the service-role server code (`/api/offers/validate-coupon` and the offer details page).

### H2 — `points_to_use` was not capped server-side by `max_points_discount_pct`
**Files:**
- [app/api/orders/route.ts:285-294](app/api/orders/route.ts#L285)

**Fix:** Before invoking `create_order_with_points`, the API now recomputes `maxDiscountEgp = floor(subtotal_after_coupon × maxPct / 100)` and clamps `pointsToUse` to that ceiling. Hand-crafted requests can no longer redeem points past the configured percentage cap.

### H3 — `SECURITY DEFINER` functions had no pinned `search_path`
**Files:**
- [supabase/migration_security_fixes.sql:37-58](supabase/migration_security_fixes.sql#L37)

**Fix:** `ALTER FUNCTION … SET search_path = public, pg_catalog` applied to every `SECURITY DEFINER` function (`handle_new_user`, `handle_order_status_change`, `create_order_with_points`, `increment_coupon_uses`, `admin_adjust_points`) and to `generate_order_code` for good measure.

### H4 — Coupon slot was consumed when order creation later failed
**Files:**
- [supabase/migration_security_fixes.sql:62-75](supabase/migration_security_fixes.sql#L62) — new `decrement_coupon_uses` RPC
- [app/api/orders/route.ts:9-18](app/api/orders/route.ts#L9) — `rollbackCoupon` helper
- [app/api/orders/route.ts:296, 306, 343, 388, 401](app/api/orders/route.ts#L296) — rollback call sites

**Fix:** Every failure path after `increment_coupon_uses` now calls the new `decrement_coupon_uses` RPC. Limited-use coupons no longer waste a slot on failed inserts, RPC errors, missing user records, or unauthenticated sessions.

Bonus: orphaned-order cleanup when `order_items` insert fails on the guest path (the order row is now deleted to keep the orders table consistent).

### H5 — `vercel.json` security headers were minimal
**Files:**
- [vercel.json](vercel.json)

**Fix:**
- Removed deprecated `X-XSS-Protection`.
- Added `Strict-Transport-Security` (2-year preload).
- Added `Permissions-Policy` denying camera/mic/geolocation/payment/FLoC.
- Added a `Content-Security-Policy` allowing Supabase, Cloudinary, and Google accounts (for OAuth) while denying framing and inline objects. `script-src 'unsafe-inline'` is retained for Next.js bootstrap; tighten with a nonce when feasible.

---

## 🟠 Medium-severity fixes

### M1 — Sequential order codes leaked daily volume
**Files:**
- [supabase/migration_security_fixes.sql:77-90](supabase/migration_security_fixes.sql#L77)

**Fix:** `generate_order_code` now appends a 4-character hex suffix: `KH-1234-9F2A`. The sequence is still used (sort-friendly), but volume can no longer be estimated by subtracting two codes.

### M2 — Homepage and settings reader used service-role key for public reads
**Files:**
- [lib/supabase-server.ts:6-18](lib/supabase-server.ts#L6) — new `createPublicClient()`
- [lib/settings.ts:2, 38](lib/settings.ts#L2)
- [app/(customer)/(with-footer)/page.tsx:1, 27-28](app/(customer)/(with-footer)/page.tsx#L1)

**Fix:** Added an anon-key, cookie-less client and used it everywhere the work is strictly public reads. Service-role usage is now scoped to writes and RLS-bypassing reads, reducing blast radius.

### M3 — `guest_token` was stored in `sessionStorage`, lost on tab close
**Files:**
- [lib/guest-token.ts](lib/guest-token.ts) — new helpers (`getGuestToken`, `ensureGuestToken`)
- [components/ui/GuestTokenInit.tsx](components/ui/GuestTokenInit.tsx)
- [components/profile/GoogleSignInButton.tsx](components/profile/GoogleSignInButton.tsx)
- [components/profile/GuestOrders.tsx](components/profile/GuestOrders.tsx)
- [app/(customer)/checkout/CheckoutForm.tsx](app/(customer)/checkout/CheckoutForm.tsx#L11)
- [app/(customer)/(with-footer)/order-confirm/page.tsx](app/(customer)/(with-footer)/order-confirm/page.tsx)

**Fix:** Token is now persisted in `localStorage` (key `khaldoun_guest_token`). The helper auto-migrates from the legacy `sessionStorage` key so users mid-flow during the deploy don't lose their order history. UUID format is validated on every read.

### M4 — Rate limiting missing on three public endpoints
**Files:**
- [lib/rate-limit.ts](lib/rate-limit.ts) — shared helper
- [app/api/orders/route.ts:21-27](app/api/orders/route.ts#L21)
- [app/api/offers/validate-coupon/route.ts:6-12](app/api/offers/validate-coupon/route.ts#L6)
- [app/api/orders/guest/route.ts:9-14](app/api/orders/guest/route.ts#L9) (30 / minute)
- [app/api/orders/[orderId]/whatsapp-opened/route.ts:21-26](app/api/orders/[orderId]/whatsapp-opened/route.ts#L21) (30 / minute)
- [app/api/products/prices/route.ts:14-19](app/api/products/prices/route.ts#L14) (60 / minute)

**Fix:** All five route handlers now share a single `rateLimit()` helper that fails open when KV is unconfigured (so local development still works). Per-route keys avoid one endpoint's traffic eating another's budget.

### M5 — Cloudinary assets were never destroyed on row delete
**Files:**
- [app/admin/menu/actions.ts:54-75, 124-134, 159-167](app/admin/menu/actions.ts#L54)
- [app/admin/offers/actions.ts:57-78, 158-167](app/admin/offers/actions.ts#L57)

**Fix:** Added `destroyCloudinaryAsset()` to both admin action files; `deleteProduct`, `deleteCategory`, and `deleteOffer` now invoke it (best-effort — failure to destroy the asset does not roll back the DB delete, but is logged).

### M8 — `next-env.d.ts` was in `.gitignore`
**Files:**
- [.gitignore:35-38](.gitignore#L35)

**Fix:** Replaced the ignore rule with a comment explaining why it should be committed. After running this PR, commit the file so fresh clones type-check before the first `next dev`.

---

## 🟡 Low-severity fixes

### L1 — `decodeURIComponent` round-trip on the guest_token cookie
**Files:**
- [components/profile/GoogleSignInButton.tsx:21](components/profile/GoogleSignInButton.tsx#L21)
- [app/api/auth/callback/route.ts:21-35](app/api/auth/callback/route.ts#L21)

**Fix:** UUIDs contain no percent-encodable characters, so both the encode (on write) and decode (on read) were dead code. The callback now validates the cookie value as a UUID and uses it verbatim.

### L5 — Customer-supplied text was rendered into WhatsApp messages without sanitization
**Files:**
- [lib/sanitize.ts](lib/sanitize.ts) — new helper
- [lib/whatsapp.ts:2, 34-50, 73](lib/whatsapp.ts#L2)
- [app/api/orders/route.ts:103-108](app/api/orders/route.ts#L103)

**Fix:** A `stripUnsafeChars()` helper removes C0/C1 control characters and bidi-override characters. Applied:
- Server-side, just before persisting `customer_name`, `delivery_address`, and `notes`.
- Client-side, when formatting the outgoing WhatsApp message (defensive — covers any existing rows).

### L7 — `OrderConfig` was deserialized from `sessionStorage` without validation
**Files:**
- [app/(customer)/checkout/CheckoutForm.tsx:114-138](app/(customer)/checkout/CheckoutForm.tsx#L114)

**Fix:** The deserialized object is now shape-validated before being applied. Server-side recomputation already ignored the client's `deliveryFee`, so this hardens the UI only — but prevents runtime crashes on tampered storage.

### L8 — Cart `persist` had no version/migrate
**Files:**
- [stores/cart.ts:104-126](stores/cart.ts#L104)

**Fix:** Added `version: 2` and a `migrate` that drops items whose shape doesn't match the current `CartItem`. **This invalidates all currently-persisted carts on first load after deploy.** That's deliberate — old carts may contain stale offer prices and we'd rather start clean than crash.

---

## 📁 New files

| File | Purpose |
|------|---------|
| [supabase/migration_security_fixes.sql](supabase/migration_security_fixes.sql) | RLS column grants, search_path pinning, decrement RPC, order-code obfuscation |
| [lib/rate-limit.ts](lib/rate-limit.ts) | Shared IP rate-limiter (Vercel KV, fail-open) |
| [lib/sanitize.ts](lib/sanitize.ts) | `stripUnsafeChars` — strips control + bidi chars |
| [lib/guest-token.ts](lib/guest-token.ts) | `localStorage` guest token helpers with legacy migration |
| [PRODUCTION_FIXES.md](PRODUCTION_FIXES.md) | This document |

## ✏️ Modified files

- `vercel.json` — CSP, HSTS, Permissions-Policy
- `.gitignore` — stop ignoring `next-env.d.ts`
- `lib/supabase-server.ts` — `createPublicClient()`
- `lib/settings.ts` — uses public client
- `lib/whatsapp.ts` — sanitizes user input on render
- `stores/cart.ts` — versioned persist + migrate
- `app/(customer)/(with-footer)/page.tsx` — public client
- `app/(customer)/checkout/CheckoutForm.tsx` — guest-token helper, validated config parse
- `app/(customer)/(with-footer)/order-confirm/page.tsx` — guest-token helper
- `app/api/orders/route.ts` — points cap, coupon rollback, sanitization, shared rate limit
- `app/api/orders/guest/route.ts` — rate limit
- `app/api/orders/[orderId]/whatsapp-opened/route.ts` — rate limit, stricter token validation
- `app/api/products/prices/route.ts` — rate limit, parallel queries
- `app/api/offers/validate-coupon/route.ts` — shared rate limit helper
- `app/api/auth/callback/route.ts` — UUID validation, no more decode round-trip
- `app/admin/menu/actions.ts` — Cloudinary destroy on delete
- `app/admin/offers/actions.ts` — Cloudinary destroy on delete
- `components/ui/GuestTokenInit.tsx` — uses helper
- `components/profile/GoogleSignInButton.tsx` — uses helper, no encode round-trip
- `components/profile/GuestOrders.tsx` — uses helper

---

## 🟢 Items reviewed and intentionally deferred

These appeared in the original review but were judged out of scope for this round; they're tracked as backlog items:

| ID | Why deferred |
|----|--------------|
| **M6** — `requireAdmin()` throws vs redirects | Working as designed; UX polish only. Changing semantics could affect every admin action's error handling. |
| **M7** — RLS policy optimization for `users` | Current policy is correct; the suggested index already exists implicitly via `UNIQUE auth_id`. |
| **L2** — Refactor `/api/orders/route.ts` into modules | Behavior-preserving refactor; should ship behind its own PR with tests. |
| **L3** — Validate `parseInt` results in admin actions | Cosmetic — admin-only inputs from trusted form. |
| **L6** — Sniff image magic bytes server-side | Cloudinary already rejects non-images on upload. |
| **L9** — Hydration mismatch in `Header.tsx` | No observed bug; speculative. |
| **L10** — Rename `logo khaldon-02.png` | Asset rename risks broken references in production blobs. |
| **L11** — Test suite | Real-but-large gap. Recommend a dedicated PR seeding `vitest` for `lib/points.ts`, `lib/whatsapp.ts`, and `lib/sanitize.ts`. |
| **L12** — `tsconfig.tsbuildinfo` on disk | Not tracked by git (`.gitignore` covers `*.tsbuildinfo`). Safe to leave. |

---

## ✅ Verification

```text
$ npx tsc --noEmit
(no output — type-check passes)
```

After running the SQL migration and regenerating `types/database.ts`, you can also drop the temporary `rpc` cast in `app/api/orders/route.ts` (search for "cast until DB types are regenerated").

---

## Suggested next steps (post-merge)

1. **Add an integration test** for the orders endpoint covering: (a) points cap enforcement, (b) coupon rollback on RPC failure, (c) max items cap.
2. **Set up Sentry / Vercel monitoring** with breadcrumbs around the rate-limit short-circuit so you can detect abuse spikes.
3. **Audit `script-src 'unsafe-inline'`** in CSP; Next.js supports nonce-based CSP via `headers()` middleware.
4. **Backfill** `KH-####` codes? Decide whether to leave legacy short codes or run a one-time update to add suffixes (recommend: leave; old orders are already delivered).
