"use client";

import * as React from "react";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { formatCurrency, cn, cloudinaryUrl } from "@/lib/utils";
import { Plus, Minus, X, Utensils } from "lucide-react";
import Image from "next/image";

export interface ProductDetailModalProps {
  product: Product | null;
  currency?: string;
  onClose: () => void;
}

export function ProductDetailModal({
  product,
  currency = "INR",
  onClose,
}: ProductDetailModalProps) {
  const { items, addItem, updateQuantity } = useCart();

  if (!product) return null;

  const cartItem = items.find((i) => i.product_id === product.product_id);
  const quantity = cartItem?.quantity || 0;
  const optimizedImageUrl = product.image_url
    ? cloudinaryUrl(product.image_url, 600, 400, 80)
    : null;

  const handleAdd = () => {
    if (!product.is_available) return;
    addItem(product);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet from bottom */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col max-h-[85vh] rounded-t-3xl bg-white shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Close Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-stone-300" />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm text-stone-500 hover:bg-stone-100 transition"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Product Image */}
          {optimizedImageUrl ? (
            <div className="relative w-full aspect-[3/2] bg-stone-100">
              <Image
                src={optimizedImageUrl}
                alt={product.name}
                fill
                sizes="100vw"
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <div className="w-full aspect-[3/2] bg-stone-100 flex items-center justify-center">
              <Utensils className="h-12 w-12 text-stone-300" />
            </div>
          )}

          {/* Product Info */}
          <div className="px-5 pt-4 pb-6 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-stone-900 tracking-tight">
                {product.name}
              </h2>
              <p className="text-lg font-bold text-amber-700 mt-1">
                {formatCurrency(product.price, currency)}
              </p>
            </div>

            {product.description && (
              <div className="rounded-xl bg-stone-50 border border-stone-200/60 p-3.5">
                <p className="text-sm text-stone-600 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {!product.is_available && (
              <div className="rounded-xl bg-rose-50 border border-rose-200/60 p-3 text-sm text-rose-700 font-medium text-center">
                This item is currently sold out
              </div>
            )}
          </div>
        </div>

        {/* Bottom Action Bar */}
        {product.is_available && (
          <div className="border-t border-stone-200/60 bg-white px-5 py-4 safe-bottom">
            {quantity > 0 ? (
              <div className="flex items-center justify-between">
                {/* Quantity stepper */}
                <div className="flex items-center gap-0 rounded-xl bg-stone-900 p-1">
                  <button
                    type="button"
                    onClick={() => updateQuantity(product.product_id, -1)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10 transition active:scale-90"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center text-base font-bold text-white tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(product.product_id, 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10 transition active:scale-90"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Total for this item */}
                <div className="text-right">
                  <span className="text-xs text-stone-500 block">Item Total</span>
                  <span className="text-base font-bold text-stone-900 tabular-nums">
                    {formatCurrency(product.price * quantity, currency)}
                  </span>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                className={cn(
                  "w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200",
                  "bg-gradient-to-r from-amber-600 to-orange-600 shadow-lg shadow-amber-600/20",
                  "hover:shadow-xl hover:shadow-amber-600/30 active:scale-[0.98]"
                )}
              >
                Add to Cart — {formatCurrency(product.price, currency)}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
