"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cart";
import { calcPointsEarned } from "@/lib/points";
import { generateWhatsAppMessage, buildWhatsAppURL } from "@/lib/whatsapp";
import OrderSummary from "@/components/checkout/OrderSummary";
import PointsSlider from "@/components/checkout/PointsSlider";
import type { Settings } from "@/types/app";

const schema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  phone: z
    .string()
    .regex(/^01[0125][0-9]{8}$/, "رقم الهاتف غير صحيح (مثال: 01012345678)"),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface UserProfile {
  id: string;
  name: string;
  phone_number: string;
  default_address: string | null;
  points_balance: number;
}

interface CheckoutFormProps {
  settings: Pick<
    Settings,
    | "whatsapp_order_number"
    | "point_value_egp"
    | "points_per_100_egp"
    | "max_points_discount_pct"
    | "is_ordering_open"
  >;
  userProfile?: UserProfile;
}

interface OrderConfig {
  orderType: "delivery" | "pickup";
  zoneId: string;
  deliveryFee: number;
}

export default function CheckoutForm({ settings, userProfile }: CheckoutFormProps) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const clearCart = useCartStore((s) => s.clearCart);
  const updateItemPrice = useCartStore((s) => s.updateItemPrice);
  const storedCoupon = useCartStore((s) => s.couponCode);
  const storedCouponDiscount = useCartStore((s) => s.couponDiscount);
  const setCoupon = useCartStore((s) => s.setCoupon);

  const pointValue = Number(settings.point_value_egp ?? "0.5");
  const maxPct = Number(settings.max_points_discount_pct ?? "20");

  const [orderConfig, setOrderConfig] = useState<OrderConfig>({
    orderType: "delivery",
    zoneId: "",
    deliveryFee: 0,
  });
  const [pointsDiscount, setPointsDiscount] = useState(0);
  const [couponInput, setCouponInput] = useState(storedCoupon ?? "");
  const [couponDiscount, setCouponDiscount] = useState(storedCouponDiscount);
  // Tracks the subtotal at the moment the coupon was validated.
  // If the subtotal drifts from this value, we clear the coupon so totals stay honest.
  const [couponAppliedAtSubtotal, setCouponAppliedAtSubtotal] = useState<number | null>(
    storedCouponDiscount > 0 ? subtotal : null
  );
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponApplying, setCouponApplying] = useState(false);
  const [autofilled, setAutofilled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [priceWarning, setPriceWarning] = useState<string | null>(null);

  const isOrderingOpen = settings.is_ordering_open !== "false";
  const total = Math.max(0, subtotal + orderConfig.deliveryFee - pointsDiscount - couponDiscount);
  const pointsEarned = userProfile
    ? calcPointsEarned(subtotal, Number(settings.points_per_100_egp ?? "1"))
    : 0;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // Clear coupon when subtotal changes (e.g. user went back and removed items)
  useEffect(() => {
    if (couponAppliedAtSubtotal !== null && couponAppliedAtSubtotal !== subtotal) {
      setCouponDiscount(0);
      setCoupon(null, 0);
      setCouponAppliedAtSubtotal(null);
      setCouponError("تغيّر إجمالي الطلب، يرجى إعادة تطبيق كود الخصم");
    }
  // subtotal is the only dep we need — other setters are stable refs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  // Read order config from sessionStorage (set by cart page)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("khaldoun-order-config");
      if (raw) {
        const config = JSON.parse(raw) as OrderConfig;
        setOrderConfig(config);
      }
    } catch {
      // ignore
    }
  }, []);

  function handleAutofill() {
    if (!userProfile) return;
    setValue("name", userProfile.name);
    setValue("phone", userProfile.phone_number);
    if (userProfile.default_address) {
      setValue("address", userProfile.default_address);
    }
    setAutofilled(true);
  }

  // Redirect to cart if it becomes empty
  useEffect(() => {
    if (items.length === 0) router.replace("/cart");
  }, [items, router]);

  // One-time stale price check on mount.
  // Reads items via getState() so updating prices doesn't re-trigger this effect.
  useEffect(() => {
    async function checkPrices() {
      const snapshot = useCartStore.getState().items;
      if (snapshot.length === 0) return;

      const productIds = [...new Set(snapshot.map((i) => i.product_id))];
      try {
        const res = await fetch(
          `/api/products/prices?ids=${productIds.join(",")}`
        );
        if (!res.ok) return;
        const data: Array<{
          id: string;
          variant_id: string | null;
          price: number;
        }> = await res.json();

        const changed = snapshot.filter((item) => {
          const server = data.find(
            (d) =>
              d.id === item.product_id &&
              (d.variant_id ?? null) === item.variant_id
          );
          return server && server.price !== item.unit_price;
        });

        if (changed.length > 0) {
          for (const item of changed) {
            const server = data.find(
              (d) =>
                d.id === item.product_id &&
                (d.variant_id ?? null) === item.variant_id
            );
            if (server) updateItemPrice(item.product_id, item.variant_id, server.price);
          }
          const names = changed.map((i) => i.product_name).join("، ");
          setPriceWarning(`تغيّر سعر: ${names} — تم تحديث الإجمالي تلقائياً.`);
        }
      } catch {
        // non-critical
      }
    }

    checkPrices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(data: FormData) {
    if (orderConfig.orderType === "delivery" && !data.address) {
      setErrorMsg("العنوان مطلوب لطلبات التوصيل");
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    // Open a blank window NOW (still inside the user gesture) so the browser
    // won't block it after the async fetch completes.
    const waWindow = window.open("", "_blank");

    const guestToken = sessionStorage.getItem("guest_token") ?? undefined;

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: data.name,
          customer_phone: data.phone,
          delivery_address: data.address ?? null,
          order_type: orderConfig.orderType,
          zone_id: orderConfig.zoneId || null,
          notes: data.notes ?? null,
          is_registered: !!userProfile,
          points_to_use: userProfile ? Math.round(pointsDiscount / pointValue) : 0,
          coupon_code: couponInput.trim().toUpperCase() || undefined,
          guest_token: guestToken,
          items: items.map((item) => ({
            product_id: item.product_id,
            variant_id: item.variant_id,
            product_name: item.product_name,
            variant_name: item.variant_name,
            unit_price: item.unit_price,
            quantity: item.quantity,
          })),
        }),
      });

      if (!res.ok) {
        waWindow?.close();
        const body = await res.json().catch(() => ({}));
        setErrorMsg(body.error ?? "حدث خطأ، حاول مرة أخرى");
        return;
      }

      const result = await res.json();
      const itemsSnapshot = [...items];
      clearCart();

      const earnedPoints = calcPointsEarned(
        result.subtotal ?? subtotal,
        Number(settings.points_per_100_egp ?? "1")
      );
      const orderForWA = {
        order_code: result.order_code,
        order_type: orderConfig.orderType,
        subtotal: result.subtotal ?? subtotal,
        delivery_fee: result.delivery_fee ?? orderConfig.deliveryFee,
        discount_amount: result.discount_amount ?? pointsDiscount,
        offer_discount: result.offer_discount ?? couponDiscount,
        total_price: result.total_price ?? total,
        points_used: Math.round((result.discount_amount ?? pointsDiscount) / pointValue),
        points_earned: earnedPoints,
        customer_name: data.name,
        customer_phone: data.phone,
        delivery_address: data.address ?? null,
        notes: data.notes ?? null,
      };

      const message = generateWhatsAppMessage(orderForWA, itemsSnapshot, settings);
      const waUrl = buildWhatsAppURL(settings.whatsapp_order_number, message, result.order_code);

      sessionStorage.setItem("khaldoun-last-wa-url", waUrl);
      sessionStorage.setItem("khaldoun-pending-order-id", result.id);

      if (waWindow) {
        waWindow.location.href = waUrl;
      } else {
        window.open(waUrl, "_blank", "noopener,noreferrer");
      }

      router.push(`/order-confirm?orderId=${result.id}`);
    } catch {
      waWindow?.close();
      setErrorMsg("حدث خطأ في الشبكة، حاول مرة أخرى");
    } finally {
      setSaving(false);
    }
  }

  if (!isOrderingOpen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
        <div className="text-5xl">🕐</div>
        <h2 className="text-xl font-bold text-text">المطعم مغلق حالياً</h2>
        <p className="text-sm text-gray-500 max-w-xs">
          الطلبات متوقفة مؤقتاً، نعود قريباً. شكراً لتفهمك!
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-32">
      <h1 className="text-xl font-bold text-text mb-4">إتمام الطلب</h1>

      {priceWarning && (
        <div className="bg-orange-50 border border-orange-200 text-orange-700 rounded-xl p-3 text-sm mb-4">
          ⚠️ {priceWarning}
        </div>
      )}

      {/* Autofill banner for registered users */}
      {userProfile && !autofilled && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-blue-800">أهلاً {userProfile.name}!</p>
            <p className="text-xs text-blue-600 mt-0.5">
              رصيد نقاطك:{" "}
              <span className="font-bold">{userProfile.points_balance}</span> نقطة
            </p>
          </div>
          <button
            type="button"
            onClick={handleAutofill}
            className="min-h-[44px] px-3 bg-primary text-white text-sm rounded-lg shrink-0"
          >
            استخدم بياناتي
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            الاسم <span className="text-red-500">*</span>
          </label>
          <input
            {...register("name")}
            placeholder="اسمك الكامل"
            className="w-full min-h-[44px] px-4 rounded-xl border border-gray-300 text-sm bg-white focus:outline-none focus:border-accent"
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            رقم الهاتف <span className="text-red-500">*</span>
          </label>
          <input
            {...register("phone")}
            placeholder="01012345678"
            dir="ltr"
            inputMode="tel"
            className="w-full min-h-[44px] px-4 rounded-xl border border-gray-300 text-sm bg-white focus:outline-none focus:border-accent"
          />
          {errors.phone && (
            <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
          )}
        </div>

        {/* Address (delivery only) */}
        {orderConfig.orderType === "delivery" && (
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              العنوان <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register("address")}
              placeholder="اكتب عنوانك بالتفصيل"
              rows={3}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 text-sm bg-white focus:outline-none focus:border-accent resize-none"
            />
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            ملاحظات (اختياري)
          </label>
          <textarea
            {...register("notes")}
            placeholder="أي طلبات خاصة؟"
            rows={2}
            className="w-full px-4 py-2 rounded-xl border border-gray-300 text-sm bg-white focus:outline-none focus:border-accent resize-none"
          />
        </div>

        {/* Coupon code input */}
        <div>
          <label className="block text-sm font-medium text-text mb-1">كود الخصم (اختياري)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={couponInput}
              onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null); }}
              placeholder="KH-SAVE10"
              dir="ltr"
              className="flex-1 min-h-[44px] px-4 rounded-xl border border-gray-300 text-sm bg-white focus:outline-none focus:border-accent uppercase"
            />
            <button
              type="button"
              disabled={couponApplying || !couponInput.trim()}
              onClick={async () => {
                const code = couponInput.trim().toUpperCase();
                if (!code) return;
                setCouponApplying(true);
                setCouponError(null);
                try {
                  const res = await fetch("/api/offers/validate-coupon", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ coupon_code: code, subtotal }),
                  });
                  const body = await res.json();
                  if (!res.ok) {
                    setCouponError(body.error ?? "كود غير صحيح");
                    setCouponDiscount(0);
                    setCoupon(null, 0);
                    setCouponAppliedAtSubtotal(null);
                  } else {
                    setCouponDiscount(body.discount ?? 0);
                    setCoupon(code, body.discount ?? 0);
                    setCouponAppliedAtSubtotal(subtotal);
                  }
                } catch {
                  setCouponError("حدث خطأ، حاول مرة أخرى");
                } finally {
                  setCouponApplying(false);
                }
              }}
              className="min-h-[44px] px-4 bg-accent text-white text-sm rounded-xl shrink-0 disabled:opacity-50"
            >
              {couponApplying ? "..." : "تطبيق"}
            </button>
          </div>
          {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
          {couponDiscount > 0 && (
            <div className="mt-2 flex items-center gap-2 text-green-700 text-sm bg-green-50 rounded-lg px-3 py-1.5">
              <span>✅ خصم {couponDiscount} ج مُطبَّق</span>
              <button
                type="button"
                onClick={() => { setCouponInput(""); setCouponDiscount(0); setCoupon(null, 0); setCouponAppliedAtSubtotal(null); }}
                className="mr-auto text-red-500 text-xs"
              >
                إلغاء
              </button>
            </div>
          )}
        </div>

        {/* Points slider — only for registered users with balance */}
        {userProfile && userProfile.points_balance > 0 && (
          <PointsSlider
            balance={userProfile.points_balance}
            pointValue={pointValue}
            subtotal={Math.max(0, subtotal - couponDiscount)}
            maxPct={maxPct}
            discount={pointsDiscount}
            onChange={setPointsDiscount}
          />
        )}

        {/* Order summary */}
        <OrderSummary
          subtotal={subtotal}
          deliveryFee={orderConfig.deliveryFee}
          discount={pointsDiscount}
          offerDiscount={couponDiscount}
          total={total}
          pointsEarned={pointsEarned > 0 ? pointsEarned : undefined}
        />

        {errorMsg && (
          <p className="text-red-500 text-sm text-center">{errorMsg}</p>
        )}
      </form>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 px-4 py-3">
        <button
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={saving}
          className="flex items-center justify-between w-full max-w-lg mx-auto min-h-[52px] px-5 rounded-xl bg-accent text-white font-bold text-base disabled:opacity-60"
        >
          <span>{saving ? "جاري الحفظ..." : "إتمام الطلب عبر واتساب"}</span>
          <span>{total} ج</span>
        </button>
      </div>
    </div>
  );
}
