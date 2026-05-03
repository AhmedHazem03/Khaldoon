import { NextRequest, NextResponse } from "next/server";
import { createServerClient, createSessionClient } from "@/lib/supabase-server";
import { getSettings } from "@/lib/settings";

export async function POST(request: NextRequest) {
  // ── Rate limiting via Vercel KV (T064) ──────────────────────────────────
  // Skipped gracefully if KV not configured (local dev without KV env vars).
  if (process.env.KV_REST_API_URL) {
    try {
      const { kv } = await import("@vercel/kv");
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
        request.headers.get("x-real-ip") ??
        "unknown";
      const key = `rate:orders:${ip}`;
      const count = await kv.incr(key);
      if (count === 1) await kv.expire(key, 60);
      if (count > 10) {
        return NextResponse.json(
          { error: "طلبات كثيرة جداً، حاول مرة أخرى بعد دقيقة" },
          { status: 429 }
        );
      }
    } catch {
      // KV failure MUST NOT block order creation — fail open and log nothing
    }
  }

  try {
    const body = await request.json();

    const {
      customer_name,
      customer_phone,
      delivery_address,
      order_type,
      zone_id,
      notes,
      guest_token,
      is_registered,
      points_to_use,
      coupon_code,
      items,
    } = body;

    // Basic structural validation
    if (!customer_name || !customer_phone || !order_type || !items?.length) {
      return NextResponse.json(
        { error: "بيانات الطلب غير مكتملة" },
        { status: 400 }
      );
    }

    // Input length limits
    if (
      typeof customer_name !== "string" || customer_name.length > 100 ||
      typeof customer_phone !== "string" ||
      (delivery_address !== null && delivery_address !== undefined && typeof delivery_address !== "string") ||
      (typeof delivery_address === "string" && delivery_address.length > 500) ||
      (notes !== null && notes !== undefined && typeof notes !== "string") ||
      (typeof notes === "string" && notes.length > 1000)
    ) {
      return NextResponse.json({ error: "بيانات الطلب غير صحيحة" }, { status: 400 });
    }

    // Max 50 items per order
    if (Array.isArray(items) && items.length > 50) {
      return NextResponse.json({ error: "تجاوزت الحد الأقصى لعدد الأصناف" }, { status: 400 });
    }

    const phoneRegex = /^01[0125][0-9]{8}$/;
    if (!phoneRegex.test(customer_phone)) {
      return NextResponse.json(
        { error: "رقم الهاتف غير صحيح" },
        { status: 400 }
      );
    }

    if (order_type === "delivery" && !zone_id) {
      return NextResponse.json(
        { error: "منطقة التوصيل مطلوبة" },
        { status: 400 }
      );
    }

    // Validate items structure
    if (
      !Array.isArray(items) ||
      items.some(
        (i: unknown) =>
          typeof i !== "object" ||
          !i ||
          !("product_id" in i) ||
          !("quantity" in i) ||
          typeof (i as { quantity: unknown }).quantity !== "number" ||
          (i as { quantity: number }).quantity < 1
      )
    ) {
      return NextResponse.json({ error: "بيانات الأصناف غير صحيحة" }, { status: 400 });
    }

    const supabase = await createServerClient();

    // --- Recalculate all financial values server-side ---
    const productIds: string[] = [
      ...new Set(items.map((i: { product_id: string }) => i.product_id)),
    ];
    const variantIds: string[] = [
      ...new Set(
        items
          .filter((i: { variant_id?: string | null }) => i.variant_id)
          .map((i: { variant_id: string }) => i.variant_id)
      ),
    ];

    // Fetch prices + active product offers in parallel
    const [{ data: products }, { data: variants }, { data: activeOfferRows }] = await Promise.all([
      supabase
        .from("products")
        .select("id, base_price, name, is_available")
        .in("id", productIds),
      variantIds.length > 0
        ? supabase
            .from("product_variants")
            .select("id, product_id, variant_name, price, is_available")
            .in("id", variantIds)
        : { data: [] as { id: string; product_id: string; variant_name: string; price: number; is_available: boolean }[] },
      supabase
        .from("offer_products")
        .select("product_id, offers!inner(id, benefit_type, benefit_value, expires_at, is_active)")
        .in("product_id", productIds)
        .eq("offers.is_active", true),
    ]);

    // Verify all products exist and are available
    for (const item of items as Array<{
      product_id: string;
      variant_id?: string | null;
      product_name: string;
      variant_name?: string | null;
      quantity: number;
    }>) {
      const product = products?.find((p) => p.id === item.product_id);
      if (!product) {
        return NextResponse.json(
          { error: `صنف غير موجود: ${item.product_id}` },
          { status: 400 }
        );
      }
      if (!product.is_available) {
        return NextResponse.json(
          { error: `الصنف غير متاح حالياً: ${product.name}` },
          { status: 400 }
        );
      }
      if (item.variant_id) {
        const variant = variants?.find((v) => v.id === item.variant_id);
        if (!variant) {
          return NextResponse.json(
            { error: "متغير الصنف غير موجود" },
            { status: 400 }
          );
        }
        if (!variant.is_available) {
          return NextResponse.json(
            { error: `هذا الخيار غير متاح حالياً: ${variant.variant_name}` },
            { status: 400 }
          );
        }
      }
    }

    // Build active product offer map (product_id → offer)
    const now = new Date().toISOString();
    type OfferRow = { id: string; benefit_type: string; benefit_value: number; expires_at: string | null; is_active: boolean };
    const productOfferMap = new Map<string, OfferRow>();
    for (const row of (activeOfferRows ?? []) as Array<{ product_id: string; offers: OfferRow }>) {
      const offer = row.offers;
      if (!offer.is_active) continue;
      if (offer.expires_at && offer.expires_at < now) continue;
      if (!productOfferMap.has(row.product_id)) {
        productOfferMap.set(row.product_id, offer);
      }
    }

    // Build order items with server-authoritative prices + applied product discounts
    const orderItems = (
      items as Array<{
        product_id: string;
        variant_id?: string | null;
        product_name: string;
        variant_name?: string | null;
        quantity: number;
      }>
    ).map((item) => {
      const product = products!.find((p) => p.id === item.product_id)!;
      const variant = item.variant_id
        ? variants?.find((v) => v.id === item.variant_id)
        : null;
      let unitPrice = variant ? variant.price : (product.base_price ?? 0);

      // Apply product-level offer discount (server-side)
      const offer = productOfferMap.get(item.product_id);
      if (offer) {
        if (offer.benefit_type === "discount_pct") {
          unitPrice = Math.max(0, Math.floor(unitPrice * (1 - offer.benefit_value / 100)));
        } else if (offer.benefit_type === "discount_fixed") {
          unitPrice = Math.max(0, unitPrice - Math.floor(offer.benefit_value));
        }
      }

      return {
        product_id: item.product_id,
        variant_id: item.variant_id ?? null,
        product_name: product.name,
        variant_name: variant?.variant_name ?? null,
        unit_price: unitPrice,
        quantity: item.quantity,
        subtotal: unitPrice * item.quantity,
      };
    });

    // Recalculate totals server-side
    const subtotal = orderItems.reduce((sum, i) => sum + i.subtotal, 0);

    // ── Coupon validation ──────────────────────────────────────────────────
    let couponId: string | null = null;
    let offerDiscount = 0;
    const rawCoupon = typeof coupon_code === "string" ? coupon_code.trim().toUpperCase() : null;

    if (rawCoupon) {
      const { data: coupon } = await supabase
        .from("offers")
        .select("id, benefit_type, benefit_value, min_order_amount, max_uses, uses_count, is_active, expires_at")
        .eq("coupon_code", rawCoupon)
        .single();

      if (!coupon || !coupon.is_active) {
        return NextResponse.json({ error: "كوبون غير صالح" }, { status: 400 });
      }
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return NextResponse.json({ error: "انتهت صلاحية الكوبون" }, { status: 400 });
      }
      if (coupon.max_uses !== null && (coupon.uses_count ?? 0) >= coupon.max_uses) {
        return NextResponse.json({ error: "تم استخدام هذا الكوبون بالكامل" }, { status: 400 });
      }
      if (subtotal < (coupon.min_order_amount ?? 0)) {
        return NextResponse.json({
          error: `الحد الأدنى لاستخدام هذا الكوبون ${coupon.min_order_amount} ج`,
        }, { status: 400 });
      }

      couponId = coupon.id;
      if (coupon.benefit_type === "coupon_pct") {
        offerDiscount = Math.floor(subtotal * coupon.benefit_value / 100);
      } else if (coupon.benefit_type === "coupon_fixed") {
        offerDiscount = Math.min(Math.floor(coupon.benefit_value), subtotal);
      }
    }

    // ── Bonus points from multiplier offers ───────────────────────────────
    const routeSettings = await getSettings();
    const pointsPerHundred = Number(routeSettings.points_per_100_egp ?? "1");
    let bonusPoints = 0;
    for (const item of orderItems) {
      const offer = productOfferMap.get(item.product_id);
      if (offer?.benefit_type === "points_multiplier" && offer.benefit_value > 1) {
        const normalPts = Math.floor(item.subtotal / 100) * pointsPerHundred;
        bonusPoints += Math.floor(normalPts * (offer.benefit_value - 1));
      }
    }

    // Fetch delivery fee from DB if delivery order
    let deliveryFee = 0;
    if (order_type === "delivery" && zone_id) {
      const { data: zone } = await supabase
        .from("delivery_zones")
        .select("fee, is_active")
        .eq("id", zone_id)
        .single();
      if (!zone?.is_active) {
        return NextResponse.json(
          { error: "منطقة التوصيل غير متاحة" },
          { status: 400 }
        );
      }
      deliveryFee = zone.fee;
    }

    // â”€â”€ Registered user path â€” use create_order_with_points RPC â”€â”€
    if (is_registered) {
      const sessionClient = await createSessionClient();
      const { data: { user: authUser } } = await sessionClient.auth.getUser();
      if (!authUser) {
        return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
      }

      const { data: publicUser } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", authUser.id)
        .single();
      if (!publicUser) {
        return NextResponse.json({ error: "لم يتم العثور على حساب المستخدم" }, { status: 400 });
      }

      const pointsToUse = Math.max(0, Number(points_to_use) || 0);
      const pointValueEgp = Number(routeSettings.point_value_egp ?? "0.5");
      const discount = Math.floor(pointsToUse * pointValueEgp);
      const totalPrice = Math.max(0, subtotal + deliveryFee - discount - offerDiscount);

      const { data: orderId, error: rpcError } = await supabase.rpc("create_order_with_points", {
        p_user_id: publicUser.id,
        p_points_to_use: pointsToUse,
        p_subtotal: subtotal,
        p_delivery_fee: deliveryFee,
        p_discount: discount,
        p_total: totalPrice,
        p_order_data: {
          customer_name,
          customer_phone,
          delivery_address: delivery_address ?? "",
          order_type,
          zone_id: zone_id ?? "",
          notes: notes ?? "",
        },
        p_items: orderItems.map((i) => ({
          product_id: i.product_id,
          variant_id: i.variant_id ?? "",
          product_name: i.product_name,
          variant_name: i.variant_name ?? "",
          unit_price: i.unit_price,
          quantity: i.quantity,
        })),
        p_coupon_id: couponId,
        p_offer_discount: offerDiscount,
        p_bonus_points: bonusPoints,
      });

      if (rpcError) {
        if (rpcError.message?.includes("insufficient_points")) {
          return NextResponse.json({ error: "رصيد النقاط غير كافٍ" }, { status: 400 });
        }
        console.error("RPC error:", rpcError);
        return NextResponse.json({ error: "فشل في حفظ الطلب، حاول مرة أخرى" }, { status: 500 });
      }

      const { data: order } = await supabase
        .from("orders")
        .select("id, order_code, subtotal, delivery_fee, discount_amount, offer_discount, total_price")
        .eq("id", orderId as string)
        .single();

      // Increment coupon uses_count atomically via RPC (avoids read-modify-write race)
      if (couponId) {
        await supabase.rpc("increment_coupon_uses", { p_coupon_id: couponId });
      }

      return NextResponse.json(
        {
          id: order?.id ?? orderId,
          order_code: order?.order_code ?? "",
          subtotal: order?.subtotal ?? subtotal,
          delivery_fee: order?.delivery_fee ?? deliveryFee,
          discount_amount: order?.discount_amount ?? 0,
          offer_discount: order?.offer_discount ?? offerDiscount,
          total_price: order?.total_price ?? totalPrice,
        },
        { status: 201 }
      );
    }

    // ── Guest path ──
    const totalPrice = Math.max(0, subtotal + deliveryFee - offerDiscount);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name,
        customer_phone,
        delivery_address: delivery_address ?? null,
        order_type,
        zone_id: zone_id || null,
        notes: notes ?? null,
        subtotal,
        delivery_fee: deliveryFee,
        discount_amount: 0,
        offer_discount: offerDiscount,
        coupon_id: couponId,
        total_price: totalPrice,
        points_used: 0,
        points_earned: 0,
        user_id: null,
        guest_token: guest_token ?? null,
      })
      .select("id, order_code")
      .single();

    if (orderError || !order) {
      console.error("Order insert error:", orderError);
      return NextResponse.json(
        { error: "فشل في حفظ الطلب، حاول مرة أخرى" },
        { status: 500 }
      );
    }

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems.map((i) => ({ ...i, order_id: order.id })));

    if (itemsError) {
      console.error("Order items insert error:", itemsError);
      return NextResponse.json(
        { error: "فشل في حفظ عناصر الطلب" },
        { status: 500 }
      );
    }

    // Increment coupon uses_count atomically via RPC (avoids read-modify-write race)
    if (couponId) {
      await supabase.rpc("increment_coupon_uses", { p_coupon_id: couponId });
    }

    return NextResponse.json(
      {
        id: order.id,
        order_code: order.order_code,
        subtotal,
        delivery_fee: deliveryFee,
        discount_amount: 0,
        offer_discount: offerDiscount,
        total_price: totalPrice,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Unexpected error in POST /api/orders:", err);
    return NextResponse.json(
      { error: "خطأ غير متوقع" },
      { status: 500 }
    );
  }
}
