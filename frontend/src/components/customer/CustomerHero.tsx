"use client";

import * as React from "react";
import { useTenant } from "@/context/TenantContext";
import { Coffee, MapPin, Clock } from "lucide-react";
import Image from "next/image";

export function CustomerHero() {
  const { cafe, tableNumber } = useTenant();

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-stone-50 to-white">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="relative px-5 pt-5 pb-4">
        <div className="flex items-start gap-4">
          {/* Brand Logo - larger for hero */}
          <div className="relative h-16 w-16 overflow-hidden rounded-2xl shadow-lg shrink-0 border border-stone-200/60">
            {cafe?.logo ? (
              <Image
                src={cafe.logo}
                alt={cafe.name || "Cafe Logo"}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-600 to-orange-700 text-white">
                <Coffee className="h-8 w-8" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Cafe Title */}
            <h2 className="text-lg font-bold tracking-tight text-stone-900 leading-tight">
              {cafe?.name || "Welcome"}
            </h2>

            {cafe?.description && (
              <p className="mt-1 text-xs text-stone-500 line-clamp-2 leading-relaxed">
                {cafe.description}
              </p>
            )}

            {/* Metadata row */}
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {cafe?.address && (
                <span className="flex items-center gap-1 text-[11px] text-stone-400">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate max-w-[150px]">{cafe.address}</span>
                </span>
              )}
              {cafe?.phone && (
                <span className="flex items-center gap-1 text-[11px] text-stone-400">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span>Open Now</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Table Context Badge */}
        {tableNumber && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold text-amber-900">
              {tableNumber.toLowerCase().startsWith("table")
                ? tableNumber
                : `Table ${tableNumber}`}{" "}
              — Dine In
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
