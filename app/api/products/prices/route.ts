import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

/**
 * GET /api/products/prices?ids=uuid1,uuid2,...
 *
 * Returns the current authoritative prices for the requested product/variant combos.
 * Used by the checkout page to detect stale cart prices before order submission.
 *
 * Response: Array<{ id: string; variant_id: string | null; price: number }>
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids");

  if (!idsParam) {
    return NextResponse.json([], { status: 200 });
  }

  // Sanitize: accept only UUID-shaped segments to prevent injection
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const ids = idsParam
    .split(",")
    .map((s) => s.trim())
    .filter((s) => uuidPattern.test(s))
    .slice(0, 100); // hard cap

  if (ids.length === 0) {
    return NextResponse.json([], { status: 200 });
  }

  const supabase = await createServerClient();

  // Fetch products (for items without variants)
  const { data: products, error: pErr } = await supabase
    .from("products")
    .select("id, base_price")
    .in("id", ids);

  if (pErr) {
    console.error("prices: products query error", pErr);
    return NextResponse.json(
      { error: "فشل في جلب الأسعار" },
      { status: 500 }
    );
  }

  // Fetch all active variants for those products
  const { data: variants, error: vErr } = await supabase
    .from("product_variants")
    .select("id, product_id, price")
    .in("product_id", ids)
    .eq("is_available", true);

  if (vErr) {
    console.error("prices: variants query error", vErr);
    return NextResponse.json(
      { error: "فشل في جلب الأسعار" },
      { status: 500 }
    );
  }

  // Build response: one entry per product (null variant) + one per variant
  const result: Array<{ id: string; variant_id: string | null; price: number }> = [];

  for (const product of products ?? []) {
    // Base price entry (for products without variants)
    result.push({ id: product.id, variant_id: null, price: product.base_price ?? 0 });
  }

  for (const variant of variants ?? []) {
    result.push({
      id: variant.product_id,
      variant_id: variant.id,
      price: variant.price,
    });
  }

  return NextResponse.json(result, { status: 200 });
}
