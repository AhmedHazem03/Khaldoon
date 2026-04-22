"use client";

import Link from "next/link";
import { useState } from "react";
import type { Category } from "@/types/app";

interface MenuShowcaseProps {
  categories: Category[];
}

export default function MenuShowcase({ categories }: MenuShowcaseProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const filtered =
    activeId === null
      ? categories
      : categories.filter((c) => c.id === activeId);

  if (!categories.length) return null;

  return (
    <section className="px-4 py-10 bg-background">
      {/* Section heading */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex flex-col gap-1">
          <span className="text-accent text-xs font-bold tracking-widest uppercase">
            قائمة الطعام
          </span>
          <h2 className="section-heading text-2xl font-black text-text">
            تصفح المنيو
          </h2>
        </div>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gold/30 to-transparent" />
        <Link
          href="/menu"
          className="text-sm text-accent font-bold shrink-0 hover:underline"
        >
          الكل ←
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 mb-4 -mx-1 px-1">
        <button
          onClick={() => setActiveId(null)}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 min-h-[40px] ${
            activeId === null
              ? "bg-primary text-white shadow-md"
              : "bg-white border border-gray-200 text-text/70 hover:border-accent/50"
          }`}
        >
          الكل
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveId(cat.id === activeId ? null : cat.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 min-h-[40px] ${
              activeId === cat.id
                ? "bg-accent text-white shadow-md"
                : "bg-white border border-gray-200 text-text/70 hover:border-accent/50"
            }`}
          >
            {cat.icon && <span className="text-base leading-none">{cat.icon}</span>}
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Featured card (first in list) — full width */}
      {filtered[0] && (
        <Link
          href={`/menu?category=${filtered[0].id}`}
          className="group flex items-center gap-4 bg-gradient-to-l from-primary to-primary/85 rounded-3xl px-6 py-5 mb-3
            shadow-[0_8px_32px_rgba(26,26,46,0.25)]
            hover:shadow-[0_14px_40px_rgba(26,26,46,0.35)]
            hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 overflow-hidden relative"
        >
          {/* Glow accent */}
          <div className="absolute top-0 left-0 w-36 h-36 bg-accent/15 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute top-0 right-0 w-24 h-24 bg-gold/10 rounded-full blur-xl translate-x-1/2 -translate-y-1/2" />

          {filtered[0].icon && (
            <span
              className="relative z-10 text-5xl group-hover:scale-110 transition-transform duration-300 shrink-0"
              aria-hidden
            >
              {filtered[0].icon}
            </span>
          )}
          <div className="relative z-10 flex-1">
            <span className="inline-flex items-center gap-1 text-gold text-xs font-bold mb-1">
              <span>⭐</span> الأكثر طلباً
            </span>
            <p className="text-white font-black text-xl leading-tight">{filtered[0].name}</p>
            <p className="text-white/45 text-xs mt-1">اضغط لتصفح الأصناف ←</p>
          </div>
          {/* Arrow */}
          <span className="relative z-10 text-white/30 text-2xl group-hover:text-accent group-hover:translate-x-[-4px] transition-all duration-300" aria-hidden>←</span>
        </Link>
      )}

      {/* Rest — 3-column grid */}
      {filtered.length > 1 && (
        <div className="grid grid-cols-3 gap-2.5">
          {filtered.slice(1).map((cat, idx) => (
            <Link
              key={cat.id}
              href={`/menu?category=${cat.id}`}
              className={`group flex flex-col items-center justify-center gap-2.5
                bg-white rounded-2xl p-4 min-h-[110px]
                border border-gray-100
                shadow-sm hover:shadow-lg hover:border-accent/30
                hover:-translate-y-0.5 active:scale-95
                transition-all duration-300 overflow-hidden relative
                animate-card-rise ${
                  idx === 0 ? "delay-100" :
                  idx === 1 ? "delay-200" :
                  idx === 2 ? "delay-300" : "delay-400"
                }`}
            >
              {/* Hover tint */}
              <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/[0.04] transition-colors rounded-2xl" />
              {cat.icon && (
                <div className="relative z-10 w-[52px] h-[52px] rounded-xl bg-accent/8 flex items-center justify-center group-hover:bg-accent/15 transition-colors">
                  <span
                    className="text-[1.9rem] group-hover:scale-110 transition-transform duration-200"
                    aria-hidden
                  >
                    {cat.icon}
                  </span>
                </div>
              )}
              <span className="relative z-10 text-xs font-bold text-text text-center leading-tight line-clamp-2">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* View all CTA */}
      <Link
        href="/menu"
        className="mt-5 flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl
          border-2 border-primary/20 text-primary font-bold text-sm
          hover:bg-primary hover:text-white hover:border-primary
          transition-all duration-300 active:scale-[0.98]"
      >
        عرض المنيو الكامل
        <span aria-hidden>←</span>
      </Link>
    </section>
  );
}
