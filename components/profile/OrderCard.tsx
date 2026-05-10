"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import CancelOrderButton from "./CancelOrderButton";

const STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  preparing: "قيد التحضير",
  out_for_delivery: "في الطريق",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-orange-100 text-orange-800",
  out_for_delivery: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export interface OrderItem {
  product_name: string;
  variant_name: string | null;
  unit_price: number;
  quantity: number;
}

export interface OrderCardData {
  id: string;
  order_code: string;
  status: string;
  total_price: number;
  created_at: string;
  order_type: string;
  points_used: number;
  order_items: OrderItem[];
  canCancel: boolean;
}

export default function OrderCard({ order }: { order: OrderCardData }) {
  const [expanded, setExpanded] = useState(false);

  const date = new Date(order.created_at).toLocaleString("ar-EG", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* ── Summary row (tap to expand) ── */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full px-4 pt-3.5 pb-2 flex items-center justify-between text-right"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-primary text-sm">#{order.order_code}</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"
            }`}
          >
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-bold text-text text-sm">{order.total_price} ج</span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Date + type */}
      <div className="px-4 pb-3 flex items-center justify-between text-xs text-gray-400">
        <span>{order.order_type === "delivery" ? "🛵 توصيل" : "🏠 استلام"}</span>
        <span>{date}</span>
      </div>

      {/* ── Expanded details ── */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-2">
          {/* Items list */}
          {order.order_items.length > 0 ? (
            order.order_items.map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-2 text-sm">
                <div className="flex-1">
                  <span className="text-text">{item.product_name}</span>
                  {item.variant_name && (
                    <span className="text-gray-400 text-xs"> ({item.variant_name})</span>
                  )}
                  {item.quantity > 1 && (
                    <span className="text-gray-400 text-xs"> × {item.quantity}</span>
                  )}
                </div>
                <span className="text-text font-medium shrink-0">
                  {item.unit_price * item.quantity} ج
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-400 text-center py-1">لا توجد تفاصيل للأصناف</p>
          )}

          {/* Points discount */}
          {order.points_used > 0 && (
            <div className="flex items-center justify-between text-sm text-green-600 pt-1 border-t border-gray-50">
              <span>خصم نقاط</span>
              <span>− {order.points_used} نقطة</span>
            </div>
          )}

          {/* Total */}
          <div className="flex items-center justify-between text-sm font-bold text-text pt-1 border-t border-gray-100">
            <span>الإجمالي</span>
            <span>{order.total_price} ج</span>
          </div>

          {/* Cancel button */}
          {order.canCancel && (
            <div className="pt-1">
              <CancelOrderButton orderId={order.id} />
            </div>
          )}
        </div>
      )}

      {/* Cancel outside expanded (visible without opening) */}
      {!expanded && order.canCancel && (
        <div className="px-4 pb-3">
          <CancelOrderButton orderId={order.id} />
        </div>
      )}
    </div>
  );
}
