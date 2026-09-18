"use client";

import * as React from "react";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { formatCurrency, cn } from "@/lib/utils";
import { Plus, Minus, Utensils } from "lucide-react";
import Image from "next/image";

export interface ProductCardProps {
  product: Product;
  currency?: string;
}

export function ProductCard({ product, currency = "INR" }: ProductCardProps) {
  const { items, addItem, updateQuantity } = useCart();
  const cartItem = items.find((i) => i.product_id === product.product_id);
  const quantity = cartItem?.quantity || 0;

  return (
    <div
      className={cn(
        "group relative flex gap-3.5 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs transition-all duration-150 hover:border-slate-300",
        !product.is_available && "opacity-60 bg-slate-50/70"
      )}
    >
      {/* Product Information */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 tracking-tight leading-snug">
            {product.name}
          </h3>
          {product.description && (
            <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-900">
            {formatCurrency(product.price, currency)}
          </span>

          {/* Add to Cart / Quantity controls */}
          {product.is_available ? (
            quantity > 0 ? (
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => updateQuantity(product.product_id, -1)}
                  aria-label="Decrease quantity"
                  className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-slate-700 shadow-2xs hover:bg-slate-100 transition active:scale-95"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-5 text-center text-xs font-bold text-slate-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateQuantity(product.product_id, 1)}
                  aria-label="Increase quantity"
                  className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-slate-700 shadow-2xs hover:bg-slate-100 transition active:scale-95"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => addItem(product)}
                className="inline-flex h-8 items-center justify-center rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white shadow-2xs hover:bg-slate-800 transition active:scale-95"
              >
                + Add
              </button>
            )
          ) : (
            <span className="text-[11px] font-medium text-slate-400">
              Unavailable
            </span>
          )}
        </div>
      </div>

      {/* Product Image */}
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-100">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="96px"
            className="object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <Utensils className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
}
