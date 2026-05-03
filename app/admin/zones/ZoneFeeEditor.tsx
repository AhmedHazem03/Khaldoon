"use client";

import { useState, useTransition } from "react";
import { updateZoneFee } from "./actions";

export default function ZoneFeeEditor({
  zoneId,
  initialFee,
}: {
  zoneId: string;
  initialFee: number;
}) {
  const [editing, setEditing] = useState(false);
  const [fee, setFee] = useState(initialFee);
  const [isPending, startTransition] = useTransition();

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-sm text-gray-700 hover:text-[#E4570F] underline-offset-2 hover:underline"
      >
        {fee} ج
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          await updateZoneFee(zoneId, fee);
          setEditing(false);
        });
      }}
      className="flex gap-1 items-center"
    >
      <input
        type="number"
        value={fee}
        min={0}
        onChange={(e) => setFee(parseInt(e.target.value, 10) || 0)}
        aria-label="رسوم التوصيل"
        className="w-20 rounded border border-gray-200 px-2 py-1 text-sm"
        autoFocus
      />
      <button
        type="submit"
        disabled={isPending}
        className="text-xs px-2 py-1 rounded bg-[#0F293E] text-white"
      >
        حفظ
      </button>
      <button
        type="button"
        onClick={() => { setFee(initialFee); setEditing(false); }}
        className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-500"
      >
        إلغاء
      </button>
    </form>
  );
}
