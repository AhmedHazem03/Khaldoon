import { createServerClient } from "@/lib/supabase-server";
import { getSettings } from "@/lib/settings";
import OffersCarousel from "@/components/ui/OffersCarousel";
import HeroSection from "@/components/home/HeroSection";
import SocialProofBar from "@/components/home/SocialProofBar";
import MenuShowcase from "@/components/home/MenuShowcase";
import LoyaltySection from "@/components/home/LoyaltySection";
import BrandStory from "@/components/home/BrandStory";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import type { Offer, Category } from "@/types/app";

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

  const [{ data: offersData }, { data: categoriesData }] = await Promise.all([
    supabase.from("offers").select("*").eq("is_active", true).order("order_index"),
    supabase.from("categories").select("*").eq("is_visible", true).order("order_index"),
  ]);

  const isOrderingOpen = settings.is_ordering_open !== "false";
  const activeOffers = (offersData as Offer[]) ?? [];
  const visibleCategories = (categoriesData as Category[]) ?? [];

  // ── Build Social Proof stats from settings ──────────────────────────────
  const proofStats = [
    settings.stat_followers && {
      icon: "📱",
      numericValue: parseInt(settings.stat_followers.replace(/[^\d]/g, ""), 10) || 0,
      suffix: "K+",
      label: "متابع",
    },
    {
      icon: "⭐",
      numericValue: parseFloat(settings.stat_rating || "4.9"),
      decimals: 1,
      suffix: "/5",
      label: "تقييم",
    },
    {
      icon: "🛵",
      numericValue: parseInt(settings.stat_delivery_time || "30", 10),
      suffix: " دقيقة",
      label: "توصيل",
    },
    settings.stat_customers && {
      icon: "🍽️",
      numericValue: parseInt(settings.stat_customers.replace(/[^\d]/g, ""), 10) || 0,
      suffix: "+",
      label: "عميل سعيد",
    },
  ].filter(Boolean) as {
    icon: string;
    numericValue: number;
    decimals?: number;
    suffix: string;
    label: string;
  }[];

  return (
    <main className="overflow-x-hidden">

      {/* ══ 1. HERO ══════════════════════════════════════════════════════════ */}
      <HeroSection
        isOrderingOpen={isOrderingOpen}
        heroVideoUrl={settings.hero_video_url || undefined}
        establishedYear={settings.established_year || undefined}
      />

      {/* ══ 2. SOCIAL PROOF BAR ══════════════════════════════════════════════ */}
      <SocialProofBar stats={proofStats} />

      {/* ══ 3. OFFERS CAROUSEL ═══════════════════════════════════════════════ */}
      {activeOffers.length > 0 && (
        <section className="py-10 bg-background">
          <div className="flex items-center justify-between px-4 mb-5">
            <div>
              <span className="text-accent text-xs font-bold tracking-widest uppercase block mb-1">
                لفترة محدودة
              </span>
              <h2 className="text-xl font-black text-text">العروض الحصرية</h2>
            </div>
            <span className="text-xs text-accent font-bold bg-accent/10 px-3 py-1.5 rounded-full border border-accent/20">
              {activeOffers.length} عرض
            </span>
          </div>
          <div className="px-4">
            <OffersCarousel offers={activeOffers} />
          </div>
        </section>
      )}

      {/* ══ 4. MENU SHOWCASE ═════════════════════════════════════════════════ */}
      <MenuShowcase categories={visibleCategories} />

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
