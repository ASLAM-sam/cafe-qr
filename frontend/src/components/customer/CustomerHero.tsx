"use client";

import * as React from "react";
import { useTenant } from "@/context/TenantContext";
import { Coffee, MapPin, Phone } from "lucide-react";
import Image from "next/image";

export function CustomerHero() {
  const { cafe, tableNumber } = useTenant();

  return (
    <div className="border-b border-slate-200/60 bg-white px-4 pt-5 pb-4 text-center">
      <div className="mx-auto max-w-sm">
        {/* Brand Logo */}
        <div className="mx-auto mb-2.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm overflow-hidden relative">
          {cafe?.logo ? (
            <Image
              src={cafe.logo}
              alt={cafe.name || "Cafe Logo"}
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            <Coffee className="h-7 w-7 text-slate-100" />
          )}
        </div>

        {/* Cafe Title & Description */}
        <h2 className="text-lg font-bold tracking-tight text-slate-900">
          {cafe?.name || "Welcome to Our Cafe"}
        </h2>

        {/* Table Context Badge */}
        {tableNumber && (
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {tableNumber.toLowerCase().startsWith("table")
                ? tableNumber
                : `Table ${tableNumber}`}{" "}
              • Dine-in
            </span>
          </div>
        )}

        {cafe?.description && (
          <p className="mt-1 text-xs text-slate-500 line-clamp-2">
            {cafe.description}
          </p>
        )}

        {/* Location / Contact details if present */}
        {(cafe?.address || cafe?.phone) && (
          <div className="mt-2.5 flex items-center justify-center gap-3 text-[11px] text-slate-400">
            {cafe.address && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-[140px]">{cafe.address}</span>
              </span>
            )}
            {cafe.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3 shrink-0" />
                <span>{cafe.phone}</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
