"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addProductWithImage } from "./actions";

type State = { error: string | null } | null;

export function AddProductForm({ categoryId, categoryName }: { categoryId: string; categoryName: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [state, action, isPending] = useActionState<State, FormData>(
    addProductWithImage,
    null
  );

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  useEffect(() => {
    if (state?.error === null && !isPending) {
      formRef.current?.reset();
      setPreview(null);
    }
  }, [state, isPending]);

  return (
    <form ref={formRef} action={action} className="p-4 space-y-3">
      <input type="hidden" name="category_id" value={categoryId} />

      {/* Image picker */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 hover:border-[#E4570F] hover:bg-orange-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#E4570F]/30 flex items-center justify-center group flex-shrink-0"
          title="اضغط لاختيار صورة"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="معاينة" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl select-none">🍽️</span>
          )}
          <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-[10px] font-medium">📷 صورة</span>
          </span>
        </button>
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-1">صورة المنتج (اختياري)</p>
          <p className="text-[10px] text-gray-400">JPG/PNG/WebP — حد أقصى 5MB</p>
          {preview && (
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                if (imageInputRef.current) imageInputRef.current.value = "";
              }}
              className="text-[10px] text-red-400 mt-1 hover:underline"
            >
              إزالة الصورة
            </button>
          )}
        </div>
        <input
          ref={imageInputRef}
          type="file"
          name="image"
          accept="image/jpeg,image/png,image/webp"
          title="اختر صورة المنتج"
          aria-label="اختر صورة المنتج"
          className="hidden"
          onChange={handleImageChange}
        />
      </div>

      {/* Name + Price */}
      <div className="flex gap-2">
        <div className="flex-1 space-y-1">
          <label className="text-xs text-gray-500">اسم المنتج *</label>
          <input
            type="text"
            name="name"
            placeholder={`مثال: شاورما دجاج`}
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="w-28 space-y-1">
          <label className="text-xs text-gray-500">السعر (ج)</label>
          <input
            type="number"
            name="base_price"
            placeholder="0"
            min="0"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label className="text-xs text-gray-500">الوصف</label>
        <textarea
          name="description"
          placeholder="وصف قصير أو مكونات (اختياري)"
          rows={2}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none"
        />
      </div>

      {/* CTA + is_available + order */}
      <div className="flex flex-wrap gap-2">
        <div className="space-y-1">
          <label className="text-xs text-gray-500">نوع الزر</label>
          <select
            name="cta_type"
            defaultValue="add_to_cart"
            title="نوع الزر"
            className="rounded-lg border border-gray-200 px-2 py-2 text-sm"
          >
            <option value="add_to_cart">أضف للطلب</option>
            <option value="whatsapp_inquiry">استفسار واتساب</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500">الحالة</label>
          <select
            name="is_available"
            defaultValue="true"
            title="حالة المنتج"
            className="rounded-lg border border-gray-200 px-2 py-2 text-sm"
          >
            <option value="true">متاح</option>
            <option value="false">غير متاح</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500">الترتيب</label>
          <input
            type="number"
            name="order_index"
            defaultValue="0"
            min="0"
            title="الترتيب"
            placeholder="0"
            className="w-20 rounded-lg border border-gray-200 px-2 py-2 text-sm"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={isPending}
            className="min-h-[44px] px-5 rounded-lg bg-[#E4570F] text-white text-sm font-medium disabled:opacity-60 flex items-center gap-2"
          >
            {isPending && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
            )}
            {isPending ? "جاري الحفظ..." : "إضافة"}
          </button>
        </div>
      </div>

      {state?.error && (
        <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
      )}
    </form>
  );
}
