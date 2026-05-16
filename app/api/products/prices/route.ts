import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/products/prices?ids=uuid1,uuid2,...
 *
 * Returns the current authoritative prices for the requested products
 * and their active variants. Used by checkout to detect stale cart prices.
 */
export async function GET(request: NextRequest) {
  const limited = await rateLimit({
    request,
    key: "prices",
    limit: 60,
  });
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids");

  if (!idsParam) {
    return NextResponse.json([], { status: 200 });
  }

  const ids = idsParam
    .split(",")
    .map((s) => s.trim())
    .filter((s) => UUID_RE.test(s))
    .slice(0, 100);

  if (ids.length === 0) {
    return NextResponse.json([], { status: 200 });
  }

  const supabase = await createServerClient();

  const [{ data: products, error: pErr }, { data: variants, error: vErr }] = await Promise.all([
    supabase.from("products").select("id, base_price").in("id", ids),
    supabase
      .from("product_variants")
      .select("id, product_id, price")
      .in("product_id", ids)
      .eq("is_available", true),
  ]);

  if (pErr || vErr) {
    console.error("[prices] query error:", pErr ?? vErr);
    return NextResponse.json(
      { error: "فشل في جلب الأسعار" },
      { status: 500 }
    );
  }

  const result: Array<{ id: string; variant_id: string | null; price: number }> = [];

  for (const product of products ?? []) {
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
