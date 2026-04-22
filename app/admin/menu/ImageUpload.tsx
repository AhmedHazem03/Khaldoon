"use client";

import { useActionState, useRef } from "react";
import { uploadProductImage } from "./actions";
import { getImageUrl } from "@/lib/images";

type UploadState = { imageUrl: string | null; error: string | null } | null;

export function ImageUpload({
  productId,
  currentImageUrl,
}: {
  productId: string;
  currentImageUrl: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const boundAction = uploadProductImage.bind(null, productId);
  const [state, action, isPending] = useActionState<UploadState, FormData>(
    boundAction,
    null
  );

  const displayUrl = state?.imageUrl ?? currentImageUrl;
  const thumbUrl = getImageUrl(displayUrl, 128, 128);

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Clickable image / placeholder */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50 hover:border-[#F26522] hover:bg-orange-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#F26522]/30 flex items-center justify-center group"
        title="اضغط لرفع صورة"
      >
        {thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbUrl}
            alt="صورة المنتج"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-3xl select-none">🍽️</span>
        )}
        {/* Overlay on hover */}
        <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-white text-[10px] font-medium">
            {isPending ? "⏳" : "📷 رفع"}
          </span>
        </span>
        {isPending && (
          <span className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="w-5 h-5 border-2 border-[#F26522] border-t-transparent rounded-full animate-spin" />
          </span>
        )}
      </button>

      {/* Hidden form */}
      <form ref={formRef} action={action} className="hidden">
        <input
          ref={inputRef}
          type="file"
          name="image"
          accept="image/jpeg,image/png,image/webp"
          title="رفع صورة المنتج"
          aria-label="رفع صورة المنتج"
          onChange={() => formRef.current?.requestSubmit()}
        />
      </form>

      {state?.error && (
        <p className="text-[10px] text-red-500 text-center max-w-[80px]">
          {state.error}
        </p>
      )}
    </div>
  );
}
