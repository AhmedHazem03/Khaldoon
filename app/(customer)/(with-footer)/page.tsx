import { createServerClient } from "@/lib/supabase-server";
import { getSettings } from "@/lib/settings";
import OffersCarousel from "@/components/ui/OffersCarousel";
import HeroSection from "@/components/home/HeroSection";
import MenuShowcase from "@/components/home/MenuShowcase";
import LoyaltySection from "@/components/home/LoyaltySection";
import BrandStory from "@/components/home/BrandStory";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import type { Offer, Category, Product } from "@/types/app";

export const metadata = {
  title: "مطعم خلدون | أصل السوري هون",
  description: "اطلب أشهى المأكولات من مطعم خلدون — نكهات شامية أصيلة وتوصيل سريع",
  openGraph: {
    title: "مطعم خلدون | أصل السوري هون",
    description: "اطلب أشهى المأكولات من مطعم خلدون — نكهات شامية أصيلة وتوصيل سريع",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "مطعم خلدون" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "مطعم خلدون | أصل السوري هون",
    description: "اطلب أشهى المأكولات من مطعم خلدون — نكهات شامية أصيلة وتوصيل سريع",
  },
};

export default async function HomePage() {
  const [settings, supabase] = await Promise.all([
    getSettings(),
    createServerClient(),
  ]);

  const [{ data: offersData }, { data: categoriesData }, { data: productsData }] = await Promise.all([
    supabase
      .from("offers")
      .select("*, offer_products(id, product_id, order_index, products(id, name, image_url))")
      .eq("is_active", true)
      .order("order_index"),
    supabase.from("categories").select("*").eq("is_visible", true).order("order_index"),
    supabase.from("products").select("*, product_variants(*)").eq("is_available", true).order("order_index"),
  ]);

  const isOrderingOpen = settings.is_ordering_open !== "false";
  const activeOffers = (offersData as Offer[]) ?? [];
  const visibleCategories = (categoriesData as Category[]) ?? [];
  const products = (productsData as Product[]) ?? [];
  const whatsappUrl = `https://wa.me/${settings.whatsapp_order_number}`;

  // ── Build Social Proof stats from settings ──────────────────────────────
   

  return (
    <main className="overflow-x-hidden">

      {/* ══ 1. HERO ══════════════════════════════════════════════════════════ */}
      <HeroSection
        isOrderingOpen={isOrderingOpen}
        heroVideoUrl={settings.hero_video_url || undefined}
        establishedYear={settings.established_year || undefined}
      />

      

      {/* ══ 3. OFFERS CAROUSEL ═══════════════════════════════════════════════ */}
      {activeOffers.length > 0 && (
        <section className="relative isolate overflow-hidden bg-[#081723] py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(242,101,34,0.22),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_24%)]" />

          <div className="relative mx-auto max-w-6xl px-4">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,#0c2233_0%,#081723_100%)] shadow-[0_24px_60px_rgba(3,10,18,0.34)]">
              <div className="px-3 py-4 sm:px-4 sm:py-5">
                <OffersCarousel offers={activeOffers} />
              </div>
            </div>
          </div>
        </section>
      )}
      {/* ══ 4. MENU SHOWCASE ═════════════════════════════════════════════════ */}
      <MenuShowcase categories={visibleCategories} products={products} whatsappUrl={whatsappUrl} />

      {/* ══ 5. WAKSEB LOYALTY ════════════════════════════════════════════════ */}
      <LoyaltySection />

      {/* ══ 6. BRAND STORY ══════════════════════════════════════════════════ */}
      <BrandStory
        brandStory={settings.brand_story || undefined}
        establishedYear={settings.established_year || undefined}
      />

      {/* ══ 7. TESTIMONIALS ═════════════════════════════════════════════════ */}
      <TestimonialsSection />

      {/* Bottom spacing for floating elements */}
      <div className="h-6 bg-background" />
    </main>
  );
}
