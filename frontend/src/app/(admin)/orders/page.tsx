"use client";

import * as React from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { OrderRowSkeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { adminService } from "@/services/apiClient";
import { Order, OrderStatus } from "@/types";
import {
  ShoppingBag,
  RefreshCw,
  AlertTriangle,
  Clock,
  MapPin,
  User,
  Hash,
  Store,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import {
  formatOrderDateTime,
  formatOrderDate,
  formatOrderTime,
  formatOrderTableContext,
} from "@/lib/orderFormatters";
import { useCafeOrderRealtime } from "@/hooks/useCafeOrderRealtime";
import { useTenant } from "@/context/TenantContext";

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "All Orders", value: "ALL" },
  { label: "Pending", value: "PLACED" },
  { label: "Accepted", value: "ACCEPTED" },
  { label: "Preparing", value: "PREPARING" },
  { label: "Ready", value: "READY" },
  { label: "Completed", value: "COMPLETED" },
];

export default function AdminOrdersPage() {
  const { cafe } = useTenant();
  const [currentCafeId, setCurrentCafeId] = React.useState<string | undefined>(cafe?.cafe_id);
  const [cafeDisplayName, setCafeDisplayName] = React.useState<string>(cafe?.name || "");
  const [selectedFilter, setSelectedFilter] = React.useState("ALL");
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // If cafe context is not yet loaded, retrieve from auth /me
  React.useEffect(() => {
    if (cafe?.cafe_id) {
      setCurrentCafeId(cafe.cafe_id);
      if (cafe.name) setCafeDisplayName(cafe.name);
    } else {
      adminService
        .getMe()
        .then((res) => {
          if (res?.user?.cafe_id) {
            setCurrentCafeId(res.user.cafe_id);
          }
          if (res?.cafe?.name) {
            setCafeDisplayName(res.cafe.name);
          }
        })
        .catch(() => {
          // Unauthenticated or waiting for session
        });
    }
  }, [cafe]);

  const {
    orders,
    loading: isLoading,
    error: loadError,
    connectionState,
    refreshOrders,
    setOrders,
  } = useCafeOrderRealtime(currentCafeId);

  const filteredOrders = React.useMemo(() => {
    if (selectedFilter === "ALL") return orders;
    return orders.filter((o) => o.order_status === selectedFilter);
  }, [orders, selectedFilter]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshOrders();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStatusTransition = async (orderId: string, nextStatus: OrderStatus) => {
    setIsUpdatingStatus(true);
    setActionError(null);
    try {
      const updated = await adminService.updateOrderStatus(orderId, nextStatus);
      setOrders((prev) =>
        prev.map((o) => (o.order_id === orderId ? updated : o))
      );
      if (selectedOrder?.order_id === orderId) {
        setSelectedOrder(updated);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to update order status.";
      setActionError(msg);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const cafeTitle = cafeDisplayName || cafe?.name || "Apex Cafe";

  return (
    <div className="space-y-6">
      {/* Top Header with Cafe Context & Live Connection Status */}
      <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-center sm:justify-between border-b border-[oklch(1_0_0/8%)]">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[oklch(0.62_0.27_305/15%)] text-[oklch(0.85_0.15_305)] border border-[oklch(0.62_0.27_305/30%)]">
              <Store className="h-3 w-3" />
              <span>{cafeTitle}</span>
            </span>

            {/* Live / Reconnecting / Offline Pill */}
            {connectionState === "connected" ? (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30"
                title="Connected to Ably real-time stream"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live</span>
              </span>
            ) : connectionState === "connecting" ? (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-500/30"
                title="Establishing live connection..."
              >
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Reconnecting...</span>
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-500/30"
                title="Live updates disconnected"
              >
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span>Offline</span>
              </span>
            )}
          </div>

          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Orders
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[oklch(0.70_0.03_280)]">
            Monitor and manage real-time table orders from customers.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="gap-1.5 bg-[oklch(0.18_0.025_280)] border-[oklch(1_0_0/12%)] hover:bg-[oklch(0.22_0.03_280)] text-white text-xs"
            title="Refresh orders manually"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </Button>
        </div>
      </div>

      {/* Offline Sync Disconnection Warning Banner */}
      {(connectionState === "disconnected" || connectionState === "failed") && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-amber-950/40 border border-amber-500/30 p-3.5 text-xs text-amber-200">
          <div className="flex items-start sm:items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5 sm:mt-0" />
            <span>
              Live updates are temporarily disconnected. You can continue managing orders normally and use the Refresh button to pull latest data.
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleManualRefresh}
            className="self-start sm:self-auto shrink-0 text-xs py-1 h-7 border-amber-500/40 hover:bg-amber-500/10 text-amber-200"
          >
            Retry Connection
          </Button>
        </div>
      )}

      {actionError && (
        <div className="rounded-xl bg-rose-950/40 border border-rose-500/30 p-3 text-xs text-rose-300">
          {actionError}
        </div>
      )}

      {loadError && (
        <div className="rounded-xl bg-rose-950/40 border border-rose-500/30 p-3 text-xs text-rose-300">
          {loadError}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[oklch(1_0_0/8%)] pb-3 no-scrollbar">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setSelectedFilter(f.value)}
            className={cn(
              "rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 shrink-0",
              selectedFilter === f.value
                ? "bg-gradient-to-r from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] text-white shadow-md shadow-[oklch(0.62_0.27_305/20%)] font-bold"
                : "bg-[oklch(0.18_0.025_280)] text-[oklch(0.70_0.03_280)] border border-[oklch(1_0_0/8%)] hover:bg-[oklch(0.22_0.03_280)] hover:text-white"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders List / Empty State */}
      {isLoading ? (
        <div className="space-y-3">
          <OrderRowSkeleton />
          <OrderRowSkeleton />
          <OrderRowSkeleton />
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders found"
          description={
            selectedFilter === "ALL"
              ? "When customers scan table QR codes and place orders, they will appear here in real time."
              : `No orders currently in the ${selectedFilter.toLowerCase()} status.`
          }
          actionLabel={selectedFilter !== "ALL" ? "View All Orders" : undefined}
          onAction={selectedFilter !== "ALL" ? () => setSelectedFilter("ALL") : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const tableAndType = formatOrderTableContext(order);
            const formattedTime = formatOrderDateTime(order.created_at);

            return (
              <div
                key={order.order_id}
                onClick={() => setSelectedOrder(order)}
                className="group flex flex-col justify-between rounded-2xl border border-[oklch(1_0_0/10%)] bg-[oklch(0.18_0.025_280)] p-5 shadow-xl hover:border-[oklch(0.62_0.27_305/50%)] hover:shadow-2xl hover:shadow-[oklch(0.62_0.27_305/10%)] transition-all cursor-pointer"
              >
                {/* Top Row: Order #, Table/Type, Time, Status */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 px-2.5 items-center justify-center rounded-lg bg-[oklch(0.62_0.27_305/15%)] border border-[oklch(0.62_0.27_305/30%)] text-[oklch(0.85_0.15_305)] font-bold text-xs tracking-wider">
                        #{order.order_number}
                      </span>
                      <span className="text-xs font-semibold text-white/90">
                        {tableAndType}
                      </span>
                    </div>

                    <Badge status={order.order_status} />
                  </div>

                  {/* Formatted Date & Time */}
                  <div className="flex items-center gap-1.5 text-xs text-[oklch(0.65_0.03_280)]">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-[oklch(0.62_0.27_305)]" />
                    <span>{formattedTime}</span>
                  </div>

                  {/* Customer Information (if present) */}
                  {order.customer_name && (
                    <div className="flex items-center gap-1.5 text-xs text-[oklch(0.70_0.03_280)]">
                      <User className="h-3 w-3 shrink-0 text-white/50" />
                      <span className="truncate">
                        {order.customer_name}
                        {order.customer_phone ? ` (${order.customer_phone})` : ""}
                      </span>
                    </div>
                  )}

                  {/* Items Preview List */}
                  <div className="divide-y divide-[oklch(1_0_0/6%)] border-y border-[oklch(1_0_0/8%)] py-2 my-2 space-y-1.5">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="pt-1.5 first:pt-0"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/90 truncate mr-2">
                            <span className="font-semibold text-white">
                              {item.quantity} ×
                            </span>{" "}
                            {item.product_name}
                          </span>
                          <span className="font-mono text-[oklch(0.70_0.03_280)] shrink-0">
                            {formatCurrency(item.subtotal)}
                          </span>
                        </div>
                        {item.addons && item.addons.length > 0 && (
                          <div className="text-[10px] text-[oklch(0.85_0.15_305)] pl-4 truncate mt-0.5">
                            {item.addons.map((a) => `+ ${a.addon_item_name}`).join(", ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Row: Total Price and Quick Action Button */}
                <div className="pt-3 mt-1 flex items-center justify-between gap-3 border-t border-[oklch(1_0_0/8%)]">
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-[oklch(0.60_0.03_280)]">
                      Total
                    </span>
                    <span className="text-base font-bold text-white tracking-tight">
                      {formatCurrency(order.total)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {order.order_status === "PLACED" && (
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={isUpdatingStatus}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusTransition(order.order_id, "ACCEPTED");
                        }}
                        className="text-xs px-3 py-1.5 h-8 font-semibold shadow-md shadow-[oklch(0.62_0.27_305/20%)]"
                      >
                        Accept
                      </Button>
                    )}
                    {order.order_status === "ACCEPTED" && (
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={isUpdatingStatus}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusTransition(order.order_id, "PREPARING");
                        }}
                        className="text-xs px-3 py-1.5 h-8 font-semibold"
                      >
                        Prepare
                      </Button>
                    )}
                    {order.order_status === "PREPARING" && (
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={isUpdatingStatus}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusTransition(order.order_id, "READY");
                        }}
                        className="text-xs px-3 py-1.5 h-8 font-semibold"
                      >
                        Mark Ready
                      </Button>
                    )}
                    {order.order_status === "READY" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isUpdatingStatus}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusTransition(order.order_id, "COMPLETED");
                        }}
                        className="text-xs px-3 py-1.5 h-8 font-semibold border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
                      >
                        Complete
                      </Button>
                    )}
                    {order.order_status === "COMPLETED" && (
                      <span className="text-xs font-semibold text-emerald-400 px-2 py-1 rounded-md bg-emerald-950/60 border border-emerald-500/30">
                        Completed
                      </span>
                    )}
                    {order.order_status === "CANCELLED" && (
                      <span className="text-xs font-semibold text-rose-400 px-2 py-1 rounded-md bg-rose-950/60 border border-rose-500/30">
                        Cancelled
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      <Modal
        isOpen={selectedOrder !== null}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Order #${selectedOrder.order_number}` : ""}
        description={
          selectedOrder
            ? formatOrderTableContext(selectedOrder)
            : "Complete Order Details"
        }
        maxWidth="lg"
      >
        {selectedOrder && (
          <div className="space-y-5 text-white">
            {/* Header Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[oklch(0.15_0.02_280)] border border-[oklch(1_0_0/8%)] text-xs">
              <div>
                <span className="block text-[10px] uppercase font-semibold text-[oklch(0.60_0.03_280)]">
                  Status
                </span>
                <div className="mt-1">
                  <Badge status={selectedOrder.order_status} />
                </div>
              </div>

              <div>
                <span className="block text-[10px] uppercase font-semibold text-[oklch(0.60_0.03_280)]">
                  Order Type
                </span>
                <span className="mt-1 block font-semibold text-white/90">
                  {selectedOrder.order_type === "TAKEAWAY" ? "Takeaway" : "Dine-in"}
                </span>
              </div>

              <div>
                <span className="block text-[10px] uppercase font-semibold text-[oklch(0.60_0.03_280)]">
                  Table
                </span>
                <span className="mt-1 block font-semibold text-white/90">
                  {selectedOrder.table_number
                    ? selectedOrder.table_number.toLowerCase().startsWith("table")
                      ? selectedOrder.table_number
                      : `Table ${selectedOrder.table_number.padStart(2, "0")}`
                    : selectedOrder.order_type === "DINE_IN"
                    ? "Table information unavailable"
                    : "N/A (Takeaway)"}
                </span>
              </div>

              <div>
                <span className="block text-[10px] uppercase font-semibold text-[oklch(0.60_0.03_280)]">
                  Order Date
                </span>
                <span className="mt-1 block font-medium text-white/90">
                  {formatOrderDate(selectedOrder.created_at)}
                </span>
              </div>

              <div>
                <span className="block text-[10px] uppercase font-semibold text-[oklch(0.60_0.03_280)]">
                  Order Time
                </span>
                <span className="mt-1 block font-medium text-white/90">
                  {formatOrderTime(selectedOrder.created_at)}
                </span>
              </div>

              <div>
                <span className="block text-[10px] uppercase font-semibold text-[oklch(0.60_0.03_280)]">
                  Cafe
                </span>
                <span className="mt-1 block font-medium text-white/90 truncate">
                  {cafeTitle}
                </span>
              </div>
            </div>

            {/* Customer Details if present */}
            {selectedOrder.customer_name && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[oklch(0.15_0.02_280)] border border-[oklch(1_0_0/8%)] text-xs">
                <User className="h-4 w-4 text-[oklch(0.62_0.27_305)] shrink-0" />
                <div>
                  <span className="font-semibold text-white">
                    {selectedOrder.customer_name}
                  </span>
                  {selectedOrder.customer_phone && (
                    <span className="text-[oklch(0.70_0.03_280)] ml-2">
                      · {selectedOrder.customer_phone}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Order Reference if present */}
            {selectedOrder.order_reference && (
              <div className="flex items-center gap-2 text-xs text-[oklch(0.65_0.03_280)] font-mono">
                <Hash className="h-3.5 w-3.5 shrink-0 text-white/40" />
                <span>Reference: {selectedOrder.order_reference}</span>
              </div>
            )}

            {/* Detailed Items Table */}
            <div>
              <h4 className="text-xs font-semibold text-[oklch(0.70_0.03_280)] uppercase tracking-wider mb-2">
                Order Items
              </h4>
              <div className="rounded-xl border border-[oklch(1_0_0/8%)] bg-[oklch(0.15_0.02_280)] overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="border-b border-[oklch(1_0_0/8%)] bg-[oklch(0.12_0.02_280)] text-[oklch(0.65_0.03_280)]">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Item</th>
                      <th className="py-2.5 px-3 font-semibold text-center">Qty</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Price</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[oklch(1_0_0/6%)]">
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[oklch(1_0_0/3%)]">
                        <td className="py-2.5 px-3 font-medium text-white/90">
                          <div>{item.product_name}</div>
                          {item.addons && item.addons.length > 0 && (
                            <div className="text-[11px] text-[oklch(0.85_0.15_305)] mt-1 space-y-0.5">
                              {item.addons.map((a, aIdx) => (
                                <div key={aIdx} className="flex items-center gap-1.5">
                                  <span className="text-white/40">•</span>
                                  <span>{a.addon_item_name}</span>
                                  {a.price > 0 && (
                                    <span className="text-[oklch(0.70_0.03_280)] font-mono text-[10px]">
                                      (+{formatCurrency(a.price)})
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center text-white/80 font-mono align-top">
                          {item.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right text-[oklch(0.70_0.03_280)] font-mono align-top">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-white font-mono align-top">
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="rounded-xl bg-[oklch(0.15_0.02_280)] border border-[oklch(1_0_0/8%)] p-3.5 space-y-2 text-xs">
              <div className="flex justify-between text-[oklch(0.70_0.03_280)]">
                <span>Subtotal</span>
                <span className="font-mono text-white/90">
                  {formatCurrency(selectedOrder.subtotal)}
                </span>
              </div>
              {selectedOrder.tax > 0 && (
                <div className="flex justify-between text-[oklch(0.70_0.03_280)]">
                  <span>Tax</span>
                  <span className="font-mono text-white/90">
                    {formatCurrency(selectedOrder.tax)}
                  </span>
                </div>
              )}
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount</span>
                  <span className="font-mono">
                    -{formatCurrency(selectedOrder.discount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-[oklch(1_0_0/8%)]">
                <span>Total</span>
                <span className="text-base text-[oklch(0.85_0.15_305)] font-mono">
                  {formatCurrency(selectedOrder.total)}
                </span>
              </div>
            </div>

            {/* Quick Status Action in Modal */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-[oklch(0.18_0.025_280)] border-[oklch(1_0_0/12%)] text-white hover:bg-[oklch(0.22_0.03_280)]"
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </Button>
              {selectedOrder.order_status === "PLACED" && (
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isUpdatingStatus}
                  className="flex-1"
                  onClick={() =>
                    handleStatusTransition(selectedOrder.order_id, "ACCEPTED")
                  }
                >
                  Accept Order
                </Button>
              )}
              {selectedOrder.order_status === "ACCEPTED" && (
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isUpdatingStatus}
                  className="flex-1"
                  onClick={() =>
                    handleStatusTransition(selectedOrder.order_id, "PREPARING")
                  }
                >
                  Start Preparing
                </Button>
              )}
              {selectedOrder.order_status === "PREPARING" && (
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isUpdatingStatus}
                  className="flex-1"
                  onClick={() =>
                    handleStatusTransition(selectedOrder.order_id, "READY")
                  }
                >
                  Mark Ready
                </Button>
              )}
              {selectedOrder.order_status === "READY" && (
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isUpdatingStatus}
                  className="flex-1 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
                  onClick={() =>
                    handleStatusTransition(selectedOrder.order_id, "COMPLETED")
                  }
                >
                  Complete Order
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
