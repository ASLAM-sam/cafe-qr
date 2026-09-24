"use client";

import * as React from "react";
import { useCart } from "@/context/CartContext";
import { useTenant } from "@/context/TenantContext";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, cn, cloudinaryUrl } from "@/lib/utils";
import { ShoppingBag, Trash2, Plus, Minus, QrCode, Utensils } from "lucide-react";
import { customerService } from "@/services/apiClient";
import { Order } from "@/types";
import Image from "next/image";

export interface CartDrawerProps {
  onOrderPlaced?: (order: Order) => void;
}

export function CartDrawer({ onOrderPlaced }: CartDrawerProps) {
  const {
    items,
    itemCount,
    subtotal,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();
  const { cafe, tableNumber, tableToken, tableId, subdomain } = useTenant();

  const [customerName, setCustomerName] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("");
  const [orderType, setOrderType] = React.useState<"DINE_IN" | "TAKEAWAY">(
    tableNumber ? "DINE_IN" : "TAKEAWAY"
  );

  React.useEffect(() => {
    if (tableNumber) {
      setOrderType("DINE_IN");
    }
  }, [tableNumber]);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const idempotencyKey = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `ord_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const orderPayload = {
        table_id: tableId || undefined,
        table_token: tableToken || undefined,
        order_type: orderType,
        customer_name: customerName.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        idempotency_key: idempotencyKey,
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })),
      };

      const placedOrder = await customerService.createOrder(
        subdomain || "default",
        orderPayload
      );

      clearCart();
      setIsCartOpen(false);
      if (onOrderPlaced) {
        onOrderPlaced(placedOrder);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to place order. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate tax preview
  const taxEnabled = cafe?.tax_settings?.tax_enabled;
  const taxRate = cafe?.tax_settings?.tax_rate_percent || 0;
  const taxAmount = taxEnabled ? (subtotal * taxRate) / 100 : 0;
  const estimatedTotal = subtotal + taxAmount;

  return (
    <Drawer
      isOpen={isCartOpen}
      onClose={() => setIsCartOpen(false)}
      title="Your Order"
      description={
        tableNumber
          ? `Dine-in at ${tableNumber.toLowerCase().startsWith("table") ? tableNumber : `Table ${tableNumber}`}`
          : cafe?.name || "Order Summary"
      }
      side="bottom"
    >
      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Browse our menu and pick something delicious to add to your order."
          actionLabel="Browse Menu"
          onAction={() => setIsCartOpen(false)}
        />
      ) : (
        <form onSubmit={handlePlaceOrder} className="space-y-4 pb-6">
          {/* Item List */}
          <div className="max-h-60 overflow-y-auto -mx-1 px-1">
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.product_id}
                  className="flex items-center gap-3 rounded-xl bg-stone-50 border border-stone-200/60 p-2.5"
                >
                  {/* Item thumbnail */}
                  <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-stone-200 shrink-0">
                    {item.image_url ? (
                      <Image
                        src={cloudinaryUrl(item.image_url, 100, 100, 60)}
                        alt={item.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-stone-400">
                        <Utensils className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-stone-900 truncate">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {formatCurrency(item.price, cafe?.currency)} each
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-0 rounded-lg bg-stone-900 p-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product_id, -1)}
                      className="flex h-6 w-6 items-center justify-center rounded-md text-white/90 hover:bg-white/10 active:scale-90 transition"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center text-xs font-bold text-white tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product_id, 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-md text-white/90 hover:bg-white/10 active:scale-90 transition"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <span className="text-xs font-bold text-stone-900 min-w-12 text-right tabular-nums">
                    {formatCurrency(item.price * item.quantity, cafe?.currency)}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeItem(item.product_id)}
                    className="text-stone-400 hover:text-rose-600 transition p-1"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Subtotal & Totals */}
          <div className="rounded-xl bg-amber-50/50 p-3.5 border border-amber-200/40 space-y-1.5 text-xs">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal ({itemCount} items)</span>
              <span className="tabular-nums">{formatCurrency(subtotal, cafe?.currency)}</span>
            </div>
            {taxEnabled && (
              <div className="flex justify-between text-stone-600">
                <span>Tax ({taxRate}%)</span>
                <span className="tabular-nums">
                  {formatCurrency(taxAmount, cafe?.currency)}
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold text-stone-900 text-sm pt-2 border-t border-amber-200/60">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(estimatedTotal, cafe?.currency)}</span>
            </div>
            <p className="text-[10px] text-stone-400 pt-0.5">
              *Final total will be confirmed by the cafe.
            </p>
          </div>

          {/* Customer Details */}
          <div className="space-y-3 pt-1">
            <h5 className="text-xs font-semibold text-stone-700">
              Your Details (Optional)
            </h5>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Your Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                autoComplete="name"
              />
              <Input
                placeholder="Phone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>

            {!tableNumber && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType("DINE_IN")}
                  className={cn(
                    "flex-1 py-2 rounded-xl border text-xs font-semibold transition-all",
                    orderType === "DINE_IN"
                      ? "bg-stone-900 text-white border-stone-900 shadow-sm"
                      : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                  )}
                >
                  Dine In
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType("TAKEAWAY")}
                  className={cn(
                    "flex-1 py-2 rounded-xl border text-xs font-semibold transition-all",
                    orderType === "TAKEAWAY"
                      ? "bg-stone-900 text-white border-stone-900 shadow-sm"
                      : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                  )}
                >
                  Takeaway
                </button>
              </div>
            )}

            {tableNumber && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200/60 px-3 py-2.5 text-xs text-amber-800">
                <QrCode className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="font-medium">
                  Ordering for{" "}
                  {tableNumber.toLowerCase().startsWith("table")
                    ? tableNumber
                    : `Table ${tableNumber}`}
                </span>
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              {errorMessage}
            </div>
          )}

          {/* Submit Actions */}
          <div className="pt-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCartOpen(false)}
              className="flex-1"
            >
              Add More
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="flex-1 !bg-gradient-to-r !from-amber-600 !to-orange-600 !border-0 !shadow-lg !shadow-amber-600/20"
            >
              Place Order
            </Button>
          </div>
        </form>
      )}
    </Drawer>
  );
}
