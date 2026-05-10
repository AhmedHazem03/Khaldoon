import type { Order, OrderItem } from "@/types/app";

interface OrderSummaryProps {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  offerDiscount?: number;
  total: number;
  pointsEarned?: number;
}

export default function OrderSummary({
  subtotal,
  deliveryFee,
  discount,
  offerDiscount,
  total,
  pointsEarned,
}: OrderSummaryProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
      <h3 className="font-bold text-text text-sm mb-3">ملخص الطلب</h3>

      <div className="flex justify-between text-sm">
        <span className="text-gray-600">المجموع الفرعي</span>
        <span className="font-semibold">{subtotal} ج</span>
      </div>

      {deliveryFee > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">رسوم التوصيل</span>
          <span className="font-semibold">{deliveryFee} ج</span>
        </div>
      )}

      {discount > 0 && (
        <div className="flex justify-between text-sm text-green-600">
          <span>خصم النقاط</span>
          <span className="font-semibold">− {discount} ج</span>
        </div>
      )}

      {offerDiscount !== undefined && offerDiscount > 0 && (
        <div className="flex justify-between text-sm text-green-600">
          <span>خصم العرض</span>
          <span className="font-semibold">− {offerDiscount} ج</span>
        </div>
      )}

      <div className="flex justify-between text-base font-bold border-t border-gray-100 pt-2">
        <span>الإجمالي</span>
        <span className="text-accent">{total} ج</span>
      </div>

      {pointsEarned !== undefined && pointsEarned > 0 && (
        <p className="text-xs text-gray-500 pt-1">
          ⭐ ستحصل على {pointsEarned} نقطة فور إتمام الطلب
        </p>
      )}
    </div>
  );
}
