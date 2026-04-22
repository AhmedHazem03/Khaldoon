"use client";

import type { ProductVariant } from "@/types/app";

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedId: string | null;
  onSelect: (variant: ProductVariant) => void;
}

export default function VariantSelector({
  variants,
  selectedId,
  onSelect,
}: VariantSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {variants.map((variant) => {
        const isSelected = variant.id === selectedId;
        const isDisabled = !variant.is_available;

        return (
          <button
            key={variant.id}
            onClick={() => !isDisabled && onSelect(variant)}
            disabled={isDisabled}
            className={`flex-shrink-0 px-4 min-h-[44px] rounded-xl text-sm font-semibold border transition-colors
              ${
                isDisabled
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  : isSelected
                  ? "bg-accent text-white border-accent"
                  : "bg-white text-text border-gray-300 hover:border-accent hover:text-accent"
              }`}
          >
            <span>{variant.variant_name}</span>
            {isSelected && (
              <span className="block text-xs font-bold mt-0.5">
                {variant.price} ج
              </span>
            )}
            {!isSelected && (
              <span className="block text-xs text-gray-500 mt-0.5">
                {variant.price} ج
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
