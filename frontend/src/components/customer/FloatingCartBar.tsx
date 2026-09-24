"use client";

import * as React from "react";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";
import { ShoppingBag, ChevronRight } from "lucide-react";

export function FloatingCartBar({ currency = "INR" }: { currency?: string }) {
  const { itemCount, subtotal, setIsCartOpen } = useCart();
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (itemCount > 0) {
      // Small delay for enter animation
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [itemCount]);

  if (itemCount === 0) return null;

  return (
    <div
      className={`fixed bottom-0 inset-x-0 z-40 px-4 pb-4 pt-2 pointer-events-none transition-all duration-300 ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0"
      }`}
    >
      {/* Gradient fade-out above the bar */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/80 to-transparent pointer-events-none" />

      <div className="relative mx-auto max-w-lg pointer-events-auto">
        <button
          onClick={() => setIsCartOpen(true)}
          className="w-full flex items-center justify-between rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-3.5 text-white shadow-xl shadow-amber-600/25 hover:shadow-2xl hover:shadow-amber-600/30 transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div className="text-left">
              <span className="text-[11px] text-amber-100 block leading-tight">
                {itemCount === 1 ? "1 item" : `${itemCount} items`}
              </span>
              <span className="text-sm font-bold leading-tight">
                {formatCurrency(subtotal, currency)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <span>View Cart</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </button>
      </div>
    </div>
  );
}
