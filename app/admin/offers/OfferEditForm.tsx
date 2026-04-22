"use client";

import { useState } from "react";
import type { Offer } from "@/types/app";

const BENEFIT_LABELS: Record<string, string> = {
  display_only:       "إعلاني فقط — بدون خصم أو نقاط",
  discount_pct:       "خصم نسبة % على المنتجات المرتبطة",
  discount_fixed:     "خصم مبلغ ثابت (جنيه) على المنتجات",
  points_multiplier:  "مضاعف النقاط على المنتجات المرتبطة",
  coupon_pct:         "كوبون خصم نسبة % على الطلب كله",
  coupon_fixed:       "كوبون خصم مبلغ ثابت (جنيه) على الطلب",
};

interface Props {
  offer: Offer;
  updateAction: (formData: FormData) => Promise<void>;
}

export function OfferEditForm({ offer, updateAction }: Props) {
  const [benefitType, setBenefitType] = useState(offer.benefit_type ?? "display_only");

  const isCoupon      = benefitType.startsWith("coupon");
  const isProductType = ["discount_pct", "discount_fixed", "points_multiplier"].includes(benefitType);
  const hasValue      = benefitType !== "display_only";

  const valuePlaceholder =
    benefitType === "discount_pct" || benefitType === "coupon_pct"
      ? "مثال: 20 (يعني 20%)"
      : benefitType === "points_multiplier"
      ? "مثال: 2 (يعني ضعف النقاط)"
      : "مثال: 10 (يعني 10 جنيه)";

  return (
    <form action={updateAction} className="flex-1 space-y-2">
      <input type="hidden" name="id" value={offer.id} />

      {/* Title + order_index */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          type="text"
          name="title"
          defaultValue={offer.title ?? ""}
          placeholder="عنوان العرض"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <input
          id={`order-${offer.id}`}
          type="number"
          name="order_index"
          defaultValue={offer.order_index}
          aria-label="الترتيب"
          title="الترتيب"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      </div>

      {/* Expiry */}
      <input
        type="datetime-local"
        name="expires_at"
        aria-label="تاريخ انتهاء العرض"
        title="تاريخ انتهاء العرض"
        defaultValue={
          offer.expires_at ? new Date(offer.expires_at).toISOString().slice(0, 16) : ""
        }
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
      />

      {/* Benefit type */}
      <select
        name="benefit_type"
        value={benefitType}
        onChange={(e) => setBenefitType(e.target.value)}
        aria-label="نوع فائدة العرض"
        title="نوع فائدة العرض"
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white font-medium"
      >
        {Object.entries(BENEFIT_LABELS).map(([val, label]) => (
          <option key={val} value={val}>{label}</option>
        ))}
      </select>

      {/* Benefit value */}
      {hasValue && (
        <input
          type="number"
          name="benefit_value"
          defaultValue={offer.benefit_value ?? 0}
          placeholder={valuePlaceholder}
          min="0"
          step="0.01"
          aria-label="قيمة الخصم أو المضاعف"
          title="قيمة الخصم أو المضاعف"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      )}

      {/* Coupon-specific fields */}
      {isCoupon && (
        <div className="space-y-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-[#F26522]">إعدادات الكوبون</p>
          <input
            type="text"
            name="coupon_code"
            defaultValue={offer.coupon_code ?? ""}
            placeholder="كود الكوبون (مثال: RAMADAN25)"
            aria-label="كود الكوبون"
            title="كود الكوبون"
            className="w-full rounded-lg border border-orange-200 px-3 py-2 text-sm uppercase tracking-widest font-mono"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 block mb-1">حد أدنى للطلب (جنيه)</label>
              <input
                type="number"
                name="min_order_amount"
                defaultValue={offer.min_order_amount ?? 0}
                min="0"
                aria-label="حد أدنى للطلب"
                title="حد أدنى للطلب"
                className="w-full rounded-lg border border-orange-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">حد أقصى استخدامات (فارغ = لا حد)</label>
              <input
                type="number"
                name="max_uses"
                defaultValue={offer.max_uses ?? ""}
                min="1"
                placeholder="لا حد"
                aria-label="حد أقصى للاستخدامات"
                title="حد أقصى للاستخدامات"
                className="w-full rounded-lg border border-orange-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">
            تم الاستخدام: <strong>{offer.uses_count ?? 0}</strong> مرة
            {offer.max_uses ? ` من أصل ${offer.max_uses}` : " (بلا حد)"}
          </p>
        </div>
      )}

      {/* Product-level note */}
      {isProductType && (
        <p className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          💡 الخصم / المضاعف يُطبَّق تلقائياً على المنتجات المرتبطة أدناه.
        </p>
      )}

      <button
        type="submit"
        className="w-full min-h-[44px] px-4 rounded-lg bg-[#1E2A4A] text-white text-xs font-medium"
      >
        حفظ التعديلات
      </button>
    </form>
  );
}
