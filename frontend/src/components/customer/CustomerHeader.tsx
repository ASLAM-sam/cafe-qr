"use client";

import * as React from "react";
import { useTenant } from "@/context/TenantContext";
import { useCart } from "@/context/CartContext";
import { ShoppingBag, Coffee, QrCode } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function CustomerHeader() {
  const { cafe, tableNumber } = useTenant();
  const { itemCount, setIsCartOpen } = useCart();
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        scrolled
          ? "bg-white/95 backdrop-blur-xl shadow-sm border-b border-stone-200/80"
          : "bg-white border-b border-stone-100"
      )}
    >
      <div className="mx-auto flex items-center justify-between px-4 py-2.5">
        {/* Cafe Logo & Name */}
        <div className="flex items-center gap-2.5 overflow-hidden">
          {cafe?.logo ? (
            <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-stone-200/80 shadow-sm shrink-0">
              <Image
                src={cafe.logo}
                alt={cafe.name || "Cafe Logo"}
                fill
                sizes="36px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-600 to-orange-700 text-white shrink-0 shadow-sm">
              <Coffee className="h-4.5 w-4.5" />
            </div>
          )}
          <div className="truncate">
            <h1 className="text-sm font-bold text-stone-900 truncate tracking-tight leading-tight">
              {cafe?.name || "Cafe Menu"}
            </h1>
            {cafe?.description && (
              <p className="text-[10px] text-stone-500 truncate leading-tight mt-0.5">
                {cafe.description.substring(0, 40)}
              </p>
            )}
          </div>
        </div>

        {/* Right side: Table badge & Cart button */}
        <div className="flex items-center gap-2">
          {tableNumber && (
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-800 border border-amber-200/60">
              <QrCode className="h-3 w-3 text-amber-600" />
              <span>Table {tableNumber}</span>
            </div>
          )}

          <button
            onClick={() => setIsCartOpen(true)}
            aria-label="Open cart"
            className={cn(
              "relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50",
              itemCount > 0
                ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 active:scale-95"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            )}
          >
            <ShoppingBag className="h-[18px] w-[18px]" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-amber-700 shadow-sm ring-2 ring-amber-500/30 animate-in zoom-in-50">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
