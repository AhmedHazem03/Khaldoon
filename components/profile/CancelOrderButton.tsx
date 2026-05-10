"use client";

import { useActionState } from "react";
import { cancelOrder } from "@/app/profile/actions";

const ERROR_MESSAGES: Record<string, string> = {
  window_expired: "انتهت مدة الإلغاء (5 دقائق من الطلب)",
  not_found: "الطلب غير موجود",
  invalid_status: "لا يمكن إلغاء الطلب بعد تأكيده",
  already_cancelled: "الطلب ملغى مسبقاً",
  unauthorized: "غير مصرح بهذا الإجراء",
};

type State = Awaited<ReturnType<typeof cancelOrder>> | null;

export default function CancelOrderButton({ orderId }: { orderId: string }) {
  const boundAction = cancelOrder.bind(null, orderId);
  const [state, action, pending] = useActionState<State, FormData>(
    async (_prev: State, _data: FormData) => boundAction(),
    null
  );

  const errorKey = state && "error" in state ? state.error : null;

  return (
    <form action={action} className="space-y-1">
      <button
        type="submit"
        disabled={pending}
        className="w-full min-h-[40px] rounded-xl border border-red-300 text-red-600 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "جاري الإلغاء..." : "إلغاء الطلب"}
      </button>
      {errorKey && (
        <p className="text-xs text-red-500 text-center">
          {ERROR_MESSAGES[errorKey] ?? "حدث خطأ، حاول مرة أخرى"}
        </p>
      )}
    </form>
  );
}
