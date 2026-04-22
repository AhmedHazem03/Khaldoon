"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase-server";

export async function addZone(formData: FormData) {
  const supabase = await createServerClient();
  const zone_name = (formData.get("zone_name") as string).trim();
  const fee = parseInt(formData.get("fee") as string, 10);

  if (!zone_name || isNaN(fee) || fee < 0) return;

  await supabase.from("delivery_zones").insert({ zone_name, fee, is_active: true });
  revalidatePath("/admin/zones");
  revalidatePath("/cart");
  revalidatePath("/checkout");
}

export async function updateZoneFee(zoneId: string, fee: number) {
  const supabase = await createServerClient();
  await supabase.from("delivery_zones").update({ fee }).eq("id", zoneId);
  revalidatePath("/admin/zones");
  revalidatePath("/cart");
  revalidatePath("/checkout");
}

export async function toggleZone(zoneId: string, isActive: boolean) {
  const supabase = await createServerClient();
  await supabase
    .from("delivery_zones")
    .update({ is_active: isActive })
    .eq("id", zoneId);
  revalidatePath("/admin/zones");
  revalidatePath("/cart");
}
