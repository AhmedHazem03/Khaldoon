# Research: موقع مطعم خلدون

**Phase**: Phase 0 — Outline & Research
**Branch**: `001-khaldoun-restaurant`
**Date**: 2026-04-21
**Status**: Complete — all NEEDS CLARIFICATION resolved

---

## 1. Auth Strategy: Email Auth with `{phone}@khaldoun.local`

**Decision**: Use Supabase Email Auth with a synthetic email address in the format `{phone}@khaldoun.local` (e.g., `01064414303@khaldoun.local`). The real phone number is stored in `raw_user_meta_data.phone_number`.

**Rationale**:
- Supabase Phone Auth requires OTP delivery via an SMS provider (Twilio, MessageBird, etc.) — this costs money and adds an external dependency with ongoing operational risk.
- Email Auth with synthetic addresses is free, works immediately, requires no third-party provider, and eliminates OTP delays that frustrate mobile users in Egypt.
- The phone number remains the human-facing identifier (shown in profile, checkout, admin panel) — only the auth mechanism changes internally.
- No password reset flow is implemented by design: users contact the restaurant manually. This avoids the email verification complexity that would conflict with the synthetic address approach.

**Alternatives Considered**:
- **Supabase Phone Auth (OTP)**: Rejected — requires paid SMS provider, OTP adds friction, Egyptian mobile networks occasionally delay SMS delivery.
- **Magic Link Auth**: Rejected — requires a real email address; most target users are mobile-first and may not have convenient email access.
- **Custom JWT / passwordless**: Rejected — significantly increases implementation complexity with no additional benefit for this use case.

---

## 2. WhatsApp Integration: `wa.me` Deep-Link vs WhatsApp Business API

**Decision**: Use `wa.me/{phone}?text={encodedMessage}` deep-link exclusively. No WhatsApp Business API, no third-party integration.

**Rationale**:
- `wa.me` is completely free with no API key, no monthly subscription, no approval process.
- WhatsApp Business API (via Meta or BSPs like Twilio, Bird) costs ~$0.005–0.08 per message + BSP fees + monthly minimums — prohibitive for a single restaurant.
- The deep-link opens WhatsApp with the pre-filled message on any device (iOS, Android, desktop). The user sends the message manually, which actually aligns with the restaurant's workflow of receiving messages directly.

**Known Limitation**: `wa.me` opens the WhatsApp app but cannot confirm whether the user actually pressed "Send". The message delivery is not programmatically verifiable.

**Solution**: Implemented via `whatsapp_opened` flag on the order record + confirmation page (`/order-confirm`). When WhatsApp opens, `whatsapp_opened` is set to `true` on the order. The confirmation page asks "هل ضغطت على إرسال في الواتساب؟" with two actions: "نعم، أرسلت" (completes flow) and "أعد فتح الواتساب" (re-opens the link). This is the same UX pattern used by Talabat and other Egyptian food delivery apps.

**Alternatives Considered**:
- **WhatsApp Business API (Meta Cloud API)**: Rejected — costs money, requires Meta business verification, message templates require approval, adds significant operational overhead.
- **Twilio WhatsApp API**: Rejected — same cost concerns plus vendor lock-in.

---

## 3. Points System: Race Condition Prevention

**Decision**: All points balance mutations are handled exclusively through database-level Triggers and RPCs. The `create_order_with_points` RPC uses `SELECT ... FOR UPDATE` to acquire a row lock on the user record before checking and modifying `points_balance`.

**Rationale**:
- Without row locking, a user opening two browser tabs simultaneously could submit two orders that both pass the "sufficient points" check with the same balance, effectively spending the same points twice (double-spend race condition).
- `FOR UPDATE` in PostgreSQL acquires an exclusive row lock that blocks any concurrent transaction from reading or modifying that user row until the first transaction commits or rolls back. This is the standard solution for this class of problem.
- By routing all mutations through DB-layer triggers and RPCs, the application layer cannot accidentally bypass this protection — even if a developer writes incorrect app-code, the DB enforces correctness.

