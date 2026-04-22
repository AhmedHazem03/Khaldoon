<!--
SYNC IMPACT REPORT
==================
Version change: [unversioned] → 1.0.0
Added sections:
  - Core Principles (I–V, all new)
  - Technical Constraints
  - Development Workflow & Quality Gates
  - Governance
Modified principles: N/A (initial ratification)
Removed sections: N/A
Templates requiring updates:
  ✅ .specify/templates/constitution-template.md — source template (read-only reference)
  ⚠ .specify/templates/plan-template.md — verify "Constitution Check" references align with principles I–V
  ⚠ .specify/templates/spec-template.md — verify scope/requirements sections reference snapshot immutability (IV) and DB layer (III)
  ⚠ .specify/templates/tasks-template.md — ensure task categories cover security gate (I), RTL/UI (II), DB trigger tasks (III)
  ⚠ .specify/templates/commands/*.md — remove any CLAUDE-only agent references; use generic "agent" language
Deferred TODOs: None — all placeholders resolved.
-->

# مطعم خلدون (Khaldoun Restaurant) Constitution

## Core Principles

### I. Security-First (NON-NEGOTIABLE)

`SUPABASE_SERVICE_ROLE_KEY` MUST only be used in server-side contexts (Server Actions,
Route Handlers, Supabase Admin clients). It MUST NEVER appear in any `NEXT_PUBLIC_`
environment variable or be exposed to the browser under any circumstances.

All mutations to `points_balance` MUST go exclusively through database-level Triggers
or RPCs (e.g., `create_order_with_points`, `handle_order_status_change`). Application
code MUST NOT issue a direct `UPDATE users SET points_balance = ...` query from the
client or server layer.

Admin role MUST be granted solely via `app_metadata: { role: "admin" }` in Supabase
Auth. Row Level Security policies MUST check `auth.jwt() -> 'app_metadata' ->> 'role'`.
Admin status MUST NOT be stored in `public.users` or derived from any user-editable field.

Guest order merge (associating a past guest order with a newly registered account) MUST
use the session token stored at order-creation time only. Phone number match alone MUST
NOT trigger a merge — this prevents account takeover via phone number spoofing.

**Rationale:** A single misconfigured environment variable or a direct `UPDATE
points_balance` call from app code could lead to privilege escalation, fraudulent points
accrual, or data breaches. The DB layer is the single enforcement boundary.

### II. Mobile-First Arabic UI

All pages and components MUST render in RTL layout. The root `<html>` element MUST carry
`dir="rtl"` and `lang="ar"`. Tailwind v4's built-in RTL support MUST be used; no custom
`[dir=rtl]` overrides unless strictly necessary.

Every interactive touch target (button, link, input) MUST have a minimum size of 44 × 44 px.

Navigation drawers and contextual menus MUST use a **Bottom Sheet** pattern on mobile,
not a side drawer, to match Arabic-market UX expectations and one-handed usability.

The primary typeface MUST be **Cairo** or **Tajawal** (Google Fonts, Arabic-optimised).
No Latin-primary font (e.g. Inter, Roboto) may be used as the default body font.

**Rationale:** The entire customer base reads Arabic. RTL is not an afterthought — it is
the default rendering contract. Bottom Sheet is the dominant mobile pattern for this
market segment. Tailwind v4's built-in RTL removes the need for a third-party plugin.

### III. Data Integrity via DB Layer

All business logic that modifies financial or loyalty data MUST live at the database
level as Triggers or RPCs. This includes:
- Points accrual and deduction (`handle_order_status_change` trigger)
- Atomic order creation with points redemption (`create_order_with_points` RPC)
- `order_code` generation (`generate_order_code` trigger, prefix `KH-`)
- Order status transition side effects (point reversal on cancellation)

Application code MUST NOT duplicate this logic. A Server Action that changes order
status MUST only call `UPDATE orders SET status = ...`; the trigger handles the rest.

**Rationale:** Duplicating business logic in both app code and DB creates drift and
race conditions. The DB trigger model is the single source of truth, testable in
isolation, and immune to app-layer bypasses.

### IV. Snapshot Immutability

Every row inserted into `order_items` MUST store `product_name`, `variant_name`, and
`unit_price` as snapshot values captured at the moment of order placement. These values
MUST NOT be updated after insertion, regardless of subsequent admin changes to the
product catalogue.

References from `order_items` to `products` and `product_variants` use `ON DELETE SET
NULL` — if a product is deleted, the foreign key becomes NULL but the snapshot fields
remain intact and fully readable.

Admin edits to product names or prices MUST only affect future orders. Retroactive
price corrections to past `order_items` are PROHIBITED.

**Rationale:** Financial and operational integrity of historical orders is non-negotiable.
Customers and admins must be able to audit any past order exactly as it was placed.

### V. Dynamic Settings without Redeployment

All operator-configurable values MUST be stored in the `settings` table as key-value
pairs. This includes (but is not limited to):
- WhatsApp numbers
- Social media links (Facebook, Instagram, TikTok)
- Points rules (`points_per_100_egp`, `max_points_redemption_pct`)
- Delivery fee overrides
- Announcement banners

Caching MUST use `unstable_cache` from `'next/cache'` with `tags: ['settings']`, combined
with `revalidateTag('settings')` on every admin save. `React cache()` from `'react'` provides
per-request memoization only and MUST NOT be used as a cross-request cache for settings.
Settings MUST NEVER be hardcoded in source files, environment variables, or component
props.

**Exemption — Deployment-time display constants:** A value qualifies for exemption from
Principle V if and only if **all three** of the following are true:
1. It is set once per deployment and never changes at runtime without a new deploy.
2. It is not operator-configurable from the admin panel (i.e., the restaurant owner
   is not expected to change it independently of a developer).
3. It carries no financial, security, or ordering logic.

`NEXT_PUBLIC_RESTAURANT_NAME` satisfies all three criteria and is therefore permitted
as a `NEXT_PUBLIC_` environment variable. If the restaurant name ever needs to be
runtime-configurable without a deploy, it MUST be migrated to the `settings` table.
No other values are presumptively exempt — each must be evaluated case by case.

**Rationale:** The restaurant operator must be able to change any configurable value
from the admin panel and see it live without a developer deploying new code.

## Technical Constraints

- **Framework:** Next.js 15 (App Router + Turbopack) with TypeScript 5.x
- **Styling:** Tailwind CSS v4 — RTL built-in, no separate RTL plugin required
- **Backend & Auth:** Supabase (PostgreSQL + Storage + Auth)
- **Auth strategy:** Email Auth using synthetic address `{phone}@khaldoun.local`;
  no OTP, no SMS provider, no password reset flow (user contacts restaurant manually)
- **State management:** Zustand v5; cart persisted to `localStorage` under key
  `khaldoun-cart`
- **Forms & validation:** React Hook Form + Zod
- **Hosting:** Vercel
- **WhatsApp integration:** `wa.me` deep-link only — no third-party API, no API key
- **Payment:** Cash on delivery only — no payment gateway of any kind
- **Language:** Arabic only (RTL); no i18n framework needed
- **Admin pagination:** Cursor-based only, 25 records per page;
  offset-based pagination is PROHIBITED in admin list views
- **Guest orders:** `user_id = NULL` in `orders`; no `public.users` record is created
  for guests; guest identity is `customer_name` + `customer_phone` snapshot only

## Development Workflow & Quality Gates

Before any PR or spec is considered complete, the following checks MUST pass:

1. **Security gate:** Confirm `SUPABASE_SERVICE_ROLE_KEY` does not appear in any
   `NEXT_PUBLIC_` variable or client bundle (`next build --debug` bundle analysis).
2. **Points gate:** Any code touching `points_balance` MUST route through the DB layer.
   Direct `UPDATE users SET points_balance` in application code is a blocking violation.
3. **RTL gate:** All new UI components MUST be reviewed in an RTL viewport (≥ 375 px
   wide). Tailwind classes MUST use logical properties (`ms-`, `me-`, `ps-`, `pe-`)
   where applicable.
4. **Snapshot gate:** Any new order-creation path MUST insert `product_name` and
   `unit_price` into `order_items` at the time of insertion. Deferred population is
   PROHIBITED.
5. **Settings gate:** Any value that an operator may need to change without a deployment
   MUST be confirmed to exist in the `settings` table before the feature is merged.

## Governance

This constitution supersedes all other project guidelines. Any conflict between a spec,
task, or implementation decision and this constitution MUST be resolved in favour of the
constitution.

**Amendment procedure:**
- MAJOR bump (breaking): removal or redefinition of an existing principle. Requires
  explicit written justification and migration plan.
- MINOR bump: new principle or material expansion of an existing one.
- PATCH bump: wording clarifications, typo fixes, non-semantic refinements.

**Compliance review:** Every spec document MUST include a "Constitution Check" section
confirming alignment with principles I–V before work begins.

**Enforcement rules (non-exhaustive):**
- `SUPABASE_SERVICE_ROLE_KEY` MUST NEVER appear in `NEXT_PUBLIC_` env vars.
- All changes to `points_balance` MUST go through the DB layer only.
- Guest order merge MUST use session token only — phone number match alone is
  insufficient and MUST be rejected.
- Cursor-based pagination (25/page) MUST be used in all admin list views.
- The `settings` table MUST be the sole source of all operator-configurable values.

**Version**: 1.0.1 | **Ratified**: 2026-04-21 | **Last Amended**: 2026-04-22
<!-- PATCH 1.0.1: Added exemption clause to Principle V for deployment-time display constants (NEXT_PUBLIC_RESTAURANT_NAME). -->
