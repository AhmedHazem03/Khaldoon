"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, MessageCircle } from "lucide-react";
import BottomSheet from "@/components/ui/BottomSheet";
import VariantSelector from "@/components/menu/VariantSelector";
import { useCartStore } from "@/stores/cart";
import type { Product, ProductVariant, ActiveProductOffer } from "@/types/app";
import { getImageUrl } from "@/lib/images";

interface ProductCardProps {
  product: Product;
  activeOffer?: ActiveProductOffer;
  whatsappUrl: string;
}

export default function ProductCard({ product, activeOffer, whatsappUrl }: ProductCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.product_variants?.[0] ?? null
  );
  const addItem = useCartStore((s) => s.addItem);

  const variants = product.product_variants ?? [];
  const hasVariants = variants.length > 0;

  const displayPrice = hasVariants
    ? (selectedVariant?.price ?? variants[0]?.price ?? 0)
    : (product.base_price ?? 0);

  // Calculate discounted price from active offer
  const discountedPrice = (() => {
    if (!activeOffer) return null;
    if (activeOffer.type === "discount_pct") {
      return Math.floor(displayPrice * (1 - activeOffer.value / 100));
    } else if (activeOffer.type === "discount_fixed") {
      return Math.max(0, displayPrice - Math.floor(activeOffer.value));
    }
    return null; // points_multiplier — no price change
  })();

  // Parse description into chips (comma-separated)
  const chips = product.description
    ? product.description.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  function handleAddToCart() {
    if (hasVariants && !selectedVariant) {
      setSheetOpen(true);
      return;
    }
    commitAdd(selectedVariant);
  }

  function commitAdd(variant: ProductVariant | null) {
    const basePrice = variant?.price ?? product.base_price ?? 0;
    const offerPrice = (() => {
      if (!activeOffer) return basePrice;
      if (activeOffer.type === "discount_pct") return Math.floor(basePrice * (1 - activeOffer.value / 100));
      if (activeOffer.type === "discount_fixed") return Math.max(0, basePrice - Math.floor(activeOffer.value));
      return basePrice;
    })();
    addItem({
      product_id: product.id,
      product_name: product.name,
      variant_id: variant?.id ?? null,
      variant_name: variant?.variant_name ?? null,
      unit_price: offerPrice,
      quantity: 1,
      image_url: product.image_url,
    });
    setSheetOpen(false);
  }

  const imageUrl = getImageUrl(product.image_url, 400);

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Image */}
        {imageUrl ? (
          <div className="relative w-full aspect-[4/3] bg-gray-100">
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 33vw"
            />
            {/* Offer badge */}
            {activeOffer && (
              <div className="absolute top-2 right-2 bg-accent text-white text-xs font-bold rounded-full px-2 py-0.5 shadow">
                {activeOffer.type === "discount_pct" && `${activeOffer.value}%−`}
                {activeOffer.type === "discount_fixed" && `−${activeOffer.value}ج`}
                {activeOffer.type === "points_multiplier" && `×${activeOffer.value} نقاط`}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full aspect-[4/3] bg-gray-100 flex items-center justify-center text-4xl">
            🍽️
          </div>
        )}

        {/* Content */}
        <div className="p-3 flex flex-col gap-2 flex-1">
          <h3 className="font-bold text-text text-sm leading-snug">{product.name}</h3>

          {/* Description chips */}
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="bg-orange-50 text-orange-700 rounded-full px-2 py-0.5 text-xs"
                >
                  {chip}
                </span>
              ))}
            </div>
          )}

          {/* Price */}
          {discountedPrice !== null ? (
            <div className="flex items-center gap-2 mt-auto">
              <span className="text-accent font-bold text-base">{discountedPrice} ج</span>
              <span className="text-gray-400 text-sm line-through">{displayPrice} ج</span>
            </div>
          ) : (
            <p className="text-accent font-bold text-base mt-auto">
              {displayPrice} ج
            </p>
          )}

          {/* CTA */}
          {product.cta_type === "whatsapp_inquiry" ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 min-h-[44px] rounded-xl bg-[#25D366] text-white text-sm font-semibold"
            >
              <MessageCircle className="w-4 h-4" />
              تواصل للاستفسار
            </a>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={!product.is_available}
              className="flex items-center justify-center gap-2 min-h-[44px] rounded-xl bg-accent text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {product.is_available ? "أضف للطلب" : "غير متاح"}
            </button>
          )}
        </div>
      </div>

      {/* Variant selector bottom sheet */}
      {hasVariants && (
        <BottomSheet
          isOpen={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title={product.name}
        >
          <div className="px-4 pb-6 pt-3 space-y-4">
            <p className="text-sm text-gray-500">اختر الحجم أو النوع</p>

            <VariantSelector
              variants={variants}
              selectedId={selectedVariant?.id ?? null}
              onSelect={setSelectedVariant}
            />

            {selectedVariant && (
              <div className="pt-2">
                <p className="text-accent font-bold text-xl text-center mb-3">
                  {selectedVariant.price} ج
                </p>
                <button
                  onClick={() => commitAdd(selectedVariant)}
                  className="w-full min-h-[52px] rounded-xl bg-accent text-white font-bold text-base"
                >
                  أضف للطلب
                </button>
              </div>
            )}
          </div>
        </BottomSheet>
      )}
    </>
  );
}
