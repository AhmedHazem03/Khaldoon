"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import CartItemRow from "@/components/cart/CartItem";
import { useCartStore } from "@/stores/cart";
import type { DeliveryZone } from "@/types/app";

interface CartPageClientProps {
  zones: DeliveryZone[];
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
}

export default function CartPageClient({
  zones,
  deliveryEnabled,
  pickupEnabled,
}: CartPageClientProps) {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());

  const [orderType, setOrderType] = useState<"delivery" | "pickup">(
    deliveryEnabled ? "delivery" : "pickup"
  );
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");

  const activeZones = zones.filter((z) => z.is_active);
  const selectedZone = activeZones.find((z) => z.id === selectedZoneId);
  const deliveryFee = orderType === "delivery" ? (selectedZone?.fee ?? 0) : 0;
  const total = subtotal + deliveryFee;

  // Store order config in sessionStorage for checkout page
  useEffect(() => {
    sessionStorage.setItem(
      "khaldoun-order-config",
      JSON.stringify({ orderType, zoneId: selectedZoneId, deliveryFee })
    );
  }, [orderType, selectedZoneId, deliveryFee]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-gray-400">
        <ShoppingBag className="w-16 h-16" />
        <p className="text-base">السلة فارغة</p>
        <Link
          href="/menu"
          className="mt-2 px-6 py-3 bg-accent text-white rounded-xl font-bold"
        >
          تصفح المنيو
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-32">
      <h1 className="text-xl font-bold text-text mb-4">سلة الطلبات</h1>

      {/* Items */}
      <div className="bg-white rounded-2xl shadow-sm px-4 divide-y divide-gray-100 mb-4">
        {items.map((item) => (
          <CartItemRow
            key={`${item.product_id}-${item.variant_id}`}
            item={item}
          />
        ))}
      </div>

      {/* Order type */}
      {deliveryEnabled && pickupEnabled && (
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <p className="text-sm font-semibold text-text mb-3">طريقة الاستلام</p>
          <div className="flex gap-2">
            <button
              onClick={() => setOrderType("delivery")}
              className={`flex-1 min-h-[44px] rounded-xl text-sm font-semibold border transition-colors ${
                orderType === "delivery"
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-text border-gray-300"
              }`}
            >
              🚚 توصيل
            </button>
            <button
              onClick={() => setOrderType("pickup")}
              className={`flex-1 min-h-[44px] rounded-xl text-sm font-semibold border transition-colors ${
                orderType === "pickup"
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-text border-gray-300"
              }`}
            >
              🏪 استلام
            </button>
          </div>
        </div>
      )}

      {/* Delivery zone */}
      {orderType === "delivery" && activeZones.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <p className="text-sm font-semibold text-text mb-3">منطقة التوصيل</p>
          <select
            value={selectedZoneId}
            onChange={(e) => setSelectedZoneId(e.target.value)}
            aria-label="منطقة التوصيل"
            className="w-full min-h-[44px] rounded-xl border border-gray-300 px-3 text-sm bg-white text-text"
          >
            <option value="">اختر المنطقة</option>
            {activeZones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.zone_name} — {zone.fee} ج
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Summary */}
      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">المجموع الفرعي</span>
          <span className="font-semibold">{subtotal} ج</span>
        </div>
        {orderType === "delivery" && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">رسوم التوصيل</span>
            <span className="font-semibold">
              {selectedZoneId ? `${deliveryFee} ج` : "—"}
            </span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold border-t border-gray-100 pt-2">
          <span>الإجمالي</span>
          <span className="text-accent">{total} ج</span>
        </div>
      </div>

      {/* Spacer for sticky bar */}
      <div className="h-6" />

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 px-4 py-3">
        <Link
          href="/checkout"
          className={`flex items-center justify-between w-full max-w-lg mx-auto min-h-[52px] px-5 rounded-xl font-bold text-base ${
            orderType === "delivery" && !selectedZoneId
              ? "bg-gray-200 text-gray-400 pointer-events-none"
              : "bg-accent text-white"
          }`}
          aria-disabled={orderType === "delivery" && !selectedZoneId}
        >
          <span>إتمام الطلب</span>
          <span>{total} ج</span>
        </Link>
      </div>
    </div>
  );
}
