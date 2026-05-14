"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import CategoryTabs from "@/components/menu/CategoryTabs";
import ProductCard from "@/components/menu/ProductCard";
import { getImageUrl } from "@/lib/images";
import type { Category, Product, ActiveProductOffer } from "@/types/app";

interface MenuClientProps {
  categories: Category[];
  products: Product[];
  productOfferMap: Map<string, ActiveProductOffer>;
  whatsappUrl: string;
}

export default function MenuClient({
  categories,
  products,
  productOfferMap,
  whatsappUrl,
}: MenuClientProps) {
  const searchParams = useSearchParams();
  const requestedCat = searchParams.get("category") ?? "";
  const validInitialCat = categories.some((c) => c.id === requestedCat)
    ? requestedCat
    : (categories[0]?.id ?? "");

  const [activeCatId, setActiveCatId] = useState(validInitialCat);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const didScrollRef = useRef(false);

  useEffect(() => {
    if (didScrollRef.current || !requestedCat) return;
    didScrollRef.current = true;
    sectionRefs.current[requestedCat]?.scrollIntoView({ behavior: "instant", block: "start" });
  }, [requestedCat]);

  function scrollToCategory(id: string) {
    setActiveCatId(id);
    sectionRefs.current[id]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  // Update active tab on scroll (IntersectionObserver)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveCatId(entry.target.id);
          }
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [categories]);

  return (
    <>
      <CategoryTabs
        categories={categories}
        activeId={activeCatId}
        onSelect={scrollToCategory}
      />

      <main className="max-w-2xl mx-auto px-3 pb-8">
        {categories.map((cat) => {
          const catProducts = products.filter(
            (p) => p.category_id === cat.id && p.is_available
          );
          if (catProducts.length === 0) return null;

          return (
            <section
              key={cat.id}
              id={cat.id}
              ref={(el: HTMLDivElement | null) => {
                sectionRefs.current[cat.id] = el;
              }}
              className="pt-6"
            >
              <h2 className="font-bold text-text text-base mb-3 flex items-center gap-2">
                {cat.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getImageUrl(cat.image_url, 80, 80) ?? ""}
                    alt={cat.name}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  />
                ) : cat.icon ? (
                  <span aria-hidden="true">{cat.icon}</span>
                ) : null}
                {cat.name}
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {catProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    activeOffer={productOfferMap.get(product.id)}
                    whatsappUrl={whatsappUrl}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </>
  );
}