**Key Implementation Details**:
```sql
-- Inside create_order_with_points RPC:
SELECT points_balance INTO v_balance
FROM users WHERE id = p_user_id FOR UPDATE;
-- ^ Blocks concurrent transactions until this one completes
```

**Validation added**: The RPC also validates `p_points_to_use >= 0` to prevent negative values from being passed (which could add points instead of deducting them):
```sql
IF p_points_to_use < 0 THEN
  RAISE EXCEPTION 'invalid_points: لا يجوز نقاط سالبة';
END IF;
```

**Alternatives Considered**:
- **Optimistic locking**: Rejected — requires retry logic in application code and is more complex to implement correctly.
- **Application-layer mutex (e.g., Redis lock)**: Rejected — adds Redis as a dependency; DB-layer locking is simpler and more reliable.
- **Sequential queue**: Rejected — adds infrastructure complexity for a single-restaurant scale.

---

## 4. Settings Cache Strategy: `React cache()` + `revalidateTag` vs `revalidate: 3600`

**Decision**: Cache settings using `unstable_cache` from `'next/cache'` with `tags: ['settings']`, combined with `revalidateTag('settings')` triggered from the admin settings Server Action on every save.

**Rationale**:
- `unstable_cache` from `'next/cache'` is the only Next.js caching primitive that supports `revalidateTag` for cross-request cache invalidation. Despite the "unstable" prefix, it remains the correct and supported approach in Next.js 15 App Router for server-side data caching with tag-based invalidation.
- `React cache()` (the built-in React 19 function) provides per-request memoization only — it does NOT persist across requests and does NOT support `revalidateTag`. Using `React cache()` alone would mean `revalidateTag('settings')` silently does nothing.
- `revalidate: 3600` (time-based revalidation every 1 hour) is dangerous in this context: if an admin changes the WhatsApp order number, users could continue sending orders to the old number for up to 1 hour. This is a direct operational risk for the restaurant.
- `revalidateTag('settings')` provides immediate cache invalidation — the moment the admin saves any setting, all cached settings across all pages are invalidated and will be fresh on the next request.

