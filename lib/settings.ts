import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase-server";
import type { Settings } from "@/types/app";

// Structural defaults — empty strings signal "not configured yet".
// Real values MUST come from the settings table (Constitution §V).
// Never put real phone numbers, WhatsApp numbers, or addresses here.
const DEFAULT_SETTINGS: Settings = {
  whatsapp_order_number: "",
  whatsapp_social_url: "",
  facebook_url: "",
  instagram_url: "",
  tiktok_url: "",
  phone_1: "",
  phone_2: "",
  phone_3: "",
  restaurant_address: "",
  delivery_enabled: "true",
  pickup_enabled: "true",
  points_per_100_egp: "1",
  point_value_egp: "0.5",
  max_points_discount_pct: "20",
  stat_customers: "",
  stat_years: "",
  working_hours: "",
  is_ordering_open: "true",
  // Homepage extras
  stat_followers: "",
  stat_delivery_time: "30",
  stat_rating: "4.9",
  stat_branches: "",
  established_year: "",
  brand_story: "",
  hero_video_url: "",
};

async function fetchSettings(): Promise<Settings> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("settings").select("key, value");

  if (error || !data) {
    return DEFAULT_SETTINGS;
  }

  const map: Partial<Settings> = {};
  for (const row of data) {
    (map as Record<string, string>)[row.key] = row.value;
  }

  return { ...DEFAULT_SETTINGS, ...map };
}

/**
 * Cached settings — cross-request cache via unstable_cache.
 * Invalidated with revalidateTag('settings') after every admin save.
 *
 * NOTE: Must use unstable_cache from 'next/cache', NOT React cache(),
 * because React cache() is per-request only and doesn't support revalidateTag.
 */
export const getSettings = unstable_cache(fetchSettings, ["settings"], {
  tags: ["settings"],
});
