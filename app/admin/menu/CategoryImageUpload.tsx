"use client";

import { useActionState, useRef } from "react";
import { uploadCategoryImage } from "./actions";
import { getImageUrl } from "@/lib/images";

type UploadState = { imageUrl: string | null; error: string | null } | null;

export function CategoryImageUpload({
  categoryId,
  categoryName,
  currentImageUrl,
}: {
  categoryId: string;
  categoryName: string;
  currentImageUrl: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const boundAction = uploadCategoryImage.bind(null, categoryId);
  const [state, action, isPending] = useActionState<UploadState, FormData>(
    boundAction,
    null
  );

  const displayUrl = state?.imageUrl ?? currentImageUrl;
  const thumbUrl = getImageUrl(displayUrl, 128, 128);

  return (
    <div className="flex items-center gap-3">
      {/* Clickable image / placeholder */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 hover:border-[#F26522] hover:bg-orange-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#F26522]/30 flex items-center justify-center group flex-shrink-0"
        title="اضغط لرفع صورة القسم"
      >
        {thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbUrl}
            alt={`صورة ${categoryName}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xl select-none">🖼️</span>
        )}
        <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-white text-[9px] font-medium">
            {isPending ? "⏳" : "📷"}
          </span>
        </span>
        {isPending && (
          <span className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="w-4 h-4 border-2 border-[#F26522] border-t-transparent rounded-full animate-spin" />
          </span>
        )}
      </button>

      <span className="text-xs text-gray-400">صورة القسم</span>

      {/* Hidden form */}
      <form ref={formRef} action={action} className="hidden">
        <input
          ref={inputRef}
          type="file"
          name="image"
          accept="image/jpeg,image/png,image/webp"
          title="رفع صورة القسم"
          aria-label="رفع صورة القسم"
          onChange={() => formRef.current?.requestSubmit()}
        />
      </form>

      {state?.error && (
        <p className="text-[10px] text-red-500">{state.error}</p>
      )}
    </div>
  );
}
