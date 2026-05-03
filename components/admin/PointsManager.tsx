"use client";

import React, { useTransition, useRef, useState } from "react";
import { adjustPoints } from "@/app/admin/customers/actions";

interface PointsManagerProps {
  userId: string;
  currentBalance: number;
}

export default function PointsManager({
  userId,
  currentBalance,
}: PointsManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const amount = parseInt(fd.get("amount") as string, 10);
    const type = fd.get("type") as string;
    const note = (fd.get("note") as string) ?? "";

    setMessage(null);
    startTransition(async () => {
      const result = await adjustPoints({ userId, amount, type, note });
      if (result.success) {
        setMessage({ type: "success", text: "تم تعديل النقاط بنجاح" });
        formRef.current?.reset();
      } else {
        setMessage({ type: "error", text: result.error ?? "حدث خطأ" });
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
        <span>الرصيد الحالي:</span>
        <span className="font-bold text-[#0F293E]">{currentBalance} نقطة</span>
      </div>

      <div className="flex gap-2">
        <input
          type="number"
          name="amount"
          min="1"
          required
          placeholder="عدد النقاط"
          className="flex-1 min-w-0 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F293E]"
        />
        <select
          name="type"
          required
          defaultValue="manual_add"
          aria-label="نوع تعديل النقاط"
          className="rounded-lg border border-gray-200 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F293E]"
        >
          <option value="manual_add">إضافة</option>
          <option value="manual_deduct">خصم</option>
        </select>
      </div>

      <input
        type="text"
        name="note"
        placeholder="ملاحظة (اختياري)"
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F293E]"
      />

      <button
        type="submit"
        disabled={isPending}
        className="w-full min-h-[44px] rounded-lg bg-[#0F293E] text-white text-sm font-medium disabled:opacity-50 transition-opacity"
      >
        {isPending ? "جاري التعديل..." : "تعديل النقاط"}
      </button>

      {message && (
        <p
          className={`text-xs text-center ${
            message.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}
    </form>
  );
}
