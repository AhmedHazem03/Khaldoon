"use client";

import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cart";
import type { CartItem } from "@/types/app";

interface OfferProduct {
  id: string;
  name: string;
  image_url: string | null;
  base_price: number | null;
  product_variants?: { id: string; variant_name: string; price: number; is_available: boolean }[];
}

interface Props {
  products: OfferProduct[];
  benefitType: string;
  benefitValue: number;
}

function getDiscountedPrice(price: number, benefitType: string, benefitValue: number): number {
  if (benefitType === "discount_pct") return price * (1 - benefitValue / 100);
  if (benefitType === "discount_fixed") return Math.max(0, price - benefitValue);
  return price;
}

export default function AddOfferToCartButton({ products, benefitType, benefitValue }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();

  function handleClick() {
    const itemsToAdd: CartItem[] = [];

    for (const product of products) {
      const availableVariants = product.product_variants?.filter((v) => v.is_available) ?? [];

      if (availableVariants.length > 0) {
        const variant = availableVariants[0];
        const unitPrice = getDiscountedPrice(variant.price, benefitType, benefitValue);
        itemsToAdd.push({
          product_id: product.id,
          product_name: product.name,
          variant_id: variant.id,
          variant_name: variant.variant_name,
          unit_price: Math.round(unitPrice * 100) / 100,
          quantity: 1,
          image_url: product.image_url,
        });
      } else if (product.base_price != null) {
        const unitPrice = getDiscountedPrice(product.base_price, benefitType, benefitValue);
        itemsToAdd.push({
          product_id: product.id,
          product_name: product.name,
          variant_id: null,
          variant_name: null,
          unit_price: Math.round(unitPrice * 100) / 100,
          quantity: 1,
          image_url: product.image_url,
        });
      }
    }

    for (const item of itemsToAdd) {
      addItem(item);
    }

    router.push("/checkout");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff7a2f_0%,#e4570f_60%,#b93c00_100%)] px-5 text-sm font-black text-white shadow-[0_12px_25px_rgba(228,87,15,0.40)] transition-transform duration-200 active:scale-95 sm:w-auto"
    >
      <span className="ml-1.5 h-2 w-2 rounded-full bg-white/80" aria-hidden />
      اطلب الآن
    </button>
  );
}
