"use client";

import { calcMaxDiscount, egpToPoints } from "@/lib/points";

interface PointsSliderProps {
  balance: number;
  pointValue: number;
  subtotal: number;
  maxPct: number;
  discount: number;
  onChange: (discount: number) => void;
}

export default function PointsSlider({
  balance,
  pointValue,
  subtotal,
  maxPct,
  discount,
  onChange,
}: PointsSliderProps) {
  const maxDiscount = calcMaxDiscount(balance, pointValue, subtotal, maxPct);
  const step = pointValue > 0 ? pointValue : 1;

  // Points consumed = discount / pointValue (whole number guaranteed by calcMaxDiscount)
  const pointsUsed = pointValue > 0 ? Math.round(discount / pointValue) : 0;

  function clamp(value: number): number {
    // Round to nearest step, then clamp between 0 and maxDiscount
    const stepped = Math.round(value / step) * step;
    return Math.max(0, Math.min(stepped, maxDiscount));
  }

  function decrement() {
    onChange(clamp(discount - step));
  }

  function increment() {
    onChange(clamp(discount + step));
  }

  function onSliderChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(clamp(Number(e.target.value)));
  }

  if (balance <= 0 || maxDiscount <= 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-400 text-center">
        لا توجد نقاط متاحة للاستخدام
      </div>
    );
  }

  return (
    <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text">استخدام نقاطك</span>
        <span className="text-xs text-gray-500">
          رصيدك: <span className="font-bold text-primary">{balance}</span> نقطة
        </span>
      </div>

      {/* Value display */}
      <div className="text-center">
        <span className="text-2xl font-bold text-accent">{discount}</span>
        <span className="text-sm text-gray-500 mr-1">ج خصم</span>
        {pointsUsed > 0 && (
          <span className="text-xs text-gray-400 block">
            ({pointsUsed} نقطة)
          </span>
        )}
      </div>

      {/* Slider + buttons row */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={decrement}
          disabled={discount <= 0}
          aria-label="تقليل الخصم"
          className="w-11 h-11 rounded-full border border-gray-300 flex items-center justify-center text-xl font-bold text-gray-600 disabled:opacity-40 shrink-0"
        >
          −
        </button>

        <input
          type="range"
          min={0}
          max={maxDiscount}
          step={step}
          value={discount}
          onChange={onSliderChange}
          aria-label="مقدار خصم النقاط"
          className="flex-1 accent-accent h-2 cursor-pointer"
        />

        <button
          type="button"
          onClick={increment}
          disabled={discount >= maxDiscount}
          aria-label="زيادة الخصم"
          className="w-11 h-11 rounded-full border border-gray-300 flex items-center justify-center text-xl font-bold text-gray-600 disabled:opacity-40 shrink-0"
        >
          +
        </button>
      </div>

      <div className="flex justify-between text-xs text-gray-400">
        <span>0 ج</span>
        <span>
          الحد الأقصى: <span className="text-accent font-medium">{maxDiscount}</span> ج (
          {egpToPoints(maxDiscount, pointValue)} نقطة)
        </span>
      </div>
    </div>
  );
}
