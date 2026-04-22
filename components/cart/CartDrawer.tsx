"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import BottomSheet from "@/components/ui/BottomSheet";
import CartItemRow from "@/components/cart/CartItem";
import { useCartStore } from "@/stores/cart";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="سلة الطلبات">
      <div className="flex flex-col">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
            <ShoppingCart className="w-12 h-12" />
            <p className="text-sm">السلة فارغة</p>
          </div>
        ) : (
          <>
            <div className="px-4 divide-y divide-gray-100">
              {items.map((item) => (
                <CartItemRow
                  key={`${item.product_id}-${item.variant_id}`}
                  item={item}
                />
              ))}
            </div>

            <div className="px-4 pt-3 pb-2 border-t border-gray-100 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">المجموع</span>
              <span className="text-accent font-bold text-base">{subtotal} ج</span>
            </div>

            <div className="px-4 pb-6 pt-2">
              <Link
                href="/cart"
                onClick={onClose}
                className="flex items-center justify-center w-full min-h-[52px] rounded-xl bg-primary text-white font-bold text-base"
              >
                مراجعة الطلب
              </Link>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
