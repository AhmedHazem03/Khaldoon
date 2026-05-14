"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition, useRef } from "react";

export function MenuSearch({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearch(term: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (term) {
        params.set("q", term);
      } else {
        params.delete("q");
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    }, 300);
  }

  return (
    <div className="relative">
      <input
        type="search"
        defaultValue={defaultValue ?? ""}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="ابحث عن منتج أو قسم..."
        className={`w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm ps-10 focus:outline-none focus:ring-2 focus:ring-[#0F293E]/20 transition-opacity ${
          isPending ? "opacity-60" : ""
        }`}
        dir="rtl"
      />
      <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">
        🔍
      </span>
    </div>
  );
}
