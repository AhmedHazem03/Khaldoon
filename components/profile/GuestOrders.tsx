"use client";

import { useEffect, useState } from "react";
import OrderCard, { type OrderCardData } from "./OrderCard";
import { getGuestToken } from "@/lib/guest-token";

type RawOrder = Omit<OrderCardData, "canCancel" | "order_items"> & {
  order_items: OrderCardData["order_items"] | null;
};

export default function GuestOrders() {
  const [orders, setOrders] = useState<OrderCardData[] | null>(null);

  useEffect(() => {
    const token = getGuestToken();
    if (!token) {
      setOrders([]);
      return;
    }

    fetch(`/api/orders/guest?guest_token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data: RawOrder[]) => {
        setOrders(
          data.map((order) => ({
            ...order,
            order_items: order.order_items ?? [],
            canCancel: false,
          }))
        );
      })
      .catch(() => setOrders([]));
  }, []);

  // Still loading
  if (orders === null) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-16 bg-gray-100 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  // No guest orders in this session
  if (orders.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400 text-center">
        طلباتك في هذه الجلسة — سجّل دخولك لحفظها دائماً
      </p>
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
