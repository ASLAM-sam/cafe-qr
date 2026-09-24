"use client";

import * as React from "react";
import { useTenant } from "@/context/TenantContext";
import { useCart } from "@/context/CartContext";
import { ShoppingBag, Coffee, QrCode } from "lucide-react";
import Image from "next/image";

export function CustomerHeader() {
  const { cafe, tableNumber } = useTenant();
  const { itemCount, setIsCartOpen } = useCart();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        {/* Cafe Logo & Name */}
        <div className="flex items-center gap-2.5 overflow-hidden">
          {cafe?.logo ? (
            <div className="relative h-8 w-8 overflow-hidden rounded-full border border-slate-200 shrink-0">
              <Image
                src={cafe.logo}
                alt={cafe.name || "Cafe Logo"}
                fill
                sizes="32px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white shrink-0">
              <Coffee className="h-4 w-4" />
            </div>
          )}
          <div className="truncate">
            <h1 className="text-sm font-bold text-slate-900 truncate tracking-tight">
              {cafe?.name || "Cafe Menu"}
            </h1>
          </div>
        </div>

        {/* Right side: Table badge & Cart button */}
        <div className="flex items-center gap-2">
          {tableNumber && (
            <div className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200">
              <QrCode className="h-3 w-3 text-slate-500" />
              <span>Table {tableNumber}</span>
            </div>
          )}

          <button
            onClick={() => setIsCartOpen(true)}
            aria-label="Open cart"
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <ShoppingBag className="h-4 w-4" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-50">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
