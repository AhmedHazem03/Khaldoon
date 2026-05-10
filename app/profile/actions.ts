"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerClient, createSessionClient } from "@/lib/supabase-server";

type CancelResult =
  | { success: true }
  | { error: "unauthorized" | "not_found" | "window_expired" | "already_cancelled" };

/**
 * Cancel a pending order.
 * Only allowed if order.status === 'pending' AND within 5 minutes of creation.
 * Points refund is handled automatically by the DB trigger.
 */
export async function cancelOrder(orderId: string): Promise<CancelResult> {
  const sessionClient = await createSessionClient();
  const {
    data: { user: authUser },
  } = await sessionClient.auth.getUser();

  if (!authUser) {
    redirect("/profile");
  }

  const supabase = await createServerClient();

  const { data: publicUser } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", authUser.id)
    .single();

  if (!publicUser) {
    return { error: "unauthorized" };
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, created_at, user_id")
    .eq("id", orderId)
    .eq("user_id", publicUser.id)
    .single();

  if (!order) {
    return { error: "not_found" };
  }
  if (order.status === "cancelled") {
    return { error: "already_cancelled" };
  }
  if (order.status !== "pending") {
    return { error: "not_found" };
  }

  const ageMs = Date.now() - new Date(order.created_at).getTime();
  if (ageMs > 5 * 60 * 1000) {
    return { error: "window_expired" };
  }

  // Update status — trigger handles points_used refund automatically
  await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId);

  return { success: true };
}

/**
 * Update the current user's profile (name, phone, address).
 */
export async function updateProfile(data: {
  name: string;
  phone_number: string;
  default_address: string;
}): Promise<{ success: true } | { error: string }> {
  const sessionClient = await createSessionClient();
  const {
    data: { user: authUser },
  } = await sessionClient.auth.getUser();

  if (!authUser) return { error: "غير مصرح" };

  if (data.phone_number && !/^01[0125][0-9]{8}$/.test(data.phone_number)) {
    return { error: "رقم الهاتف غير صحيح (مثال: 01012345678)" };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("users")
    .update({
      name: data.name.trim() || null,
      phone_number: data.phone_number.trim() || null,
      default_address: data.default_address.trim() || null,
    })
    .eq("auth_id", authUser.id);

  if (error) {
    console.error("[updateProfile] Supabase error:", error.code, error.message, error.details);
    if (error.code === "23505") return { error: "رقم الهاتف مستخدم مع حساب آخر" };
    if (error.code === "23502") return { error: "رقم الهاتف مطلوب ولا يمكن تركه فارغاً" };
    return { error: `حدث خطأ (${error.code ?? "unknown"})، حاول مجدداً` };
  }

  revalidatePath("/profile");
  return { success: true };
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<never> {
  const sessionClient = await createSessionClient();
  await sessionClient.auth.signOut();
  redirect("/");
}
