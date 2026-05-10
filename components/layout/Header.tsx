"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, UserCircle } from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Header() {
  const totalItems = useCartStore((state) => state.totalItems());
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(!isHome);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const isTransparentOnHero = isHome && !scrolled;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#D85714] shadow-[0_2px_20px_rgba(216,87,20,0.42)] backdrop-blur-sm"
          : "bg-gradient-to-t from-[#F47A2A]/95 via-[#D85714]/80 to-[#8F340B]/35"
      }`}
    >
  <div className="flex items-center justify-between px-4 h-14 max-w-2xl mx-auto">

    <Link href="/" className="flex items-center" aria-label="مطعم خلدون — الرئيسية">
      <Image
        src="/logos/logo khaldon-02.png"
        alt="مطعم خلدون"
        width={80}
        height={35}
        className="h-28 w-auto object-contain"
        priority
      />
    </Link>

    <div className="flex items-center gap-1">
      <Link
        href="/profile"
        className={`flex items-center justify-center w-11 h-11 rounded-full transition-colors active:scale-95 ${
          isTransparentOnHero ? "hover:bg-white/15" : "hover:bg-white/10"
        }`}
        aria-label="حسابي"
      >
        <UserCircle className="w-6 h-6 text-white" />
      </Link>

      <Link
        href="/cart"
        className={`relative flex items-center justify-center w-11 h-11 rounded-full transition-colors active:scale-95 ${
          isTransparentOnHero ? "hover:bg-white/15" : "hover:bg-white/10"
        }`}
        aria-label={`سلة الطلبات${mounted && totalItems > 0 ? ` — ${totalItems} صنف` : ""}`}
      >
        <ShoppingCart className="w-6 h-6 text-white" />
        {mounted && totalItems > 0 && (
          <span className="absolute -top-0.5 -left-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-accent text-white text-xs font-black px-1 leading-none shadow-md">
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        )}
      </Link>
    </div>

  </div>
</header>
  );
}

