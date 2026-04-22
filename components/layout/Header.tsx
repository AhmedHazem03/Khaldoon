"use client";

import Link from "next/link";
import { ShoppingCart, UtensilsCrossed } from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Header() {
  const totalItems = useCartStore((state) => state.totalItems());
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isHome) {
      setScrolled(true);
      return;
    }
    const handler = () => setScrolled(window.scrollY > 60);
    // Set initial state
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [isHome]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-400 ${
        scrolled
          ? "bg-primary shadow-[0_2px_20px_rgba(26,26,46,0.3)] backdrop-blur-sm"
          : "bg-transparent"
      }`}
    >
      <div className="flex items-center justify-between px-4 h-14 max-w-2xl mx-auto">
        {/* Logo / Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 group"
          aria-label="مطعم خلدون — الرئيسية"
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors duration-300 ${
            scrolled ? "bg-accent/20" : "bg-white/10"
          }`}>
            <UtensilsCrossed className="w-4 h-4 text-accent" aria-hidden />
          </div>
          <span className="text-white font-black text-base tracking-wide leading-none">
            خلدون
            <span className="text-accent text-xs font-bold block leading-none -mt-0.5">
              واكسب
            </span>
          </span>
        </Link>

        {/* Cart */}
        <Link
          href="/cart"
          className="relative flex items-center justify-center w-11 h-11 rounded-full hover:bg-white/10 transition-colors active:scale-95"
          aria-label={`سلة الطلبات${totalItems > 0 ? ` — ${totalItems} صنف` : ""}`}
        >
          <ShoppingCart className="w-6 h-6 text-white" />
          {totalItems > 0 && (
            <span className="absolute -top-0.5 -left-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-accent text-white text-xs font-black px-1 leading-none shadow-md">
              {totalItems > 99 ? "99+" : totalItems}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}

