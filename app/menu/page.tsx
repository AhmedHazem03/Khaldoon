import { createServerClient } from "@/lib/supabase-server";
import { getSettings } from "@/lib/settings";
import MenuClient from "./MenuClient";
import type { Category, Product, ActiveProductOffer } from "@/types/app";

export const metadata = {
  title: "المنيو | مطعم خلدون",
  description: "تصفح قائمة طعام مطعم خلدون — مأكولات شامية وشرقية أصيلة",
  openGraph: {
    title: "المنيو | مطعم خلدون",
    description: "تصفح قائمة طعام مطعم خلدون — مأكولات شامية وشرقية أصيلة",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "منيو مطعم خلدون" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "المنيو | مطعم خلدون",
    description: "تصفح قائمة طعام مطعم خلدون — مأكولات شامية وشرقية أصيلة",
  },
};

export default async function MenuPage() {
  const [supabase, settings] = await Promise.all([
    createServerClient(),
    getSettings(),
  ]);

  const [{ data: categories }, { data: products }, { data: offerProducts }] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("is_visible", true)
      .order("order_index"),
    supabase
      .from("products")
      .select("*, product_variants(*)")
      .eq("is_available", true)
      .order("order_index"),
    supabase
      .from("offer_products")
      .select("product_id, offers!inner(id, benefit_type, benefit_value, expires_at, is_active)")
      .eq("offers.is_active", true),
  ]);

  // Build map: product_id → first active non-coupon offer
  const now = new Date();
  const productOfferMap = new Map<string, ActiveProductOffer>();
  for (const row of offerProducts ?? []) {
    const offer = Array.isArray(row.offers) ? row.offers[0] : row.offers;
    if (!offer) continue;
    if (offer.expires_at && new Date(offer.expires_at) < now) continue;
    if (productOfferMap.has(row.product_id)) continue; // first offer wins
    productOfferMap.set(row.product_id, {
      offerId: offer.id,
      type: offer.benefit_type as ActiveProductOffer["type"],
      value: offer.benefit_value,
    });
  }

  const whatsappUrl = `https://wa.me/${settings.whatsapp_order_number}`;

  return (
    <MenuClient
      categories={(categories as Category[]) ?? []}
      products={(products as Product[]) ?? []}
      productOfferMap={productOfferMap}
      whatsappUrl={whatsappUrl}
    />
  );
}
