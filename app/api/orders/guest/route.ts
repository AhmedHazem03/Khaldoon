import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  // M4 — rate-limit guest order lookups to slow down token-guessing
  const limited = await rateLimit({
    request,
    key: "guest-orders",
    limit: 30,
  });
  if (limited) return limited;

  const guestToken = request.nextUrl.searchParams.get("guest_token");

  if (!guestToken || !UUID_RE.test(guestToken)) {
    return NextResponse.json([]);
  }

  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_code, status, total_price, created_at, order_type, points_used, order_items(product_name, variant_name, unit_price, quantity)"
    )
    .eq("guest_token", guestToken)
    .is("user_id", null)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json([], { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
