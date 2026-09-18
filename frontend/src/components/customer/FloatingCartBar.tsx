"use client";

import * as React from "react";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export function FloatingCartBar({ currency = "INR" }: { currency?: string }) {
  const { itemCount, subtotal, setIsCartOpen } = useCart();

  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-4 inset-x-0 z-40 px-4 pointer-events-none">
      <div className="mx-auto max-w-md pointer-events-auto">
        <button
          onClick={() => setIsCartOpen(true)}
          className="w-full flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3.5 text-white shadow-xl hover:bg-slate-800 transition active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-xs font-bold">
              {itemCount}
            </div>
            <div className="text-left">
              <span className="text-xs text-slate-300 block">
                {itemCount === 1 ? "1 item added" : `${itemCount} items added`}
              </span>
              <span className="text-sm font-bold leading-tight">
                {formatCurrency(subtotal, currency)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold">
            <span>View Cart</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </button>
      </div>
    </div>
  );
}
