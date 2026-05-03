"use client";

import { useTransition } from "react";
import { updateOrderStatus } from "@/app/admin/orders/actions";
import type { Order } from "@/types/app";

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

// Valid next statuses for each current status
const NEXT_STATUSES: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

interface OrderRow
  extends Pick<
    Order,
    | "id"
    | "order_code"
    | "customer_name"
    | "customer_phone"
    | "order_type"
    | "total_price"
    | "status"
    | "created_at"
  > {
  zone_name?: string | null;
}

interface OrdersTableProps {
  orders: OrderRow[];
}

function StatusDropdown({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const [isPending, startTransition] = useTransition();
  const nextStatuses = NEXT_STATUSES[currentStatus] ?? [];

  if (nextStatuses.length === 0) {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[currentStatus] ?? "bg-gray-100 text-gray-800"}`}
      >
        {STATUS_LABELS[currentStatus] ?? currentStatus}
      </span>
    );
  }

  return (
    <select
      disabled={isPending}
      defaultValue={currentStatus}
      aria-label="تغيير حالة الطلب"
      onChange={(e) => {
        const newStatus = e.target.value;
        if (newStatus === currentStatus) return;
        startTransition(() => {
          updateOrderStatus(orderId, newStatus);
        });
      }}
      className={`text-xs rounded-full px-2.5 py-0.5 font-medium border-0 cursor-pointer disabled:opacity-50 ${STATUS_COLORS[currentStatus] ?? "bg-gray-100 text-gray-800"}`}
    >
      <option value={currentStatus}>
        {STATUS_LABELS[currentStatus] ?? currentStatus}
      </option>
      {nextStatuses.map((s) => (
        <option key={s} value={s}>
          ← {STATUS_LABELS[s] ?? s}
        </option>
      ))}
    </select>
  );
}

export default function OrdersTable({ orders }: OrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">لا توجد طلبات</div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="min-w-full text-sm bg-white">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-right text-xs text-gray-500">
            <th className="px-4 py-3 font-medium">الكود</th>
            <th className="px-4 py-3 font-medium">العميل</th>
            <th className="px-4 py-3 font-medium">الهاتف</th>
            <th className="px-4 py-3 font-medium">النوع</th>
            <th className="px-4 py-3 font-medium">المنطقة</th>
            <th className="px-4 py-3 font-medium">الإجمالي</th>
            <th className="px-4 py-3 font-medium">الحالة</th>
            <th className="px-4 py-3 font-medium">التاريخ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-mono text-[#0F293E] font-semibold whitespace-nowrap">
                {order.order_code}
              </td>
              <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                {order.customer_name}
              </td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap" dir="ltr">
                {order.customer_phone}
              </td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                {order.order_type === "delivery" ? "توصيل" : "استلام"}
              </td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                {order.zone_name ?? "—"}
              </td>
              <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                {order.total_price.toLocaleString("ar-EG")} ج
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <StatusDropdown
                  orderId={order.id}
                  currentStatus={order.status}
                />
              </td>
              <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                {new Date(order.created_at).toLocaleString("ar-EG", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
