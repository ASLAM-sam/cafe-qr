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
  if (!categories.length) return null;

  return (
    <div className="sticky top-[53px] z-30 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center gap-1.5 overflow-x-auto px-4 py-2.5 no-scrollbar">
        <button
          onClick={() => onSelectCategory(null)}
          className={cn(
            "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 select-none",
            selectedCategoryId === null
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
          )}
        >
          All Items
        </button>

        {categories
          .filter((c) => c.is_active)
          .sort((a, b) => a.display_order - b.display_order)
          .map((cat) => {
            const isSelected = selectedCategoryId === cat.category_id;
            return (
              <button
                key={cat.category_id}
                onClick={() => onSelectCategory(cat.category_id)}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 select-none",
                  isSelected
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
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
