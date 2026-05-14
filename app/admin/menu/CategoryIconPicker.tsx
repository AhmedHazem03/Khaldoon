"use client";

import { useState, useRef, useEffect } from "react";

const EMOJIS = [
  "🍕","🍔","🌮","🌯","🥙","🫔","🥪","🌭","🍟","🧆",
  "🍗","🍖","🥩","🥓","🍳","🥚","🧀","🥞","🧇","🧈",
  "🍜","🍝","🍲","🥘","🍛","🫕","🍣","🍱","🍤","🦐",
  "🥗","🥑","🍅","🧅","🧄","🌽","🫑","🥕","🍆","🫛",
  "🍞","🥖","🫓","🥐","🥨","🧁","🍰","🎂","🍩","🍪",
  "🍫","🍬","🍭","🍮","🍦","🍧","🍨","🧃","🥤","🧋",
  "☕","🫖","🍵","🥛","🍷","🥂","🍸","🧉","🫗","🍹",
  "🍽️","🥢","🥄","🍴","🔪","🫙","🧂","🫚","🪔","⭐",
];

type Mode = "emoji" | "upload";

export function CategoryIconPicker({
  defaultValue = "",
  name = "icon",
}: {
  defaultValue?: string;
  name?: string;
}) {
  const [mode, setMode] = useState<Mode>("emoji");
  const [iconValue, setIconValue] = useState(defaultValue);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setUploadPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  const previewContent = mode === "upload" && uploadPreview ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={uploadPreview} alt="معاينة" className="w-full h-full object-cover rounded-lg" />
  ) : mode === "emoji" ? (
    <span className="text-xl">{iconValue || "🍽️"}</span>
  ) : (
    <span className="text-2xl">📷</span>
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Mode tabs */}
      <div className="flex gap-1 mb-1.5">
        <button
          type="button"
          onClick={() => { setMode("emoji"); setOpen(false); }}
          className={`text-[11px] px-2 py-1 rounded-md transition-colors ${
            mode === "emoji"
              ? "bg-[#0F293E] text-white"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          Emoji
        </button>
        <button
          type="button"
          onClick={() => { setMode("upload"); setOpen(false); }}
          className={`text-[11px] px-2 py-1 rounded-md transition-colors ${
            mode === "upload"
              ? "bg-[#0F293E] text-white"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          رفع صورة
        </button>
      </div>

      {/* ── Emoji mode ── */}
      {mode === "emoji" && (
        <div className="flex items-center gap-1.5">
          <input type="hidden" name="icon_image_clear" value="1" />
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:border-[#E4570F] hover:bg-orange-50 transition-colors flex-shrink-0"
            title="اختر أيقونة"
          >
            {previewContent}
          </button>
          <input
            type="text"
            name={name}
            value={iconValue}
            onChange={(e) => setIconValue(e.target.value)}
            placeholder="emoji"
            className="w-16 rounded-lg border border-gray-200 px-2 py-2 text-sm text-center"
          />
        </div>
      )}

      {/* ── Upload mode ── */}
      {mode === "upload" && (
        <div className="flex items-center gap-2">
          {/* Clear icon text when uploading */}
          <input type="hidden" name={name} value="" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative w-14 h-14 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-[#E4570F] hover:bg-orange-50 transition-colors overflow-hidden flex items-center justify-center group"
            title="اضغط لاختيار صورة"
          >
            {previewContent}
            <span className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-[10px]">تغيير</span>
            </span>
          </button>
          <div>
            <p className="text-[11px] text-gray-500">JPG / PNG / WebP</p>
            <p className="text-[11px] text-gray-400">حد أقصى 5MB</p>
            {uploadPreview && (
              <button
                type="button"
                onClick={() => {
                  setUploadPreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-[10px] text-red-400 hover:underline mt-0.5"
              >
                إزالة
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            name="icon_image"
            accept="image/jpeg,image/png,image/webp"
            title="اختر صورة الأيقونة"
            aria-label="اختر صورة الأيقونة"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* ── Emoji grid popup ── */}
      {open && mode === "emoji" && (
        <div className="absolute top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-2 w-72">
          <div className="grid grid-cols-10 gap-0.5 max-h-52 overflow-y-auto">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  setIconValue(emoji);
                  setOpen(false);
                }}
                className={`w-7 h-7 rounded text-lg flex items-center justify-center transition-colors hover:bg-orange-50 ${
                  iconValue === emoji ? "bg-orange-100 ring-1 ring-[#E4570F]" : ""
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
          {iconValue && (
            <button
              type="button"
              onClick={() => { setIconValue(""); setOpen(false); }}
              className="mt-2 w-full text-[11px] text-gray-400 hover:text-red-500 transition-colors"
            >
              مسح الأيقونة
            </button>
          )}
        </div>
      )}
    </div>
  );
}
