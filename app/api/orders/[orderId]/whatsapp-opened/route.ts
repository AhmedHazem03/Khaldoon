import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

/**
 * PATCH /api/orders/[orderId]/whatsapp-opened
 *
 * Marks whatsapp_opened = true for the given order.
 * Called from the order-confirm page after the user taps "Yes, I sent it".
 * No auth required — guest orders are identified by orderId only.
 */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  // Validate orderId is a UUID
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(orderId)) {
    return NextResponse.json({ error: "معرّف الطلب غير صحيح" }, { status: 400 });
  }

  const supabase = await createServerClient();

  const { error } = await supabase
    .from("orders")
    .update({ whatsapp_opened: true })
    .eq("id", orderId);

  if (error) {
    console.error("whatsapp-opened update error:", error);
    return NextResponse.json(
      { error: "فشل في تحديث حالة الطلب" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
