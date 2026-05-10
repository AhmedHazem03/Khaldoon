"use server";

import { revalidatePath } from "next/cache";
import { createServerClient, requireAdmin } from "@/lib/supabase-server";

const VALID_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

type OrderStatus = (typeof VALID_STATUSES)[number];

export async function updateOrderStatus(
  orderId: string,
  newStatus: string
): Promise<void> {
  await requireAdmin();

  // Validate status value at system boundary
  if (!VALID_STATUSES.includes(newStatus as OrderStatus)) {
    throw new Error("Invalid order status");
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", orderId);

  if (error) {
    throw new Error(`Failed to update order status: ${error.message}`);
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin/dashboard");
}
