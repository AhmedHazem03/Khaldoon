"use server";

import { revalidateTag } from "next/cache";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase-server";

const SETTINGS_KEYS = [
  "whatsapp_order_number",
  "whatsapp_social_url",
  "facebook_url",
  "instagram_url",
  "tiktok_url",
  "phone_1",
  "phone_2",
  "phone_3",
  "restaurant_address",
  "delivery_enabled",
  "pickup_enabled",
  "points_per_100_egp",
  "point_value_egp",
  "max_points_discount_pct",
  "stat_customers",
  "stat_years",
  "working_hours",
  "is_ordering_open",
] as const;

export async function saveSettings(formData: FormData) {
  const supabase = await createServerClient();

  const upserts = SETTINGS_KEYS.map((key) => ({
    key,
    value: (formData.get(key) as string | null) ?? "",
  }));

  const { error } = await supabase.from("settings").upsert(upserts, {
    onConflict: "key",
  });

  if (error) {
    throw new Error(`Failed to save settings: ${error.message}`);
  }

  // Invalidate the cross-request settings cache so all pages pick up new values
  revalidateTag("settings", "default");
  revalidatePath("/admin/settings");
  revalidatePath("/");
}
