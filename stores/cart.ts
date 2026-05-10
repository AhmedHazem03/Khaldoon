"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types/app";

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  couponDiscount: number;  // EGP discount from validated coupon
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId: string | null) => void;
  updateQuantity: (
    productId: string,
    variantId: string | null,
    quantity: number
  ) => void;
  updateItemPrice: (productId: string, variantId: string | null, newPrice: number) => void;
  clearCart: () => void;
  setCoupon: (code: string | null, discount: number) => void;
  totalItems: () => number;
  subtotal: () => number;
}

function isSameItem(
  a: CartItem,
  productId: string,
  variantId: string | null
): boolean {
  return a.product_id === productId && a.variant_id === variantId;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      couponDiscount: 0,
      addItem(item) {
        set((state) => {
          const existing = state.items.find((i) =>
            isSameItem(i, item.product_id, item.variant_id)
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                isSameItem(i, item.product_id, item.variant_id)
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        });
      },

      removeItem(productId, variantId) {
        set((state) => ({
          items: state.items.filter(
            (i) => !isSameItem(i, productId, variantId)
          ),
        }));
      },

      updateQuantity(productId, variantId, quantity) {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            isSameItem(i, productId, variantId) ? { ...i, quantity } : i
          ),
        }));
      },

      updateItemPrice(productId, variantId, newPrice) {
        set((state) => ({
          items: state.items.map((i) =>
            isSameItem(i, productId, variantId) ? { ...i, unit_price: newPrice } : i
          ),
        }));
      },

      clearCart() {
        set({ items: [], couponCode: null, couponDiscount: 0 });
      },

      setCoupon(code, discount) {
        set({ couponCode: code, couponDiscount: discount });
      },

      totalItems() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },

      subtotal() {
        return get().items.reduce(
          (sum, i) => sum + i.unit_price * i.quantity,
          0
        );
      },
    }),
    {
      name: "khaldoun-cart",
    }
  )
);
