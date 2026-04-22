import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export async function POST(req: NextRequest) {
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

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

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
