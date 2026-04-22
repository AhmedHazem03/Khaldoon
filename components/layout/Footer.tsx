import Link from "next/link";
import { Phone, MapPin, Clock } from "lucide-react";
import SocialLinks from "@/components/ui/SocialLinks";
import { getSettings } from "@/lib/settings";

export default async function Footer() {
  const settings = await getSettings();

  const phones = [settings.phone_1, settings.phone_2, settings.phone_3].filter(Boolean);
  const deliveryEnabled = settings.delivery_enabled !== "false";
  const pickupEnabled = settings.pickup_enabled !== "false";

  return (
    <>
      {/* ══ Order CTA Banner ═══════════════════════════════════════════════ */}
      <section className="relative bg-primary overflow-hidden">
        {/* Dark texture overlay */}
        <div className="absolute inset-0 hero-dot-grid opacity-[0.05] pointer-events-none" />
        {/* Orange glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 max-w-md mx-auto px-4 py-14 text-center">
          {/* Hunger badge */}
          <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/30 rounded-full px-4 py-1.5 mb-5">
            <span className="text-base leading-none" aria-hidden>🔥</span>
            <span className="text-accent font-bold text-sm">جاهزين دايماً</span>
          </div>

          <h2 className="text-white font-black text-4xl leading-tight mb-3">
            جوعان؟
            <br />
            <span className="text-accent">خلدون جاهز!</span>
          </h2>
          <p className="text-white/50 text-sm mb-8 leading-relaxed">
            اطلب دلوقتي والأكل يوصلك طازج وساخن
          </p>

          {/* Order buttons */}
          <div className="flex gap-3 justify-center flex-wrap">
            {deliveryEnabled && (
              <Link
                href="/menu"
                className="flex items-center gap-2 bg-accent text-white font-black text-base px-6 py-3.5 rounded-2xl
                  shadow-[0_6px_24px_rgba(242,101,34,0.4)]
                  hover:shadow-[0_10px_36px_rgba(242,101,34,0.6)]
                  hover:-translate-y-0.5 active:scale-95 transition-all duration-300
                  min-h-[52px]"
              >
                <span aria-hidden>🛵</span>
                توصيل
              </Link>
            )}
            {pickupEnabled && (
              <Link
                href="/menu"
                className="flex items-center gap-2 bg-white/10 border-2 border-white/25 text-white font-bold text-base px-6 py-3.5 rounded-2xl
                  hover:bg-white/15 hover:border-white/40
                  active:scale-95 transition-all duration-300
                  min-h-[52px]"
              >
                <span aria-hidden>🏠</span>
                استلام من الفرع
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ══ Footer info ═════════════════════════════════════════════════════ */}
      <footer className="bg-[#0f0f20] text-white pt-8 pb-6">
        <div className="max-w-2xl mx-auto px-4 space-y-5">

          {/* Brand */}
          <div className="text-center">
            <p className="font-black text-xl text-white mb-0.5">مطعم خلدون</p>
            <p className="text-white/40 text-xs">أصل السوري هون</p>
          </div>

          {/* Gold divider */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gold/30" />
            <span className="text-gold text-sm" aria-hidden>✦</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gold/30" />
          </div>

          {/* Quick links */}
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2" aria-label="روابط سريعة">
            {[
              { href: "/menu", label: "المنيو" },
              { href: "/cart", label: "السلة" },
              { href: "/login", label: "تسجيل الدخول" },
              { href: "/profile", label: "حسابي" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-white/50 text-sm hover:text-accent transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Social icons */}
          <div className="flex justify-center">
            <SocialLinks settings={settings} />
          </div>

          {/* Phone numbers */}
          {phones.length > 0 && (
            <div className="flex flex-col items-center gap-1 text-sm">
              {phones.map((phone) => (
                <a
                  key={phone}
                  href={`tel:${phone}`}
                  className="flex items-center gap-2 text-white/50 hover:text-accent transition-colors"
                >
                  <Phone className="w-4 h-4 shrink-0" />
                  <span dir="ltr">{phone}</span>
                </a>
              ))}
            </div>
          )}

          {/* Address */}
          {settings.restaurant_address && (
            <div className="flex items-start justify-center gap-2 text-sm text-white/50 text-center">
              <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{settings.restaurant_address}</span>
            </div>
          )}

          {/* Working hours */}
          {settings.working_hours && (
            <div className="flex items-start justify-center gap-2 text-sm text-white/50 text-center">
              <Clock className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{settings.working_hours}</span>
            </div>
          )}

          {/* Copyright */}
          <p className="text-center text-xs text-white/25 pt-2">
            © {new Date().getFullYear()} مطعم خلدون — جميع الحقوق محفوظة
          </p>
        </div>
      </footer>
    </>
  );
}

