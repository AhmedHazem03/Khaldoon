# API Contracts: موقع مطعم خلدون

**Phase**: Phase 1 — Design & Contracts
**Branch**: `001-khaldoun-restaurant`
**Date**: 2026-04-21

---

## Overview

This project exposes two categories of interfaces:

1. **HTTP Route Handlers** (`app/api/`) — REST endpoints for operations that need server-side rate limiting or service-role access outside of Server Actions.
2. **Supabase RPCs** — PostgreSQL functions called via `supabase.rpc()` for atomic operations requiring row-level locking or SECURITY DEFINER context.

All mutations to `points_balance` go through RPCs or DB triggers exclusively — never through direct table UPDATE from application code.

---

## 1. POST /api/orders — Guest Order Creation

**File**: `app/api/orders/route.ts`
**Purpose**: Save a guest order (no auth token) to Supabase with rate limiting to prevent abuse.

### Rate Limiting

- **Limit**: 10 requests per minute per IP address
- **Storage**: Vercel KV (key format: `rate:orders:{ip}`)
- **Exceeded response**: HTTP 429 with body `{ error: 'too_many_requests' }`
- **Why server-side**: Guest orders bypass Supabase RLS and use `SUPABASE_SERVICE_ROLE_KEY` — rate limiting must be enforced before reaching the DB.

### Request

```http
POST /api/orders
Content-Type: application/json
```

```json
{
  "customer_name": "string (required)",
  "customer_phone": "string (required, regex /^01[0125][0-9]{8}$/)",
  "delivery_address": "string (required if order_type = 'delivery')",
  "order_type": "'delivery' | 'pickup'",
  "zone_id": "uuid | null (required if order_type = 'delivery')",
  "notes": "string | null",
  "guest_token": "uuid (generated in sessionStorage on first visit)",
  "subtotal": "integer (EGP, in whole pounds)",
  "delivery_fee": "integer (EGP, 0 for pickup)",
  "discount_amount": "integer (0 for guests — points discount not available)",
  "total_price": "integer (EGP)",
  "items": [
    {
      "product_id": "uuid",
      "variant_id": "uuid | null",
      "product_name": "string (snapshot — captured from cart at submit time)",
      "variant_name": "string | null (snapshot)",
      "unit_price": "integer (snapshot — captured from cart at submit time)",
      "quantity": "integer (>= 1)"
    }
  ]
}
```

**Validation rules enforced server-side**:
- `customer_phone` must match `/^01[0125][0-9]{8}$/`
- `items` must be non-empty array
- `order_type = 'delivery'` requires `zone_id` to be a valid UUID
- `total_price` must equal `subtotal + delivery_fee - discount_amount`
- Each item: `unit_price * quantity` must equal item's `subtotal` (verified by `chk_order_item_subtotal` DB constraint)

### Response

**200 OK**:
```json
{
  "order_id": "uuid",
  "order_code": "KH-1042"
}
```

**400 Bad Request** (validation failure):
```json
{
  "error": "validation_failed",
  "details": "customer_phone format invalid"
}
```

**429 Too Many Requests** (rate limit exceeded):
```json
{
  "error": "too_many_requests"
}
```

**500 Internal Server Error**:
```json
{
  "error": "internal_error"
}
```

### Server Implementation Notes

- Uses `SUPABASE_SERVICE_ROLE_KEY` (service role client) — bypasses RLS to allow guest inserts.
- `user_id` is set to `NULL`.
- `guest_token` is stored as-is from the request body.
- `order_code` is generated automatically by the `set_order_code` trigger — do not pass it in the request.
- `order_items` are inserted in the same request handler in a loop after the order row is created.

---

## 2. Supabase RPC: `create_order_with_points` — Registered User Order

**Called via**: `supabase.rpc('create_order_with_points', params)`
**Purpose**: Atomically create an order, insert all order_items with snapshots, and deduct loyalty points — all in a single PostgreSQL transaction with a `FOR UPDATE` row lock.

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `p_user_id` | `uuid` | Authenticated user's ID in `public.users` |
| `p_points_to_use` | `integer` | Points to deduct (0 if not redeeming; must be ≥ 0) |
| `p_subtotal` | `integer` | Order subtotal in EGP (before delivery and discount) |
| `p_delivery_fee` | `integer` | Delivery fee in EGP (0 for pickup) |
| `p_discount` | `integer` | Points discount in EGP (`p_points_to_use * point_value_egp`) |
| `p_total` | `integer` | Final total: `subtotal + delivery_fee - discount` |
| `p_order_data` | `jsonb` | `{ customer_name, customer_phone, delivery_address, order_type, zone_id, notes }` |
| `p_items` | `jsonb` | Array: `[{ product_id, variant_id, product_name, variant_name, unit_price, quantity }]` |

### Returns

`uuid` — the new `order_id`.

### Error Conditions

| Exception | Meaning |
|-----------|---------|
| `'invalid_points: لا يجوز نقاط سالبة'` | `p_points_to_use < 0` — negative value passed |
| `'insufficient_points'` | `points_balance < p_points_to_use` |

### Security

- `SECURITY DEFINER` — runs with the privileges of the function owner (postgres), not the calling user.
- `FOR UPDATE` row lock on `users` row — prevents concurrent transactions from reading the same `points_balance` before the deduction is committed (prevents double-spend race condition).
- Points earned are calculated inside the RPC from `settings.points_per_100_egp` — app code does not pass `points_earned`.

### Client Call Example

