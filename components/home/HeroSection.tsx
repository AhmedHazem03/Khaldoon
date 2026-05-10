"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface HeroSectionProps {
  isOrderingOpen: boolean;
  heroVideoUrl?: string;
  establishedYear?: string;
}

export default function HeroSection({
  isOrderingOpen,
  heroVideoUrl,
  establishedYear,
}: HeroSectionProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Small delay to trigger CSS fade-up animation after hydration
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden bg-accent">

      {/* ── Video background ── */}
      {heroVideoUrl && (
        <video
          src={heroVideoUrl}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-25"
        />
      )}

      {/* ── Overlay gradient ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent/90 via-accent/85 to-accent pointer-events-none" />

      {/* ── Animated dot grid ── */}
      <div className="absolute inset-0 hero-dot-grid opacity-[0.04] pointer-events-none" />

      {/* ── Glow blobs ── */}
      <div className="absolute top-[-80px] right-[-80px] w-[380px] h-[380px] bg-accent/25 rounded-full blur-[100px] pointer-events-none animate-hero-glow" />
      <div className="absolute bottom-[-40px] left-[-40px] w-[260px] h-[260px] bg-[#0f293e]/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[60px] pointer-events-none" />

      {/* ── Main content ── */}
      <div
        className={`relative z-10 flex flex-col items-center text-center px-6 pt-16 pb-32 w-full max-w-md mx-auto
          transition-all duration-700 ease-out
          ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        {/* Trust badge */}
        <div
          className={`inline-flex items-center gap-2 glass-card rounded-full px-5 py-2 mb-6
            transition-all duration-700 delay-100
            ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <span className="flex gap-0.5 text-yellow-400 text-xs leading-none">★★★★★</span>
          <span className="text-white text-sm font-medium">الأفضل تقييماً في سوهاج</span>
        </div>

        {/* Headline */}
        <h1
          className={`text-[3.5rem] font-black text-white leading-[1.08] mb-3 tracking-tight whitespace-nowrap
            transition-all duration-700 delay-200
            ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          أصل{" "}<span className="relative text-[#0f293e] inline-block">السوري<span className="relative text-white border-b-[3px] border-[#0f293e] inline-block pb-0.5" /></span>{" "}هون
        </h1>

        {/* Sub-headline */}
        <p
          className={`text-white text-base font-semibold mb-1
            transition-all duration-700 delay-300
            ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          طعم ما بيُنسى{establishedYear ? ` منذ ${establishedYear}` : ""}
        </p>
        <p
          className={`text-white/85 text-sm leading-relaxed mb-10 max-w-[270px]
            transition-all duration-700 delay-400
            ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          نكهات شامية أصيلة مطبوخة بحب —<br />
          بتوصلك طازجة وحارّة على بابك
        </p>

        {/* CTA buttons */}
        <div
          className={`flex flex-col gap-3 w-full max-w-[290px]
            transition-all duration-700 delay-500
            ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          {isOrderingOpen ? (
            <>
              {/* Primary CTA */}
              <div className="relative">
                <span className="absolute inset-0 rounded-2xl bg-[#0f293e]/35 animate-pulse-ring pointer-events-none" />
                <Link
                  href="/menu"
                  className="relative flex items-center justify-center gap-3 bg-[#0f293e] text-white font-black text-xl w-full py-4 rounded-2xl
                    shadow-[0_8px_32px_rgba(15,41,62,0.35)]
                    hover:shadow-[0_14px_48px_rgba(15,41,62,0.5)]
                    hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-300
                    min-h-[56px]"
                >
                  اطلب دلوقتي
                  <span className="text-2xl leading-none" aria-hidden>🚀</span>
                </Link>
              </div>

              
             
            </>
          ) : (
            <div className="flex items-center justify-center gap-2.5 glass-card text-white font-semibold px-8 py-4 rounded-2xl">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse shrink-0" />
              المطعم مغلق حالياً
            </div>
          )}
        </div>

        {/* Scroll indicator */}
        <div className="mt-12 flex flex-col items-center gap-1.5">
          <span className="text-white text-[10px] tracking-widest uppercase">scroll</span>
          <div className="w-5 h-9 border border-white rounded-full flex justify-center pt-1.5">
            <div className="w-1 h-2.5 bg-white rounded-full animate-scroll-bounce" />
          </div>
        </div>
      </div>

    </section>
  );
}
