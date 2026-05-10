import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import type { Database } from "@/types/database";

export async function POST(req: NextRequest) {
  // Rate limiting — 20 attempts / minute / IP (stricter than orders: pure lookup, no order required)
  if (process.env.KV_REST_API_URL) {
    try {
      const { kv } = await import("@vercel/kv");
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
        req.headers.get("x-real-ip") ??
        "unknown";
      const key = `rate:coupon:${ip}`;
      const count = await kv.incr(key);
      if (count === 1) await kv.expire(key, 60);
      if (count > 20) {
        return NextResponse.json(
          { error: "محاولات كثيرة جداً، انتظر دقيقة وحاول مجدداً" },
          { status: 429 }
        );
      }
    } catch {
      // KV failure must not block coupon validation — fail open
    }
  }

  let body: { coupon_code?: string; subtotal?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const { coupon_code, subtotal = 0 } = body;

  // Validate subtotal is a safe non-negative integer
  const safeSubtotal = typeof subtotal === "number" && Number.isFinite(subtotal) && subtotal >= 0
    ? Math.floor(subtotal)
    : 0;

  const code = typeof coupon_code === "string" ? coupon_code.trim().toUpperCase() : null;

  if (!code) {
    return NextResponse.json({ error: "يرجى إدخال كود الخصم" }, { status: 400 });
  }

  const supabase = await createServerClient();

  const { data: coupon, error } = await supabase
    .from("offers")
    .select("id, benefit_type, benefit_value, min_order_amount, max_uses, uses_count, is_active, expires_at")
    .eq("coupon_code", code)
    .single();

  if (error || !coupon) {
    return NextResponse.json({ error: "كود الخصم غير صحيح" }, { status: 400 });
  }

  if (!coupon.is_active) {
    return NextResponse.json({ error: "هذا الكود غير مفعّل حالياً" }, { status: 400 });
  }

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return NextResponse.json({ error: "انتهت صلاحية كود الخصم" }, { status: 400 });
  }

  if (coupon.max_uses !== null && (coupon.uses_count ?? 0) >= coupon.max_uses) {
    return NextResponse.json({ error: "تم استنفاد هذا الكود" }, { status: 400 });
  }

  const minOrder = coupon.min_order_amount ?? 0;
  if (safeSubtotal < minOrder) {
    return NextResponse.json(
      { error: `الحد الأدنى للطلب ${minOrder} ج لاستخدام هذا الكود` },
      { status: 400 }
    );
  }

  let discount = 0;
  if (coupon.benefit_type === "coupon_pct") {
    discount = Math.floor((safeSubtotal * coupon.benefit_value) / 100);
  } else if (coupon.benefit_type === "coupon_fixed") {
    discount = Math.min(Math.floor(coupon.benefit_value), safeSubtotal);
  } else {
    return NextResponse.json({ error: "كود الخصم غير صالح لهذا النوع" }, { status: 400 });
  }

  return NextResponse.json({ discount });
}
