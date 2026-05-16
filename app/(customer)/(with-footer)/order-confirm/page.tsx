"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { getGuestToken } from "@/lib/guest-token";

function OrderConfirmContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");

  async function markWhatsappOpened() {
    if (!orderId) return;

    const guestToken = getGuestToken();

    const headers: Record<string, string> = {};
    if (guestToken) headers["x-guest-token"] = guestToken;

    await fetch(`/api/orders/${orderId}/whatsapp-opened`, {
      method: "PATCH",
      headers,
    }).catch(() => {});
  }

  async function handleConfirm() {
    await markWhatsappOpened();
    router.push("/");
  }

  async function handleReopen() {
    const raw =
      typeof window !== "undefined"
        ? sessionStorage.getItem("khaldoun-last-wa-url")
        : null;

    if (!raw) {
      alert("رابط الواتساب غير متوفر، يرجى العودة وإعادة إرسال الطلب.");
      return;
    }

    window.open(raw, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center gap-6">
      <div className="text-6xl">📱</div>

      <h1 className="text-xl font-bold text-text">
        هل ضغطت على إرسال في الواتساب؟
      </h1>

      <p className="text-sm text-gray-500 max-w-xs">
        بعد ما تضغط إرسال في الواتساب، طلبك بيبقى جاهز وهنبدأ في التحضير
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full min-h-[52px] rounded-xl bg-primary text-white font-bold text-base"
        >
          ✅ نعم، أرسلت
        </button>

        <button
          type="button"
          onClick={handleReopen}
          className="w-full min-h-[52px] rounded-xl border-2 border-[#25D366] text-[#25D366] font-bold text-base"
        >
          🔄 أعد فتح الواتساب
        </button>
      </div>
    </div>
  );
}

export default function OrderConfirmPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" />}>
      <OrderConfirmContent />
    </Suspense>
  );
}
