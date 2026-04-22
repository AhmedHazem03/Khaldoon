import { createServerClient } from "@/lib/supabase-server";
import CartPageClient from "./CartPageClient";
import type { DeliveryZone } from "@/types/app";
import { getSettings } from "@/lib/settings";

export default async function CartPage() {
  const [supabase, settings] = await Promise.all([
    createServerClient(),
    getSettings(),
  ]);

  const { data: zones } = await supabase
    .from("delivery_zones")
    .select("*")
    .order("zone_name");

  return (
    <CartPageClient
      zones={(zones as DeliveryZone[]) ?? []}
      deliveryEnabled={settings.delivery_enabled === "true"}
      pickupEnabled={settings.pickup_enabled === "true"}
    />
  );
}
