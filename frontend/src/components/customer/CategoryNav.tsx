"use client";

import * as React from "react";
import { Category } from "@/types";
import { cn } from "@/lib/utils";

export interface CategoryNavProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
}

export function CategoryNav({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategoryNavProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  if (!categories.length) return null;

  const activeCategories = categories
    .filter((c) => c.is_active)
    .sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="sticky top-[49px] z-30 w-full bg-white/95 backdrop-blur-xl border-b border-stone-100">
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto px-4 py-2.5 no-scrollbar"
      >
        <button
          onClick={() => onSelectCategory(null)}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 select-none",
            selectedCategoryId === null
              ? "bg-stone-900 text-white shadow-md shadow-stone-900/15"
              : "bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-800 active:scale-95"
          )}
        >
          All
        </button>

        {activeCategories.map((cat) => {
          const isSelected = selectedCategoryId === cat.category_id;
          return (
            <button
              key={cat.category_id}
              onClick={() => onSelectCategory(cat.category_id)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 select-none",
                isSelected
                  ? "bg-stone-900 text-white shadow-md shadow-stone-900/15"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-800 active:scale-95"
              )}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