```ts
const { data: orderId, error } = await supabase.rpc('create_order_with_points', {
  p_user_id: user.id,
  p_points_to_use: pointsToUse,
  p_subtotal: subtotal,
  p_delivery_fee: deliveryFee,
  p_discount: discountAmount,
  p_total: total,
  p_order_data: {
    customer_name: form.name,
    customer_phone: form.phone,
    delivery_address: form.address,
    order_type: orderType,
    zone_id: selectedZoneId ?? '',
    notes: form.notes ?? ''
  },
  p_items: cartItems.map(item => ({
    product_id: item.product_id,
    variant_id: item.variant_id ?? '',
    product_name: item.product_name,
    variant_name: item.variant_name ?? '',
    unit_price: item.unit_price,
    quantity: item.quantity
  }))
})
```

---

## 3. Supabase RPC: `admin_adjust_points` — Manual Points Adjustment

**Called via**: Server Action in `app/admin/customers/page.tsx` → `components/admin/PointsManager.tsx`
**Purpose**: Allow admins to manually add or deduct points for a customer, with an audit trail in `point_transactions`.

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `p_user_id` | `uuid` | Target user's ID in `public.users` |
| `p_amount` | `integer` | Points to add or deduct (must be > 0) |
| `p_type` | `text` | `'manual_add'` or `'manual_deduct'` |
| `p_note` | `text` | Admin-provided reason (stored in `point_transactions.note`) |

### Returns

`integer` — updated `points_balance` after the adjustment.

### Validation

- `p_amount` must be > 0 (validated in both Server Action and RPC).
- `p_type` must be exactly `'manual_add'` or `'manual_deduct'` — any other value raises an exception.
- On `manual_deduct`: new balance is `GREATEST(0, current_balance - p_amount)` — balance cannot go negative.

### Security

- `SECURITY DEFINER` — runs with elevated privileges.
- Protected by RLS: the caller must have `app_metadata.role = 'admin'` verified by the Server Action before calling the RPC.
- **Direct `UPDATE users SET points_balance = ...` is PROHIBITED in application code** — this RPC is the only sanctioned path for admin point adjustments.

### Audit Trail

Every call inserts a row into `point_transactions`:
```sql
INSERT INTO point_transactions (user_id, order_id, transaction_type, points, note)
VALUES (p_user_id, NULL, p_type, p_amount, p_note);
```

### Server Action Wrapper

```ts
// In app/admin/customers/page.tsx or a dedicated server action file
'use server'
export async function adjustPoints(
  userId: string,
  amount: number,
  type: 'manual_add' | 'manual_deduct',
  note: string
) {
  // Verify caller is admin (check session JWT app_metadata)
  const supabase = createServerClient()  // uses SUPABASE_SERVICE_ROLE_KEY
  const { data, error } = await supabase.rpc('admin_adjust_points', {
    p_user_id: userId,
    p_amount: amount,
    p_type: type,
    p_note: note
  })
  if (error) throw new Error(error.message)
  return data  // updated points_balance
}
```

---

## 4. Settings Revalidation — After Admin Settings Save

**Trigger**: Server Action in `app/admin/settings/page.tsx`
**Purpose**: Immediately invalidate the settings cache across all pages so admin changes are reflected on the live site without redeployment.

### Flow

```
Admin fills settings form
    ↓
Server Action: upsert all changed settings keys to `settings` table
    ↓
revalidateTag('settings')      ← invalidates ALL pages that read settings via lib/settings.ts
    ↓
Next request from any user: lib/settings.ts re-fetches from Supabase
    ↓
New settings visible to all users immediately
```

### Implementation

```ts
// app/admin/settings/page.tsx — Server Action
'use server'
import { revalidateTag } from 'next/cache'
import { createServerClient } from '@/lib/supabase'

export async function saveSettings(formData: FormData) {
  const supabase = createServerClient()
  const updates = extractSettingsFromForm(formData)  // returns { key, value }[]

  const { error } = await supabase
    .from('settings')
    .upsert(updates, { onConflict: 'key' })

  if (error) throw new Error(error.message)

  revalidateTag('settings')  // ← immediate cache invalidation
}
```

### `lib/settings.ts` Cache Setup

```ts
import { unstable_cache as nextCache } from 'next/cache'
import { createServerClient } from '@/lib/supabase'

export const getSettings = nextCache(
  async (): Promise<Record<string, string>> => {
    const supabase = createServerClient()
    const { data, error } = await supabase.from('settings').select('*')
    if (error) throw error
    return Object.fromEntries((data ?? []).map(r => [r.key, r.value ?? '']))
  },
  ['settings'],
  { tags: ['settings'] }
)
```

### Why Not `revalidate: 3600`

Time-based revalidation creates a dangerous window: if an admin changes the WhatsApp order number, customers could send orders to the old number for up to 1 hour. `revalidateTag` provides zero-delay invalidation triggered explicitly on every save.

### Pages Affected by Revalidation

All pages that call `getSettings()` from `lib/settings.ts` are automatically invalidated:
- `app/page.tsx` — hero CTA guard (`is_ordering_open`), statistics, social links
- `app/menu/page.tsx` — `is_ordering_open` guard
- `app/checkout/page.tsx` — WhatsApp order number, points configuration
- `app/admin/settings/page.tsx` — current settings form values
- `components/layout/Footer.tsx` — social links, phone numbers, address
- `components/ui/FloatingWhatsapp.tsx` — WhatsApp social URL
