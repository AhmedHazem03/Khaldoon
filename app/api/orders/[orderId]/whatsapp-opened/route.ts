import { NextRequest, NextResponse } from "next/server";
import { createServerClient, createSessionClient } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * PATCH /api/orders/[orderId]/whatsapp-opened
 *
 * Marks whatsapp_opened = true for the given order.
 * Verifies ownership via either:
 *   - Active user session (registered orders)
 *   - x-guest-token header matching orders.guest_token (guest orders)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const limited = await rateLimit({
    request,
    key: "wa-opened",
    limit: 30,
  });
  if (limited) return limited;

  const { orderId } = await params;

  if (!UUID_RE.test(orderId)) {
    return NextResponse.json({ error: "معرّف الطلب غير صحيح" }, { status: 400 });
  }

  const supabase = await createServerClient();

  // Try session-based auth first (registered users)
  try {
    const sessionClient = await createSessionClient();
    const { data: { user: authUser } } = await sessionClient.auth.getUser();

    if (authUser) {
      const { data: publicUser } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", authUser.id)
        .single();

      if (!publicUser) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
      }

      const { data: updated } = await supabase
        .from("orders")
        .update({ whatsapp_opened: true })
        .eq("id", orderId)
        .eq("user_id", publicUser.id)
        .select("id");

      if (!updated?.length) {
        return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
      }

      return NextResponse.json({ success: true }, { status: 200 });
    }
  } catch {
    // session read failed — fall through to guest path
  }

  // Guest path: verify via x-guest-token header
  const guestToken = request.headers.get("x-guest-token");
  if (guestToken && UUID_RE.test(guestToken)) {
    const { data: updated, error } = await supabase
      .from("orders")
      .update({ whatsapp_opened: true })
      .eq("id", orderId)
      .eq("guest_token", guestToken)
      .select("id");

    if (error) {
      console.error("[whatsapp-opened] guest update error:", error);
      return NextResponse.json({ error: "فشل في تحديث حالة الطلب" }, { status: 500 });
    }

    if (!updated?.length) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  }

  return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
}
