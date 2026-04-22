"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase-server";

interface AdjustPointsInput {
  userId: string;
  amount: number;
  type: string;
  note: string;
}

export async function adjustPoints({
  userId,
  amount,
  type,
  note,
}: AdjustPointsInput): Promise<{ success: boolean; error?: string }> {
  // Validate at system boundary
  if (!amount || amount <= 0) {
    return { success: false, error: "المبلغ يجب أن يكون أكبر من صفر" };
  }
  if (type !== "manual_add" && type !== "manual_deduct") {
    return { success: false, error: "نوع غير صالح" };
  }

  const supabase = await createServerClient();

  const { error } = await supabase.rpc("admin_adjust_points", {
    p_user_id: userId,
    p_amount: amount,
    p_type: type,
    ...(note ? { p_note: note } : {}),
  });

  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("insufficient_points")) {
      return { success: false, error: "رصيد النقاط غير كافٍ للخصم" };
    }
    if (msg.includes("user_not_found")) {
      return { success: false, error: "المستخدم غير موجود" };
    }
    return { success: false, error: "حدث خطأ أثناء التعديل" };
  }

  revalidatePath("/admin/customers");
  return { success: true };
}
