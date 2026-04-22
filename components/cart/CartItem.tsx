"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useCartStore } from "@/stores/cart";
import type { CartItem } from "@/types/app";
import { getImageUrl } from "@/lib/images";

interface CartItemProps {
  item: CartItem;
}

export default function CartItemRow({ item }: CartItemProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const imageUrl = getImageUrl(item.image_url, 128, 128);

  return (
    <div className="flex items-center gap-3 py-3">
      {/* Thumbnail */}
      {imageUrl ? (
        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
          <Image src={imageUrl} alt={item.product_name} fill className="object-cover" sizes="64px" />
        </div>
      ) : (
        <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-2xl shrink-0">
          🍽️
        </div>
      )}

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-text leading-tight">{item.product_name}</p>
        {item.variant_name && (
          <p className="text-xs text-gray-500 mt-0.5">{item.variant_name}</p>
        )}
        <p className="text-accent font-bold text-sm mt-1">
          {item.unit_price * item.quantity} ج
        </p>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity - 1)}
          className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 hover:border-accent hover:text-accent transition-colors"
          aria-label="تقليل الكمية"
        >
          {item.quantity === 1 ? (
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          ) : (
            <Minus className="w-3.5 h-3.5" />
          )}
        </button>

        <span className="w-7 text-center text-sm font-bold">{item.quantity}</span>

        <button
          onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity + 1)}
          className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 hover:border-accent hover:text-accent transition-colors"
          aria-label="زيادة الكمية"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
