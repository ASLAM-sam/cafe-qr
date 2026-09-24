"use client";

import * as React from "react";
import { useCart } from "@/context/CartContext";
import { useTenant } from "@/context/TenantContext";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, cn } from "@/lib/utils";
import { ShoppingBag, Trash2, Plus, Minus, QrCode } from "lucide-react";
import { customerService } from "@/services/apiClient";
import { Order } from "@/types";

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
  const { cafe, tableNumber, tableToken, subdomain } = useTenant();

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
        table_id: tableToken || undefined,
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
        <form onSubmit={handlePlaceOrder} className="space-y-5 pb-6">
          {/* Item List */}
          <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={item.product_id}
                className="flex items-center justify-between py-3 gap-2"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-slate-900 truncate">
                    {item.name}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {formatCurrency(item.price, cafe?.currency)} each
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product_id, -1)}
                    className="flex h-5 w-5 items-center justify-center rounded bg-white text-slate-700 shadow-2xs hover:bg-slate-100 active:scale-95"
                  >
                    <Minus className="h-2.5 w-2.5" />
                  </button>
                  <span className="w-4 text-center text-xs font-bold text-slate-900">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product_id, 1)}
                    className="flex h-5 w-5 items-center justify-center rounded bg-white text-slate-700 shadow-2xs hover:bg-slate-100 active:scale-95"
                  >
                    <Plus className="h-2.5 w-2.5" />
                  </button>
                </div>

                <span className="text-xs font-bold text-slate-900 min-w-14 text-right">
                  {formatCurrency(item.price * item.quantity, cafe?.currency)}
                </span>

                <button
                  type="button"
                  onClick={() => removeItem(item.product_id)}
                  className="text-slate-400 hover:text-rose-600 transition p-1"
                  aria-label="Remove item"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Subtotal & Totals */}
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal ({itemCount} items)</span>
              <span>{formatCurrency(subtotal, cafe?.currency)}</span>
            </div>
            {cafe?.tax_settings?.tax_enabled && (
              <div className="flex justify-between text-slate-600">
                <span>Tax ({cafe.tax_settings.tax_rate_percent}%)</span>
                <span>
                  {formatCurrency(
                    (subtotal * cafe.tax_settings.tax_rate_percent) / 100,
                    cafe.currency
                  )}
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold text-slate-900 text-sm pt-2 border-t border-slate-200">
              <span>Total</span>
              <span>
                {formatCurrency(
                  cafe?.tax_settings?.tax_enabled
                    ? subtotal + (subtotal * cafe.tax_settings.tax_rate_percent) / 100
                    : subtotal,
                  cafe?.currency
                )}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 pt-1">
              *Final prices and taxes will be validated server-side by the cafe system.
            </p>
          </div>

          {/* Customer Details */}
          <div className="space-y-3 pt-1">
            <h5 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Customer Details (Optional)
            </h5>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Your Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                autoComplete="name"
              />
              <Input
                placeholder="Phone (optional)"
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
                    "flex-1 py-1.5 rounded-lg border text-xs font-semibold transition",
                    orderType === "DINE_IN"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  Dine In
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType("TAKEAWAY")}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg border text-xs font-semibold transition",
                    orderType === "TAKEAWAY"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  Takeaway
                </button>
              </div>
            )}

            {tableNumber && (
              <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700">
                <QrCode className="h-4 w-4 text-slate-500 shrink-0" />
                <span>
                  Ordering for{" "}
                  {tableNumber.toLowerCase().startsWith("table")
                    ? tableNumber
                    : `Table ${tableNumber}`}
                </span>
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
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
              Continue Ordering
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="flex-1"
            >
              Place Order
            </Button>
          </div>
        </form>
      )}
    </Drawer>
  );
}
