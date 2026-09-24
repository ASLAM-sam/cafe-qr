"use client";

import * as React from "react";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { formatCurrency, cn, cloudinaryUrl } from "@/lib/utils";
import { Plus, Minus, Utensils } from "lucide-react";
import Image from "next/image";

export interface ProductCardProps {
  product: Product;
  currency?: string;
  onViewDetail?: (product: Product) => void;
}

export function ProductCard({ product, currency = "INR", onViewDetail }: ProductCardProps) {
  const { items, addItem, updateQuantity } = useCart();
  const cartItem = items.find((i) => i.product_id === product.product_id);
  const quantity = cartItem?.quantity || 0;
  const [justAdded, setJustAdded] = React.useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.is_available) return;
    addItem(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 600);
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateQuantity(product.product_id, 1);
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateQuantity(product.product_id, -1);
  };

  // Optimized Cloudinary image URL
  const optimizedImageUrl = product.image_url
    ? cloudinaryUrl(product.image_url, 300, 300, 80)
    : null;

  return (
    <div
      className={cn(
        "group relative flex gap-3 rounded-2xl bg-white border border-stone-200/70 p-3 transition-all duration-200",
        "hover:shadow-md hover:shadow-stone-200/50 hover:border-stone-300/70",
        !product.is_available && "opacity-50 grayscale-[30%]",
        quantity > 0 && "border-amber-300/60 ring-1 ring-amber-100 bg-amber-50/20"
      )}
      onClick={() => onViewDetail?.(product)}
      role={onViewDetail ? "button" : undefined}
      tabIndex={onViewDetail ? 0 : undefined}
    >
      {/* Product Information */}
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div>
          <h3 className="text-sm font-semibold text-stone-900 tracking-tight leading-snug line-clamp-2">
            {product.name}
          </h3>
          {product.description && (
            <p className="mt-1 text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        <div className="mt-2.5 flex items-end justify-between">
          <span className="text-[15px] font-bold text-stone-900">
            {formatCurrency(product.price, currency)}
          </span>

          {/* Add to Cart / Quantity controls */}
          {product.is_available ? (
            quantity > 0 ? (
              <div className="flex items-center gap-0 rounded-xl bg-stone-900 p-0.5 shadow-sm">
                <button
                  type="button"
                  onClick={handleDecrease}
                  aria-label="Decrease quantity"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition active:scale-90"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-6 text-center text-xs font-bold text-white tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={handleIncrease}
                  aria-label="Increase quantity"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition active:scale-90"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                className={cn(
                  "inline-flex h-8 items-center justify-center rounded-xl border-2 border-amber-600 px-4 text-xs font-bold text-amber-700 transition-all duration-200",
                  "hover:bg-amber-600 hover:text-white active:scale-95",
                  justAdded && "bg-amber-600 text-white scale-95"
                )}
              >
                ADD
              </button>
            )
          ) : (
            <span className="text-[11px] font-medium text-stone-400 bg-stone-100 px-2 py-1 rounded-lg">
              Sold Out
            </span>
          )}
        </div>
      </div>

      {/* Product Image */}
      <div className="relative h-[100px] w-[100px] shrink-0 overflow-hidden rounded-xl bg-stone-100">
        {optimizedImageUrl ? (
          <Image
            src={optimizedImageUrl}
            alt={product.name}
            fill
            sizes="100px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-300">
            <Utensils className="h-7 w-7" />
          </div>
        )}

        {/* Quantity badge on image */}
        {quantity > 0 && (
          <div className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white shadow-sm animate-in zoom-in-50 duration-200">
            {quantity}
          </div>
        )}
      </div>
    </div>
  );
}
