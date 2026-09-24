"use client";

import * as React from "react";
import { Order, OrderStatus } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle2, Clock, Check, Coffee, Package, ChefHat, Bell } from "lucide-react";

import { useCustomerOrderRealtime } from "@/hooks/useCustomerOrderRealtime";
import { useTenant } from "@/context/TenantContext";

export interface OrderTimelineProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

const ORDER_STEPS: { status: OrderStatus; label: string; icon: React.ReactNode; description: string }[] = [
  {
    status: "PLACED",
    label: "Order Placed",
    icon: <Package className="h-3.5 w-3.5" />,
    description: "Your order has been sent to the cafe",
  },
  {
    status: "ACCEPTED",
    label: "Accepted",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    description: "The cafe has confirmed your order",
  },
  {
    status: "PREPARING",
    label: "Preparing",
    icon: <ChefHat className="h-3.5 w-3.5" />,
    description: "Your food is being prepared",
  },
  {
    status: "READY",
    label: "Ready",
    icon: <Bell className="h-3.5 w-3.5" />,
    description: "Your order is ready for pickup",
  },
  {
    status: "COMPLETED",
    label: "Completed",
    icon: <Check className="h-3.5 w-3.5" />,
    description: "Order complete. Thank you!",
  },
];

export function OrderTimeline({ order: initialOrder, isOpen, onClose }: OrderTimelineProps) {
  const { subdomain } = useTenant();
  const orderRef = initialOrder?.order_reference || initialOrder?.order_id;
  const { order: realtimeOrder, connectionState } = useCustomerOrderRealtime(
    subdomain || "default",
    isOpen ? orderRef : undefined
  );

  const order = realtimeOrder || initialOrder;

  if (!order) return null;

  const currentStepIndex = ORDER_STEPS.findIndex(
    (step) => step.status === order.order_status
  );
  const isCancelled = order.order_status === "CANCELLED";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Order #${order.order_number}`}
      description={
        order.table_number
          ? `Table ${order.table_number}`
          : "Order Tracking"
      }
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Status Header */}
        <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 p-4 border border-amber-200/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500">Status</span>
              {connectionState === "connected" ? (
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  Live
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-stone-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
                  Syncing
                </span>
              )}
            </div>
            <span className="text-sm font-bold text-stone-900 mt-0.5 block">
              {isCancelled ? "Cancelled" : order.order_status.replace("_", " ")}
            </span>
          </div>
          <Badge status={order.order_status} />
        </div>

        {/* Timeline Steps */}
        {!isCancelled && (
          <div className="relative pl-8 space-y-5">
            {/* Vertical line */}
            <div className="absolute left-[13px] top-2 bottom-2 w-0.5 bg-stone-200 rounded-full" />

            {ORDER_STEPS.map((step, idx) => {
              const isCompleted = currentStepIndex >= idx;
              const isCurrent = currentStepIndex === idx;

              return (
                <div key={step.status} className="relative flex items-start gap-3">
                  {/* Step indicator */}
                  <div
                    className={`absolute -left-8 flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 transition-all duration-300 ${
                      isCurrent
                        ? "border-amber-500 bg-amber-500 text-white shadow-md shadow-amber-500/30"
                        : isCompleted
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-stone-300 bg-white text-stone-400"
                    }`}
                  >
                    {isCompleted && !isCurrent ? (
                      <Check className="h-3 w-3" />
                    ) : isCurrent ? (
                      step.icon
                    ) : (
                      <div className="h-1.5 w-1.5 rounded-full bg-stone-300" />
                    )}
                  </div>

                  <div className="pt-0.5">
                    <p
                      className={`text-xs font-semibold ${
                        isCurrent
                          ? "text-stone-900"
                          : isCompleted
                          ? "text-stone-700"
                          : "text-stone-400"
                      }`}
                    >
                      {step.label}
                    </p>
                    {(isCurrent || isCompleted) && (
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {step.description}
                      </p>
                    )}
                    {isCurrent && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-medium mt-1">
                        <Clock className="h-3 w-3" />
                        In progress...
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Order Items summary */}
        <div className="rounded-xl border border-stone-200/60 bg-stone-50 p-3.5 space-y-2 text-xs">
          <div className="font-semibold text-stone-900 mb-1.5 flex items-center gap-1.5">
            <Coffee className="h-3.5 w-3.5 text-amber-600" />
            Items Ordered
          </div>
          <div className="divide-y divide-stone-200/60">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between py-1.5 text-stone-600">
                <span>
                  {item.quantity} × {item.product_name}
                </span>
                <span className="font-medium text-stone-800 tabular-nums">
                  {formatCurrency(item.subtotal)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between border-t border-stone-200 pt-2 font-bold text-stone-900 text-sm">
            <span>Total</span>
            <span className="tabular-nums">{formatCurrency(order.total)}</span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-stone-400 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Your order has been recorded in the cafe system.
          </p>
        </div>
      </div>
    </Modal>
  );
}
