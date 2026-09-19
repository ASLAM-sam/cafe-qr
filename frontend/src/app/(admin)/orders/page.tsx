"use client";

import * as React from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { OrderRowSkeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { adminService } from "@/services/apiClient";
import { Order, OrderStatus } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";
import { ShoppingBag, RefreshCw, Wifi, WifiOff, AlertTriangle } from "lucide-react";
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
  const [selectedFilter, setSelectedFilter] = React.useState("ALL");
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  // If cafe_id is not yet in TenantContext, retrieve from auth /me
  React.useEffect(() => {
    if (cafe?.cafe_id) {
      setCurrentCafeId(cafe.cafe_id);
    } else {
      adminService.getMe()
        .then((res) => {
          if (res?.user?.cafe_id) {
            setCurrentCafeId(res.user.cafe_id);
          }
        })
        .catch(() => {
          // Unauthenticated or not loaded yet
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Orders"
          description="Monitor and manage real-time table orders from customers."
        />

        {/* Real-time Connection Status & Refresh */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border",
              connectionState === "connected"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : connectionState === "connecting"
                ? "bg-sky-50 text-sky-700 border-sky-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            )}
            title={
              connectionState === "connected"
                ? "Connected to Ably real-time stream"
                : connectionState === "connecting"
                ? "Establishing live connection..."
                : "Live updates temporarily disconnected"
            }
          >
            {connectionState === "connected" ? (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live</span>
              </>
            ) : connectionState === "connecting" ? (
              <>
                <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-amber-600" />
                <span>Offline Sync</span>
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshOrders()}
            className="gap-1.5"
            title="Refresh orders manually"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {connectionState === "disconnected" && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            Live updates are temporarily disconnected. You can continue managing orders normally and use the Refresh button to pull latest data.
          </span>
        </div>
      )}

      {actionError && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
          {actionError}
        </div>
      )}

      {loadError && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
          {loadError}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 pb-3 no-scrollbar">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setSelectedFilter(f.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 shrink-0",
              selectedFilter === f.value
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
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
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div
              key={order.order_id}
              onClick={() => setSelectedOrder(order)}
              className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-slate-300 transition cursor-pointer gap-3"
            >
              <div className="flex items-start sm:items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-bold text-xs shrink-0">
                  #{order.order_number}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {order.table_number ? `Table ${order.table_number}` : "Takeaway"}
                    </span>
                    <Badge status={order.order_status} />
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {order.items.map((i) => `${i.quantity}x ${i.product_name}`).join(", ")}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <span className="text-sm font-bold text-slate-900">
                  {formatCurrency(order.total)}
                </span>
                {order.order_status === "PLACED" && (
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={isUpdatingStatus}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusTransition(order.order_id, "ACCEPTED");
                    }}
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
                  >
                    Complete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      <Modal
        isOpen={selectedOrder !== null}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Order #${selectedOrder.order_number}` : ""}
        description={
          selectedOrder?.table_number
            ? `Table ${selectedOrder.table_number}`
            : "Order Details"
        }
        maxWidth="md"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs">
              <span className="text-slate-600">Status</span>
              <Badge status={selectedOrder.order_status} />
            </div>

            {selectedOrder.customer_name && (
              <div className="text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Customer: </span>
                {selectedOrder.customer_name}{" "}
                {selectedOrder.customer_phone && `(${selectedOrder.customer_phone})`}
              </div>
            )}

            <div className="divide-y divide-slate-100 border-y border-slate-100 py-2 text-xs">
              {selectedOrder.items.map((item, idx) => (
                <div key={idx} className="flex justify-between py-1.5">
                  <span className="text-slate-700">
                    {item.quantity} × {item.product_name}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1">
              <span>Total</span>
              <span>{formatCurrency(selectedOrder.total)}</span>
            </div>

            {/* Quick Status Actions in Modal */}
            <div className="pt-3 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
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
                  className="flex-1"
                  onClick={() =>
                    handleStatusTransition(selectedOrder.order_id, "COMPLETED")
                  }
                >
                  Mark Completed
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
