"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Offer } from "@/types/app";
import { getImageUrl } from "@/lib/images";

interface Props {
  offers: Offer[];
}

function getOfferBadge(offer: Offer) {
  switch (offer.benefit_type) {
    case "discount_pct":
      return `${offer.benefit_value}% خصم`;
    case "discount_fixed":
      return `${offer.benefit_value} جنيه خصم`;
    case "points_multiplier":
      return `${offer.benefit_value}x نقاط`;
    case "coupon_pct":
      return `كوبون ${offer.benefit_value}%`;
    case "coupon_fixed":
      return `كوبون ${offer.benefit_value} جنيه`;
    default:
      return "عرض خاص";
  }
}

function getOfferMeta(offer: Offer) {
  if (offer.coupon_code) {
    return `استخدم كود ${offer.coupon_code}`;
  }

  if (offer.expires_at) {
    const expiry = new Date(offer.expires_at);

    if (!Number.isNaN(expiry.getTime())) {
      return `حتى ${new Intl.DateTimeFormat("ar-EG", {
        day: "numeric",
        month: "short",
      }).format(expiry)}`;
    }
  }

  return "لفترة محدودة";
}

function getOfferHeadline(offer: Offer) {
  const firstProductName = offer.offer_products?.find((item) => item.products?.name)?.products?.name;

  return offer.title?.trim() || firstProductName || (offer.coupon_code ? `كوبون ${offer.coupon_code}` : "عرض خلدون");
}

function getOfferSubheadline(offer: Offer) {
  const linkedProducts = offer.offer_products
    ?.map((item) => item.products?.name)
    .filter((name): name is string => Boolean(name)) ?? [];

  if (linkedProducts.length > 0) {
    const visibleProducts = linkedProducts.slice(0, 2).join(" + ");
    return linkedProducts.length > 2 ? `${visibleProducts} وأكثر` : visibleProducts;
  }

  if (offer.benefit_type === "display_only") {
    return "عرض خاص على أصناف مختارة";
  }

  return getOfferMeta(offer);
}

export default function OffersCarousel({ offers }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance every 3 seconds when more than one offer
  useEffect(() => {
    if (offers.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % offers.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [offers.length]);

  // Scroll only the carousel container horizontally — never affects page vertical scroll
  useEffect(() => {
    const container = containerRef.current;
    const item = itemRefs.current[currentIndex];
    if (!container || !item) return;

    const containerRect = container.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const offset = itemRect.left - containerRect.left + container.scrollLeft;
    container.scrollTo({ left: offset, behavior: "smooth" });
  }, [currentIndex]);

  return (
    <div className="space-y-4">
      <div ref={containerRef} className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 sm:gap-4">
        {offers.map((offer, index) => {
          const imageUrl = getImageUrl(offer.image_url, 900, 680);
          const isActive = index === currentIndex;

          return (
            <article
              key={offer.id}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              className={`group relative w-[84vw] max-w-[330px] flex-shrink-0 snap-center overflow-hidden rounded-[1.5rem] border bg-[#102736] transition-all duration-500 sm:w-[320px] ${
                isActive
                  ? "scale-100 border-white/24 shadow-[0_24px_44px_rgba(0,0,0,0.28)]"
                  : "scale-[0.985] border-white/10 opacity-88"
              }`}
            >
              <div className="relative h-[20rem] sm:h-[21rem]">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={offer.title ?? "عرض"}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 640px) 82vw, 320px"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#f9d7a6_0%,#e4570f_34%,#0f293e_100%)]" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-[#07131c] via-[#07131c]/24 to-transparent" />
                <div className="absolute inset-x-0 top-0 p-3">
                  <div className="flex flex-wrap items-start gap-2">
                    <span className="inline-flex min-h-8 items-center rounded-full bg-[#fff1e3] px-3 text-[10px] font-black text-[#8b3b09] shadow-sm">
                      {getOfferBadge(offer)}
                    </span>
                    <span className="inline-flex min-h-8 items-center rounded-full border border-white/12 bg-black/20 px-3 text-[10px] font-bold text-white/84 backdrop-blur-sm">
                      {getOfferMeta(offer)}
                    </span>
                  </div>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                  <div className="rounded-[1.25rem] border border-white/10 bg-[linear-gradient(180deg,rgba(7,19,28,0.24),rgba(7,19,28,0.92))] p-4 backdrop-blur-sm">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-[10px] font-black tracking-[0.18em] text-[#ffbf96]">
                        OFFER {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
                    </div>

                    <h3 className="text-xl font-black leading-8 text-white">
                      {getOfferHeadline(offer)}
                    </h3>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-medium text-white/70">
                        {getOfferSubheadline(offer)}
                      </p>
                      <Link
                        href={`/offers/${offer.id}`}
                        className="shrink-0 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[#ffd2b3]/35 bg-[linear-gradient(135deg,#ff7a2f_0%,#e4570f_60%,#b93c00_100%)] px-3.5 py-2 text-[10px] font-black text-white shadow-[0_8px_20px_rgba(228,87,15,0.45)] ring-1 ring-white/20 transition-transform duration-300 hover:scale-105"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-white/90" aria-hidden />
                        اطلب الآن
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {offers.length > 1 && (
        <div className="flex items-center justify-center gap-2">
          {offers.map((offer, index) => (
            <span
              key={offer.id}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex ? "w-7 bg-accent" : "w-2 bg-white/35"
              }`}
              aria-hidden
            />
          ))}
        </div>
      )}
    </div>
  );
}
