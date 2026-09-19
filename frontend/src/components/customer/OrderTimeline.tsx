"use client";

import * as React from "react";
import { Order, OrderStatus } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle2, Clock, Check, Coffee, Wifi, WifiOff } from "lucide-react";
import { useCustomerOrderRealtime } from "@/hooks/useCustomerOrderRealtime";
import { useTenant } from "@/context/TenantContext";

export interface OrderTimelineProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

const ORDER_STEPS: { status: OrderStatus; label: string }[] = [
  { status: "PLACED", label: "Order Placed" },
  { status: "ACCEPTED", label: "Accepted" },
  { status: "PREPARING", label: "Preparing" },
  { status: "READY", label: "Ready for Pickup/Serving" },
  { status: "COMPLETED", label: "Completed" },
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Order #${order.order_number}`}
      description={
        order.table_number
          ? `Table ${order.table_number}`
          : "Customer Order Tracking"
      }
      maxWidth="md"
    >
      <div className="space-y-6">
        {/* Status Header Badge */}
        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3.5 border border-slate-200">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">Current Status</span>
              {connectionState === "connected" ? (
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  Syncing
                </span>
              )}
            </div>
            <span className="text-sm font-bold text-slate-900">
              {order.order_status}
            </span>
          </div>
          <Badge status={order.order_status} />
        </div>

        {/* Timeline Steps */}
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {ORDER_STEPS.map((step, idx) => {
            const isCompleted = currentStepIndex >= idx;
            const isCurrent = currentStepIndex === idx;

            return (
              <div key={step.status} className="relative flex items-center gap-3">
                {/* Step indicator dot */}
                <div
                  className={`absolute -left-6 flex h-5 w-5 items-center justify-center rounded-full border-2 bg-white transition-colors duration-200 ${
                    isCurrent
                      ? "border-slate-900 bg-slate-900 text-white"
                      : isCompleted
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 text-transparent"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                  )}
                </div>

                <div>
                  <p
                    className={`text-xs font-semibold ${
                      isCurrent
                        ? "text-slate-900"
                        : isCompleted
                        ? "text-slate-700"
                        : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </p>
                  {isCurrent && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-sky-600 font-medium mt-0.5">
                      <Clock className="h-3 w-3" />
                      In progress...
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Items summary */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-2 text-xs">
          <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
            <Coffee className="h-3.5 w-3.5 text-slate-500" />
            Ordered Items
          </div>
          <div className="divide-y divide-slate-100">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between py-1.5 text-slate-600">
                <span>
                  {item.quantity} × {item.product_name}
                </span>
                <span className="font-medium text-slate-800">
                  {formatCurrency(item.subtotal)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Your order has been recorded in the café system.
          </p>
        </div>
      </div>
    </Modal>
  );
}
