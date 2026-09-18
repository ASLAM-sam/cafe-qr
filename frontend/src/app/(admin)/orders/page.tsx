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
import { ShoppingBag } from "lucide-react";

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "All Orders", value: "ALL" },
  { label: "Pending", value: "PLACED" },
  { label: "Preparing", value: "PREPARING" },
  { label: "Ready", value: "READY" },
  { label: "Completed", value: "COMPLETED" },
];

export default function AdminOrdersPage() {
  const [selectedFilter, setSelectedFilter] = React.useState("ALL");
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);

  const fetchOrders = React.useCallback(async () => {
    try {
      const data = await adminService.getOrders(selectedFilter);
      setOrders(data || []);
    } catch {
      // Zero fake data rule: empty list if unpopulated/error
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFilter]);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusTransition = async (orderId: string, nextStatus: OrderStatus) => {
    setIsUpdatingStatus(true);
    try {
      const updated = await adminService.updateOrderStatus(orderId, nextStatus);
      setOrders((prev) =>
        prev.map((o) => (o.order_id === orderId ? updated : o))
      );
      if (selectedOrder?.order_id === orderId) {
        setSelectedOrder(updated);
      }
    } catch (e) {
      console.error("Status update error", e);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Monitor and manage real-time table orders from customers."
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 pb-3 no-scrollbar">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setSelectedFilter(f.value);
              setIsLoading(true);
            }}
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
      ) : orders.length === 0 ? (
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
          {orders.map((order) => (
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

              <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <span className="text-sm font-bold text-slate-900">
                  {formatCurrency(order.total)}
                </span>
                {order.order_status === "PLACED" && (
                  <Button
                    size="sm"
                    variant="primary"
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

            {/* Quick Status Action */}
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
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
