"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function OrderConfirmContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");

  async function handleConfirm() {
    if (orderId) {
      // Mark whatsapp_opened = true
      await fetch(`/api/orders/${orderId}/whatsapp-opened`, {
        method: "PATCH",
      }).catch(() => {});
    }
    router.push("/");
  }

  async function handleReopen() {
    // Re-open WhatsApp — order data stored in sessionStorage by checkout
    const raw = sessionStorage.getItem("khaldoun-last-wa-url");
    if (raw) {
      window.open(raw, "_blank", "noopener,noreferrer");
    }
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
          onClick={handleConfirm}
          className="w-full min-h-[52px] rounded-xl bg-primary text-white font-bold text-base"
        >
          ✅ نعم، أرسلت
        </button>

        <button
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
