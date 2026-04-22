"use client";

import { useEffect, useRef } from "react";

interface CategoryTabsProps {
  categories: Array<{ id: string; name: string; icon: string | null }>;
  activeId: string;
  onSelect: (id: string) => void;
}

export default function CategoryTabs({
  categories,
  activeId,
  onSelect,
}: CategoryTabsProps) {
  const activeRef = useRef<HTMLButtonElement>(null);

  // Scroll active tab into view on mount and on change
  useEffect(() => {
    activeRef.current?.scrollIntoView({
      inline: "center",
      behavior: "smooth",
      block: "nearest",
    });
  }, [activeId]);

  return (
    <div className="sticky top-14 z-40 bg-background border-b border-gray-200 shadow-sm">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x px-3 py-2">
        {categories.map((cat) => {
          const isActive = cat.id === activeId;
          return (
            <button
              key={cat.id}
              ref={isActive ? activeRef : undefined}
              onClick={() => onSelect(cat.id)}
              className={`snap-start flex-shrink-0 flex items-center gap-1.5 px-4 min-h-[44px] rounded-full text-sm font-semibold border transition-colors whitespace-nowrap
                ${
                  isActive
                    ? "bg-accent text-white border-accent"
                    : "bg-white text-text border-gray-200 hover:border-accent hover:text-accent"
                }`}
            >
              {cat.icon && <span aria-hidden="true">{cat.icon}</span>}
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