**Implementation Pattern**:
```ts
// lib/settings.ts
import { unstable_cache } from 'next/cache'

export const getSettings = unstable_cache(
  async () => {
    const supabase = createServerClient()
    const { data } = await supabase.from('settings').select('*')
    return Object.fromEntries((data ?? []).map(r => [r.key, r.value]))
  },
  ['settings'],
  { tags: ['settings'] }
)
// Admin save action: after upsert → revalidateTag('settings')
```
)
// Admin save action: after upsert → revalidateTag('settings')
```

**Alternatives Considered**:
- **`revalidate: 3600` (time-based)**: Rejected — up to 1-hour delay for critical settings like WhatsApp number.
- **No caching (fetch on every request)**: Rejected — settings are read on every page load; hitting Supabase on every request would add unnecessary latency and cost.
- **`React cache()` only**: Rejected — per-request memoization only, does not persist across requests, `revalidateTag` has no effect on it.

---

## 5. WhatsApp URL Length Constraint

**Decision**: `lib/whatsapp.ts` checks the total URL length after `encodeURIComponent` and truncates the item list if it exceeds 2048 characters, appending `"للتفاصيل: رقم الطلب KH-XXXX"`.

**Rationale**:
- Arabic text encodes to approximately 6× its original character length in URL encoding (each Arabic character becomes `%XX%XX%XX` — 9 characters for a 3-byte UTF-8 sequence).
- An order with 10 Arabic item names easily exceeds the 2048-character browser URL limit after encoding. URLs exceeding this limit may be silently truncated by WhatsApp, resulting in malformed messages.
- The order code (KH-XXXX) is the fallback — the restaurant can look up the full order in the admin panel using the code, so truncating the item list doesn't lose critical information.

**Algorithm**:
1. Build the full message with all items.
2. Encode: `const url = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message)`
3. If `url.length <= 2048`: use as-is.
4. If `url.length > 2048`: rebuild message with items truncated (drop items from the end one by one until within limit), append `\n\nللتفاصيل: رقم الطلب {order_code}`.

**Alternatives Considered**:
- **Hard limit on cart item count**: Rejected — intrusive UX restriction.
- **Short URL service**: Rejected — adds external dependency and potential link expiration issues.
- **Send full details in a second message**: Rejected — cannot automate second message with `wa.me`.

---

## 6. Mobile UI Patterns: Bottom Sheet vs Side Drawer

**Decision**: Use Bottom Sheet for cart drawer and contextual overlays on mobile. Side drawers are not used.

**Rationale**:
- Arabic is read right-to-left. A side drawer sliding from the right feels visually ambiguous — it could be confused with a "back" navigation gesture in RTL layout.
- Bottom Sheet is the dominant mobile overlay pattern in Egyptian mobile apps (Talabat, Elmenus, Noon Food) — users in the target demographic are already accustomed to this pattern.
- Bottom Sheet allows `max-h-[85vh] overflow-y-auto` which works naturally for content of variable length (cart with 1 item vs 10 items).
- One-handed usability: Egyptian users predominantly use phones one-handed; swiping up from the bottom is more ergonomic than reaching across the screen to a side drawer.

**Implementation**: `CartDrawer.tsx` slides up from bottom with a drag handle, backdrop overlay that dismisses on click, and smooth transition animation.

**Alternatives Considered**:
- **Right-side drawer (RTL)**: Rejected — conflicts with back-navigation gesture area and is confusing in RTL context.
- **Full-page cart only (no drawer)**: Considered but rejected — bottom sheet provides faster access without losing the current menu browsing context.

---

## 7. Cursor-Based Pagination vs Offset Pagination

**Decision**: All admin list views (especially `/admin/orders`) use cursor-based pagination — 25 records per page, ordered by `created_at DESC`, using the last record's `created_at` as the cursor for the next page.

**Rationale**:
- Offset-based pagination (`OFFSET 25 * page`) breaks consistency when new records are added between page loads: if 5 new orders arrive while an admin is viewing page 2, the next "page 3" will have 5 records that were already seen on page 2 (duplicates) and 5 records that will be skipped.
- Cursor-based pagination is stable: the cursor (last `created_at` value seen) always points to the same position in the dataset regardless of new records arriving.
- At the expected scale (~500 orders/day), offset pagination would also become progressively slower due to `OFFSET` requiring the DB to scan and discard all preceding rows. Cursor-based pagination maintains consistent O(log n) index performance.
- Supabase PostgREST supports cursor-based pagination natively via `.lt('created_at', cursor).order('created_at', { ascending: false }).limit(25)`.

**Alternatives Considered**:
- **Offset-based pagination**: Rejected — data consistency issues under real-time inserts; performance degrades at scale.
- **Infinite scroll with real-time subscription**: Considered but rejected for admin panel — admins need stable, auditable views of order history, not live-updating feeds.

---

## Summary Table

| Decision | Chosen Approach | Key Reason |
|----------|----------------|------------|
| Auth | Email Auth + `{phone}@khaldoun.local` | Free, no SMS provider, immediate registration |
| WhatsApp | `wa.me` deep-link | Free, no API key, no monthly cost |
| Points race condition | `FOR UPDATE` row lock in RPC | Prevents double-spend without external dependencies |
| Settings cache | `React cache()` + `revalidateTag` | Immediate invalidation vs dangerous 1-hour stale window |
| WhatsApp URL | Truncate + append order code | Arabic encodes 6×; 10 items easily exceed 2048 chars |
| Mobile UI | Bottom Sheet | Dominant Egyptian app pattern; RTL-safe |
| Pagination | Cursor-based (25/page) | Stable under real-time inserts; O(log n) performance |
