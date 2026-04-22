import Link from "next/link";

interface LoyaltySectionProps {
  isLoggedIn?: boolean;
}

export default function LoyaltySection({ isLoggedIn }: LoyaltySectionProps) {
  return (
    <section className="px-4 py-4 bg-background">
      <div className="relative rounded-3xl overflow-hidden">
        {/* Orange gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent via-[#e85a1a] to-[#c04d12]" />

        {/* Decorative radial glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />
        {/* Dot pattern overlay */}
        <div className="absolute inset-0 hero-dot-grid opacity-[0.08] pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 px-6 py-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-4 py-1.5 mb-5">
            <span className="text-lg leading-none" aria-hidden>🎁</span>
            <span className="text-white font-bold text-sm">برنامج واكسب للولاء</span>
          </div>

          {/* Headline */}
          <h2 className="text-white font-black text-3xl leading-tight mb-2">
            كل ما تاكل،
            <br />
            <span className="text-gold-shimmer">تكسب!</span>
          </h2>
          <p className="text-white/70 text-sm mb-8 leading-relaxed">
            كل طلب بيكسبك نقاط تتحوّل لخصومات حقيقية
          </p>

          {/* 3 Steps */}
          <div className="flex items-start justify-center gap-2 mb-8">
            {[
              { icon: "📱", step: "١", text: "سجّل رقمك" },
              { icon: "🍗", step: "٢", text: "اطلب وأكل" },
              { icon: "🎁", step: "٣", text: "اجمع واكسب" },
            ].map((item, i) => (
              <div key={item.step} className="flex-1 flex flex-col items-center gap-2 relative">
                {/* Connector arrow */}
                {i < 2 && (
                  <span className="absolute top-5 left-0 text-white/30 text-lg leading-none -translate-x-1/2" aria-hidden>
                    ←
                  </span>
                )}
                <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-2xl">
                  {item.icon}
                </div>
                <span className="text-white/50 text-[10px] font-bold">الخطوة {item.step}</span>
                <span className="text-white text-xs font-bold text-center leading-tight">{item.text}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          {!isLoggedIn && (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-white text-accent font-black text-base px-8 py-3.5 rounded-2xl
                shadow-[0_6px_24px_rgba(0,0,0,0.2)]
                hover:shadow-[0_10px_36px_rgba(0,0,0,0.3)]
                hover:-translate-y-0.5 active:scale-95 transition-all duration-300
                min-h-[52px]"
            >
              انضم لواكسب الآن
              <span className="text-xl leading-none" aria-hidden>←</span>
            </Link>
          )}
          {isLoggedIn && (
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 bg-white text-accent font-black text-base px-8 py-3.5 rounded-2xl
                shadow-[0_6px_24px_rgba(0,0,0,0.2)]
                hover:-translate-y-0.5 active:scale-95 transition-all duration-300
                min-h-[52px]"
            >
              عرض نقاطي
              <span className="text-xl leading-none" aria-hidden>🏆</span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
