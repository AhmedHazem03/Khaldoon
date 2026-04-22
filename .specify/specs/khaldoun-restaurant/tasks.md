# Tasks: موقع مطعم خلدون — الموقع الكامل للطلبات الإلكترونية

**Feature Branch**: `001-khaldoun-restaurant`
**Generated**: 2026-04-21
**Input**: plan.md + spec.md + constitution.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: [US1] Guest Order · [US2] Auth+Points · [US3] Admin · [US4] Homepage · [SHARED]
- Tests: not requested — excluded per spec

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, database schema, and all shared infrastructure. No user story work begins until this phase is complete.

**⚠️ CRITICAL**: All Phase 2–5 work depends on this phase being fully complete.

- [x] T001 [SHARED] Initialize Next.js 15 project with TypeScript, App Router, and Turbopack at repo root: `npx create-next-app@latest . --typescript --app --turbopack`
- [x] T002 [SHARED] Install and configure Tailwind CSS v4 with RTL support, Cairo/Tajawal Google Fonts, and brand colors (`--primary: #1E2A4A`, `--accent: #F26522`, `--background: #FDF5EC`) in `app/globals.css` and `tailwind.config.ts`
- [x] T003 [P] [SHARED] Set `dir="rtl"` and `lang="ar"` on the root `<html>` element in `app/layout.tsx`; import Cairo/Tajawal fonts from `next/font/google`
- [x] T004 [P] [SHARED] Install dependencies: `@supabase/supabase-js @supabase/ssr zustand react-hook-form zod lucide-react @vercel/kv`
- [x] T005 [SHARED] Create Supabase project and add environment variables to `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only, never `NEXT_PUBLIC_`), `NEXT_PUBLIC_RESTAURANT_NAME`
  > ⚠️ WhatsApp number is stored in `settings.whatsapp_order_number` (DB) — NEVER in env vars per Constitution Principle V.
  > ℹ️ `NEXT_PUBLIC_RESTAURANT_NAME` is a deployment-time constant (not operator-editable at runtime) — it is exempt from Constitution V. If the restaurant name ever needs to be runtime-configurable, move it to the `settings` table instead.
- [x] T006 [SHARED] Create all database tables in Supabase SQL editor — `categories`, `products`, `product_variants`, `users`, `orders`, `order_items`, `delivery_zones`, `point_transactions`, `offers`, `settings` — using exact schema from `data-model.md` including all column types, DEFAULT values, CHECK constraints (`chk_zone_required`, `chk_status`, `chk_order_item_subtotal`), and `ON DELETE` rules
- [x] T007 [SHARED] Create `order_code_seq` sequence and `generate_order_code` trigger (prefix `KH-`, starts at 1000) on `orders` table — SQL from `data-model.md` Trigger 2
- [x] T008 [SHARED] Create `handle_new_user` trigger function and `on_auth_user_created` trigger on `auth.users` — auto-populates `public.users` with `auth_id`, `phone_number` (from `raw_user_meta_data`), `name` on every new Supabase Auth signup
- [x] T009 [SHARED] Create `handle_order_status_change` trigger function and `on_order_status_change` BEFORE UPDATE trigger on `orders.status` — handles: points accrual on `confirmed`, points reversal on `cancelled` (transaction_type `'reversed'`), `points_used` refund on cancellation (transaction_type `'refunded'`) — full SQL from `data-model.md` Trigger 3
- [x] T010 [SHARED] Create `create_order_with_points` RPC function with `FOR UPDATE` row lock on `users` to prevent race conditions — handles atomic order insert + `order_items` loop + points deduction + `point_transactions` insert — full SQL from `data-model.md` RPC section; also create `admin_adjust_points` RPC (SQL from `data-model.md` RPC: admin_adjust_points)
- [x] T011 [SHARED] Create all database indexes: `idx_orders_customer_phone`, `idx_orders_created_at`, `idx_orders_status`, `idx_orders_order_code`, `idx_users_phone_number`, `idx_order_items_order_id`, `idx_point_tx_user_id`, `idx_orders_created_status`, `idx_order_items_product`, `idx_products_category_avail`, `idx_orders_guest_token` (partial index WHERE guest_token IS NOT NULL) — SQL from `data-model.md` Indexes section (11 total)
- [x] T012 [SHARED] Enable Row Level Security on all tables and create all RLS policies from `data-model.md`: public read for `products`, `categories`, `product_variants`, `offers`, `delivery_zones`, `settings`; user-scoped read/update for `orders`, `point_transactions`, `users`; admin full access (checked via `auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'`) for all tables
- [x] T013 [P] [SHARED] Create Supabase Storage bucket `menu-images` with public read access, 1MB file size limit, and allowed types JPG/PNG/WebP
- [x] T014 [SHARED] Create TypeScript type files: `types/database.ts` (Supabase generated types — run `supabase gen types typescript`) and `types/app.ts` (application types: `Category`, `Product`, `ProductVariant`, `CartItem`, `Order`, `OrderItem`, `DeliveryZone`, `PointTransaction`, `Offer`, `User`, `Setting`) — exact shapes from `data-model.md`
- [x] T015 [SHARED] Create `lib/supabase.ts` exporting: `createBrowserClient()` (anon key, for client components) and `createServerClient()` (service role key, for Server Actions and Route Handlers only) using `@supabase/ssr`
- [x] T016 [SHARED] Create `lib/settings.ts` — fetch all settings rows from Supabase, cache with `unstable_cache` from `'next/cache'` (with `keys: ['settings']` and `tags: ['settings']`) for cross-request caching with `revalidateTag` support; call `revalidateTag('settings')` after every admin save to invalidate immediately
- [x] T017 [SHARED] Create `stores/cart.ts` — Zustand v5 store with `persist` middleware (`name: 'khaldoun-cart'`, storage: `localStorage`) containing: `items: CartItem[]`, `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `totalItems`, `subtotal` selectors
- [x] T018 [SHARED] Create `middleware.ts` at repo root — reads Supabase JWT from cookie, checks `app_metadata.role === 'admin'`, redirects non-admin requests to `/login` for all `/admin/*` routes; allows all other routes through
- [x] T019 [P] [SHARED] Seed `settings` table with all initial keys from `data-model.md` settings table: `whatsapp_order_number`, `whatsapp_social_url`, `facebook_url`, `instagram_url`, `tiktok_url`, `phone_1`, `phone_2`, `phone_3`, `restaurant_address`, `delivery_enabled`, `pickup_enabled`, `points_per_100_egp` (default: 1), `point_value_egp` (default: 0.5), `max_points_discount_pct` (default: 20), `stat_customers`, `stat_years`, `working_hours`, `is_ordering_open` (default: true)
- [x] T020 [P] [SHARED] Add `guest_token text` column to `orders` table — UUID stored in `sessionStorage` at first visit, saved with each guest order for secure guest-to-registered merge
- [x] T039 [P] [SHARED] Add `guest_token` generation to app initialization — generate UUID in `sessionStorage` on first visit (client component or layout effect); ensure it persists for the entire browser session and is included in all guest order saves (T034)
  > ℹ️ Note: This task is numbered T039 (Phase 3 range) but belongs to Phase 1 — it was added after initial task generation. Treat it as Phase 1 work alongside T001–T020.

**Checkpoint**: Database, auth, storage, types, lib, store, and middleware are all ready — user story implementation can now begin in parallel.

---

## Phase 2: US1 — تصفح المنيو وتقديم الطلب كزائر (Priority: P1) 🎯 MVP

**Goal**: A guest can browse the menu by category, select items with variants, review their cart, fill checkout form, save the order to Supabase (KH-XXXX), and send it via WhatsApp — all without logging in.

**Independent Test**: Visit site without an account → select one item → complete checkout as guest → verify order appears in Supabase `orders` table with `user_id = NULL` and correct `order_code` → verify WhatsApp link opens with formatted message.

- [x] T021 [P] [US1] Create `components/layout/Header.tsx` — mobile-first: sticky (`position: sticky; top: 0; z-index: 50`), shows logo + cart icon badge (item count from Zustand) only on mobile; no phone numbers or social icons in header (moved to footer per plan.md §8)
- [x] T022 [P] [US1] Create `components/layout/Footer.tsx` — social media icons (WhatsApp, Facebook, Instagram, TikTok) with links from `settings`, phone numbers (`phone_1`, `phone_2`, `phone_3`), restaurant address; extract icon row as `components/ui/SocialLinks.tsx` reusable sub-component
- [x] T023 [US1] Create `components/ui/FloatingWhatsapp.tsx` — fixed bottom-right WhatsApp button linking to `settings.whatsapp_social_url`; uses `usePathname()` inside `'use client'` to hide on `/cart` and `/checkout` (prevents hydration mismatch in App Router)
- [x] T024 [US1] Create `components/menu/CategoryTabs.tsx` — horizontal scroll with `overflow-x-auto scrollbar-hide snap-x`, `snap-start` buttons, `min-h-[44px]`, active tab highlighted with `bg-accent text-white`, inactive with border; auto-scrolls active tab into view with `scrollIntoView({ inline: 'center', behavior: 'smooth' })`
- [x] T025 [US1] Create `components/menu/VariantSelector.tsx` — segment buttons (NOT a dropdown), `flex gap-2 flex-wrap`, `min-h-[44px]` per button, selected variant highlighted with `bg-accent text-white border-accent`; dynamic price display updates on selection with `text-accent font-bold text-xl`
- [x] T026 [US1] Create `components/menu/ProductCard.tsx` — displays: product image (Supabase Transform `?width=400&quality=75`), name, price or variant price, `description` split as "يشمل" chips (`bg-orange-50 text-orange-700 rounded-full px-2 py-0.5`); CTA button logic: `cta_type === 'add_to_cart'` → "أضف للطلب" → opens VariantSelector if variants exist; `cta_type === 'whatsapp_inquiry'` → "تواصل للاستفسار" → opens WhatsApp
- [x] T027 [US1] Create `components/cart/CartItem.tsx` — shows product name, variant name, unit price, quantity with +/− controls (`min-h-[44px]`), subtotal, and remove button
- [x] T028 [US1] Create `components/cart/CartDrawer.tsx` — Bottom Sheet pattern on mobile: slides up from bottom, `max-h-[85vh] overflow-y-auto`, drag handle at top, backdrop overlay that dismisses on click; contains list of `CartItem` components and link to `/cart`
- [x] T029 [US1] Create `app/cart/page.tsx` — displays all cart items with quantity editing, order type selector (delivery/pickup), delivery zone dropdown (shows fee per zone from `delivery_zones` table, adds fee to total), subtotal + delivery fee + total calculation, `pb-24` spacer for Sticky Bottom Bar
- [x] T030 [US1] Create `components/checkout/WhatsappButton.tsx` — calls `lib/whatsapp.ts` to generate message, sets `whatsapp_opened = true` on order via `PATCH /api/orders/[orderId]/whatsapp-opened` (Route Handler in `app/api/orders/[orderId]/whatsapp-opened/route.ts`), opens `wa.me/{whatsapp_order_number}?text={encodedMessage}`, then navigates to `/order-confirm`
- [x] T031 [US1] Create `lib/whatsapp.ts` — `generateWhatsAppMessage(order, items, settings): string` builds the full formatted Arabic message (format: order code → items+variants+prices → subtotal → delivery → points discount → total → points earned); `buildWhatsAppURL(phone, message): string` encodes message and checks total URL length after `encodeURIComponent`; if length exceeds 2048 chars, truncates item list and appends `"للتفاصيل: رقم الطلب {order_code}"`
- [x] T032 [US1] Create `app/checkout/page.tsx` — guest checkout form with React Hook Form + Zod: name (required), phone (validated with `/^01[0125][0-9]{8}$/`), address (required for delivery), delivery zone selector (required for delivery, triggers fee calculation), notes (optional); stale price check on mount: re-fetch current prices via `GET /api/products/prices?ids=...` (`app/api/products/prices/route.ts`) and show warning toast if any cart item price changed; include `components/checkout/OrderSummary.tsx` sub-component (subtotal + delivery fee + points discount + total)
- [x] T033 [US1] Create Sticky Bottom Bar in `app/checkout/page.tsx` — `fixed bottom-0 inset-x-0 z-40`, shows order total and "إتمام الطلب عبر واتساب" button (`min-h-[52px]`); `pb-24` spacer below page content
- [x] T034 [US1] Implement guest order save — create `app/api/orders/route.ts` Route Handler (`POST /api/orders`): saves to `orders` (with `user_id = NULL`, `guest_token` from request body) + `order_items` snapshot (product_name, variant_name, unit_price); for guest orders uses direct Supabase insert (not RPC); uses `SUPABASE_SERVICE_ROLE_KEY` in server context only
- [x] T035 [US1] Create `app/order-confirm/page.tsx` — "هل ضغطت على إرسال في الواتساب؟" confirmation page with two buttons: "نعم، أرسلت" (marks order complete, redirects to `/`) and "أعد فتح الواتساب" (reopens WhatsApp link)
- [x] T036 [US1] Create `app/menu/page.tsx` — Server Component that fetches categories + products + variants from Supabase; renders `CategoryTabs` + product grid; passes data to client components; respects `is_available` and `is_visible` filters via RLS

**Checkpoint**: Full guest order flow — browse → add to cart → checkout → WhatsApp → order saved — is independently testable.

---

## Phase 3: US2 — العميل المسجّل يطلب مع نقاط (Priority: P2)

**Goal**: Registered users can log in with phone+password (Email Auth with `{phone}@khaldoun.local`), autofill checkout, use a points slider (max 20% of subtotal), track points balance and order history in `/profile`, and cancel pending orders within 5 minutes.

**Independent Test**: Create account → place order with points discount → verify points deducted immediately → admin changes status to "confirmed" → verify points_earned added to balance via trigger → check `/profile` shows correct transaction history.

- [x] T037 [P] [US2] Create `app/login/page.tsx` — phone + password form; on submit: calls Supabase `signInWithPassword({ email: phone + '@khaldoun.local', password })`; "تسجيل حساب جديد" flow calls `signUp` with `raw_user_meta_data: { phone_number, name }` (no OTP, no SMS, immediate); after login: check `sessionStorage` for `guest_token` and trigger guest order merge
- [x] T038 [US2] Implement guest-to-registered order merge in `app/login/page.tsx` — after successful signup: read `guest_token` from `sessionStorage`; call Server Action that runs `UPDATE orders SET user_id = newUserId WHERE guest_token = $token AND user_id IS NULL`; uses `SUPABASE_SERVICE_ROLE_KEY`; merge is by session token ONLY — never by phone number match alone
- [x] T040 [US2] Update `app/checkout/page.tsx` for registered users — autofill name, phone, and `default_address` from user profile; show "استخدم بيانات حسابي" button to confirm autofill; display current points balance and expected earned points for this order
- [x] T041 [US2] Create `components/checkout/PointsSlider.tsx` — range input with step = `point_value_egp`; `maxDiscount = Math.floor(Math.min(balance * pointValue, subtotal * maxPct / 100) / pointValue) * pointValue` (ensures integer multiples of point value); [−] and [+] buttons (`w-11 h-11 rounded-full`) for fine-grained mobile control; displays `Math.round(discount / pointValue)` points = `discount` ج; updates order total in real time
- [x] T042 [US2] Update order save flow in `app/checkout/page.tsx` for registered users — call `create_order_with_points` RPC (not direct insert) with `p_user_id`, `p_points_to_use`, subtotal, delivery_fee, discount, total, order_data JSON, items JSON array; RPC handles atomic points deduction + order insert + order_items insert
- [x] T043 [P] [US2] Create `lib/points.ts` — helper functions: `calcMaxDiscount(balance, pointValue, subtotal, maxPct): number`, `calcPointsEarned(subtotal, pointsPer100): number`, `pointsToEgp(points, pointValue): number`, `egpToPoints(egp, pointValue): number`
- [x] T044 [US2] Create `app/profile/page.tsx` — Server Component: fetches current user's `points_balance`, `point_transactions` (type + date + points, newest first), and `orders` (order_code, status, total_price, created_at, newest first); renders points balance card, transactions table, and orders list
- [x] T045 [US2] Add cancel order button to `app/profile/page.tsx` — show cancel button only when `order.status === 'pending'` AND `new Date() - new Date(order.created_at) < 5 * 60 * 1000`; Server Action sets `status = 'cancelled'`; trigger automatically refunds `points_used` back to balance

**Checkpoint**: Registered user login → autofill checkout → points slider → order saved via RPC → points deducted → profile shows history → cancel within 5 min — all independently testable.

---

## Phase 4: US3 — الأدمن يُدير المطعم (Priority: P3)

**Goal**: Admin can log in (Supabase `app_metadata.role = 'admin'`), view order dashboard stats, manage orders with status changes (triggering automatic points logic), manage menu/offers/zones/customers/settings — all protected by `middleware.ts`.

**Independent Test**: Log in with admin account → change a "pending" order to "confirmed" → verify customer's `points_balance` increased and `point_transactions` has new "earned" row → change an `is_ordering_open` setting → verify homepage reflects change.

- [x] T046 [P] [US3] Create `app/admin/page.tsx` — redirect to `/admin/dashboard`
- [x] T047 [US3] Create `app/admin/dashboard/page.tsx` — Server Component: queries `orders` for today/week/month counts and revenue totals; top 5 most-ordered products (JOIN `order_items`); new customer count; most popular delivery zones; renders `components/admin/StatsCards.tsx`
- [x] T048 [P] [US3] Create `components/admin/StatsCards.tsx` — grid of stat cards (today orders, week orders, month orders, total revenue, top items list)
- [x] T049 [US3] Create `app/admin/orders/page.tsx` — Server Component with cursor-based pagination (25/page, `created_at DESC`); search by `order_code`, `customer_phone`, `customer_name`; filter by `status`; renders `components/admin/OrdersTable.tsx`
- [x] T050 [P] [US3] Create `components/admin/OrdersTable.tsx` — table with columns: order_code, customer_name, customer_phone, order_type, zone, total_price, status (color-coded badge), created_at; status change dropdown with full 6-state flow: `pending → confirmed → preparing → out_for_delivery → delivered | cancelled`; Server Action for status update — only calls `UPDATE orders SET status = $new WHERE id = $id` (trigger handles points logic automatically)
- [x] T051 [US3] Create `app/admin/menu/page.tsx` — lists all categories and products; add/edit product form (name, category, description, base_price, cta_type, is_available, order_index); variant management per product (add/edit/delete variants with price); drag-and-drop reorder via `order_index` updates; image upload to Supabase Storage `menu-images` bucket (max 1MB, filename `{product_id}-{timestamp}.webp`)
- [x] T052 [P] [US3] Create `app/admin/offers/page.tsx` — list active/inactive offers (image, title, expires_at, order_index, is_active); add new offer form; toggle is_active; reorder by drag-and-drop; delete offer
- [x] T053 [P] [US3] Create `app/admin/zones/page.tsx` — list delivery zones with fee and is_active; add zone form (zone_name, fee); edit fee inline; toggle is_active
- [x] T054 [US3] Create `app/admin/customers/page.tsx` — list registered users (name, phone, points_balance, total orders); search by phone/name; renders `components/admin/PointsManager.tsx` per customer
- [x] T055 [P] [US3] Create `components/admin/PointsManager.tsx` — form: amount input + transaction type (`manual_add` / `manual_deduct`) + note textarea; on submit: Server Action calls Supabase RPC `admin_adjust_points(user_id, amount, type, note)` (defined in `data-model.md`, created in T010); NEVER uses direct `UPDATE users SET points_balance`
- [x] T056 [US3] Implement `adjustPoints` Server Action in `app/admin/customers/page.tsx` (extends T054) — validate `amount > 0` and `type` is `manual_add|manual_deduct` before calling `admin_adjust_points` RPC via `createServerClient()`; return success/error to `PointsManager` component; uses `SUPABASE_SERVICE_ROLE_KEY`
- [x] T057 [US3] Create `app/admin/settings/page.tsx` — form with all settings keys from `data-model.md` settings table (whatsapp numbers, social URLs, phone numbers, address, points rules, stat_customers, stat_years, working_hours, is_ordering_open); on save: upsert all changed keys to `settings` table then call `revalidateTag('settings')` to invalidate cached settings across the site

**Checkpoint**: Admin login → protected by middleware → full CRUD on orders/menu/offers/zones/customers/settings — independently testable.

---

## Phase 5: US4 — الصفحة الرئيسية والاكتشاف (Priority: P4)

**Goal**: First-time visitors see a professional homepage: Hero section, offers carousel, menu category cards, dynamic statistics (from `settings`), social links (from `settings`), and `is_ordering_open` guard.

**Independent Test**: Change `stat_customers` in admin settings → verify homepage shows updated value after `revalidateTag('settings')` → set `is_ordering_open = false` → verify "اطلب دلوقتي" button is hidden and "المطعم مغلق حالياً" message appears.

- [x] T058 [US4] Create `app/page.tsx` (Homepage) — Server Component: reads `settings` via `lib/settings.ts` (cached); reads active `offers` from Supabase; reads `categories` for menu cards; renders Hero + OffersCarousel + CategoryCards + StatsSection + (FloatingWhatsapp via client component)
- [x] T059 [P] [US4] Implement Hero section in `app/page.tsx` — full-width cover image, "أصل السوري هون" headline, restaurant tagline; "اطلب دلوقتي" CTA button linking to `/menu`; if `settings.is_ordering_open === 'false'` hide the CTA button and display "المطعم مغلق حالياً" message instead
- [x] T060 [P] [US4] Implement Offers carousel in `app/page.tsx` — horizontal auto-scroll carousel of active `offers` rows (image + title); shows only `is_active = true` rows ordered by `order_index`
- [x] T061 [P] [US4] Implement Menu category cards section in `app/page.tsx` — grid of category cards (icon + name) linking to `/menu` with active category pre-selected; fetched from `categories` table where `is_visible = true`
- [x] T062 [P] [US4] Implement Statistics section in `app/page.tsx` — displays `settings.stat_customers` and `settings.stat_years` as large prominent numbers; these are manual values set by admin, not `COUNT(*)` queries

**Checkpoint**: Homepage renders correctly with dynamic content from settings and offers tables — independently testable.

---

## Phase 6: Polish, Rate Limiting & Launch

**Purpose**: Cross-cutting concerns, security hardening, SEO, and production readiness.

- [x] T063 Add `<title>`, `<meta name="description">`, and Open Graph tags (`og:title`, `og:description`, `og:image`) to `app/layout.tsx` and key page-level `metadata` exports in `app/page.tsx` and `app/menu/page.tsx`
- [x] T064 Add rate limiting to `app/api/orders/route.ts` Route Handler (created in T034) using Vercel KV: max 10 requests/minute/IP; return HTTP 429 on limit exceeded; rate limit key: `rate:orders:{ip}`
- [x] T065 Audit environment variables — verify `SUPABASE_SERVICE_ROLE_KEY` does NOT appear in any `NEXT_PUBLIC_` variable, any client bundle, or any `'use client'` component; verify it is only imported in Server Actions and Route Handlers
- [x] T066 Mobile responsive audit — test all pages on **375px** viewport width (SC-009 minimum — iPhone SE baseline): CategoryTabs scroll, VariantSelector buttons, CartDrawer bottom sheet, PointsSlider with [+/−] buttons, Sticky Bottom Bar, admin tables (horizontal scroll)
- [x] T067 End-to-end test: guest order flow — open menu → add item with variant → open cart drawer → go to `/cart` → set delivery zone → go to `/checkout` → fill name/phone/address → submit → verify order in Supabase → verify WhatsApp URL format and message content; **manually time the full flow end-to-end and confirm it completes in under 3 minutes (SC-001)**
- [x] T068 End-to-end test: registered user + points flow — login → checkout with points slider at max allowed (20%) → submit via `create_order_with_points` RPC → verify points deducted → admin confirms order → verify points_earned added to balance → check `/profile` history; **also verify cancel flow: cancel a pending order within 5 min → confirm points_used refunded to balance (FR-017, FR-022)**
- [x] T069 WhatsApp message encoding test — create order with 10+ Arabic items → generate WhatsApp URL → verify `encodeURIComponent` output ≤ 2048 chars → if exceeded, verify truncation adds "للتفاصيل: رقم الطلب KH-XXXX"
- [x] T070 Egyptian phone validation test — verify regex `/^01[0125][0-9]{8}$/` rejects: 9-digit numbers, non-Egyptian prefixes (013, 016...), international format (+20...) — validated in `CheckoutForm` and `app/login/page.tsx`
- [x] T071 Admin panel end-to-end test — login with admin account → change order status pending→confirmed → verify trigger fires (points added) → add new menu product → verify it appears in `/menu` → save new WhatsApp number in settings → verify new orders use updated number
- [x] T072 Configure Vercel deployment — set all environment variables in Vercel dashboard (`SUPABASE_SERVICE_ROLE_KEY` as server-only secret, not exposed in client config); connect custom domain; verify `NEXT_PUBLIC_` vars are accessible client-side
- [x] T073 [P] Verify `is_ordering_open` behavior end-to-end — set `false` in admin settings → verify homepage hides "اطلب دلوقتي" → set `true` → verify button reappears after `revalidateTag('settings')` cycle

---

## Dependencies (Story Completion Order)

```
Phase 1 (SHARED Setup)
    ↓ (all phases depend on Phase 1)
Phase 2 (US1 — Guest Order) ← MVP, no other story dependencies
    ↓
Phase 3 (US2 — Auth + Points) ← depends on US1 order flow
    ↓
Phase 4 (US3 — Admin Panel) ← depends on US1+US2 for order/user data
Phase 5 (US4 — Homepage) ← depends on Phase 1 only (can run in parallel with US1)
    ↓
Phase 6 (Polish & Launch) ← depends on all stories complete
```

**US1 and US4 can be developed in parallel** after Phase 1 completes.
**US3 admin panel** can begin as soon as US1 produces some order data.

---

## Parallel Execution Examples

### Within Phase 2 (US1)
```
T021 Header     ─┐
T022 Footer     ─┤ (all independent components — different files)
T030 WA Button  ─┤
T031 whatsapp.ts─┘
    ↓
T024 CategoryTabs ─┐
T025 VariantSelector┤ (menu components — independent)
T026 ProductCard  ─┘
    ↓
T027 CartItem    ─┐
T028 CartDrawer  ─┘ (cart components — CartDrawer imports CartItem)
    ↓
T029 /cart page
T032 /checkout form
T034 save order (Server Action)
T035 /order-confirm
```

### Within Phase 4 (US3)
```
T048 StatsCards     ─┐
T050 OrdersTable    ─┤ (independent admin components)
T055 PointsManager  ─┘
    ↓
T047 /admin/dashboard (uses StatsCards)
T049 /admin/orders   (uses OrdersTable)
T051 /admin/menu
T052 /admin/offers   ─┐ (independent admin pages)
T053 /admin/zones    ─┤
T054 /admin/customers (uses PointsManager)
T057 /admin/settings ─┘
```

---

## Implementation Strategy

**MVP Scope (US1 only — Phase 1 + Phase 2)**:
Delivers a complete, working guest ordering system. The restaurant can receive orders via WhatsApp with Supabase archiving. This is the minimum viable product.

**Increment 2 (add US2 — Phase 3)**:
Adds registered accounts, points loyalty system, profile, and order history.

**Increment 3 (add US3 — Phase 4)**:
Adds full admin panel for managing orders, menu, offers, zones, customers, and settings.

**Increment 4 (add US4 — Phase 5)**:
Adds professional homepage with hero, offers carousel, and dynamic stats.

**Launch (Phase 6)**:
SEO, rate limiting, security audit, mobile testing, and Vercel deployment.

---

## Task Summary

| Phase | Story | Tasks | Parallel Tasks |
|-------|-------|-------|---------------|
| Phase 1: Setup | SHARED | T001–T020 + T039 (21 tasks) | T003, T004, T013, T019, T020, T039 |
| Phase 2: Guest Order | US1 (P1) | T021–T036 (16 tasks) | T021, T022, T023, T030, T031 |
| Phase 3: Auth + Points | US2 (P2) | T037–T038, T040–T045 (8 tasks) | T037, T043 |
| Phase 4: Admin Panel | US3 (P3) | T046–T057 (12 tasks) | T046, T048, T050, T052, T053, T055 |
| Phase 5: Homepage | US4 (P4) | T058–T062 (5 tasks) | T059, T060, T061, T062 |
| Phase 6: Polish | — | T063–T073 (11 tasks) | T065, T073 |
| **Total** | | **73 tasks** | **~20 parallel opportunities** |

**Suggested MVP**: Complete Phase 1 (T001–T020) + Phase 2 (T021–T036) = 36 tasks for a fully functional guest ordering system.
