"use server";

import { redirect } from "next/navigation";
import { createServerClient, createSessionClient } from "@/lib/supabase-server";

/**
 * Cancel a pending order.
 * Only allowed if order.status === 'pending' AND within 5 minutes of creation.
 * Points refund is handled automatically by the DB trigger.
 */
export async function cancelOrder(orderId: string): Promise<void> {
  const sessionClient = await createSessionClient();
  const {
    data: { user: authUser },
  } = await sessionClient.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const supabase = await createServerClient();

  // Verify the order belongs to this user and is still cancellable
  const { data: publicUser } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", authUser.id)
    .single();

  if (!publicUser) {
    return;
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, created_at, user_id")
    .eq("id", orderId)
    .eq("user_id", publicUser.id)
    .single();

  if (!order || order.status !== "pending") {
    return;
  }

  const ageMs = Date.now() - new Date(order.created_at).getTime();
  if (ageMs > 5 * 60 * 1000) {
    // Cancellation window has passed — silently ignore
    return;
  }

  // Update status — trigger handles points_used refund automatically
  await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId);
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<never> {
  const sessionClient = await createSessionClient();
  await sessionClient.auth.signOut();
  redirect("/login");
}
