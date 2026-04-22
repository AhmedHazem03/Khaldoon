"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Offer } from "@/types/app";
import { getImageUrl } from "@/lib/images";

interface Props {
  offers: Offer[];
}

export default function OffersCarousel({ offers }: Props) {
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance every 3 seconds when more than one offer
  useEffect(() => {
    if (offers.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % offers.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [offers.length]);

  // Scroll active item into view — RTL-safe via scrollIntoView
  useEffect(() => {
    itemRefs.current[currentIndex]?.scrollIntoView({
      inline: "start",
      behavior: "smooth",
      block: "nearest",
    });
  }, [currentIndex]);

  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2">
      {offers.map((offer, index) => {
        const imageUrl = getImageUrl(offer.image_url, 600);

        return (
          <div
            key={offer.id}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            className="flex-shrink-0 snap-start w-72 rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100"
          >
            {imageUrl ? (
              <div className="relative w-full h-40">
                <Image
                  src={imageUrl}
                  alt={offer.title ?? "عرض"}
                  fill
                  className="object-cover"
                  sizes="288px"
                />
              </div>
            ) : (
              <div className="w-full h-40 bg-accent/10 flex items-center justify-center">
                <span className="text-accent font-bold text-lg">عرض خاص</span>
              </div>
            )}

            {offer.title && (
              <div className="p-3">
                <p className="font-semibold text-text text-sm">{offer.title}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
