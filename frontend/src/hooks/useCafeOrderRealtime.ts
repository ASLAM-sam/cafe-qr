"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import * as Ably from "ably";
import { Order, OrderStatus } from "@/types";
import { adminService } from "@/services/apiClient";
import { getAdminAblyClient } from "@/services/ablyClient";

interface RealtimeOrderPayload {
  event: string;
  order_id: string;
  order_number: string;
  order_reference?: string;
  cafe_id: string;
  table_id?: string;
  table_number?: string;
  order_type: "DINE_IN" | "TAKEAWAY";
  customer_name?: string;
  customer_phone?: string;
  order_status?: OrderStatus;
  status?: OrderStatus;
  total: number;
  subtotal?: number;
  tax?: number;
  items?: {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }[];
  created_at: string;
  updated_at?: string;
}

export function useCafeOrderRealtime(cafeId?: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<
    "connected" | "connecting" | "disconnected" | "failed"
  >("connecting");
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Track orders ref to avoid stale closures in event handlers
  const ordersRef = useRef<Order[]>([]);
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  const fetchOrders = useCallback(async () => {
    try {
      setError(null);
      const data = await adminService.getOrders();
      // Ensure newest first sorting by server created_at timestamp
      const sorted = [...(data || [])].sort((a, b) => {
        const timeA = new Date(a.created_at).getTime() || 0;
        const timeB = new Date(b.created_at).getTime() || 0;
        return timeB - timeA;
      });
      setOrders(sorted);
      setLastRefreshed(new Date());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load orders.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Manual refresh also attempts to reconnect Ably if currently disconnected
  const handleRefresh = useCallback(async () => {
    try {
      const client = getAdminAblyClient();
      if (
        client &&
        client.connection.state !== "connected" &&
        client.connection.state !== "connecting"
      ) {
        client.connection.connect();
      }
    } catch {
      // Ignore Ably client reconnect error during manual refresh
    }
    await fetchOrders();
  }, [fetchOrders]);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Subscribe to Ably real-time channel
  useEffect(() => {
    if (!cafeId) return;

    let client: Ably.Realtime | null = null;
    let channel: Ably.RealtimeChannel | null = null;

    try {
      client = getAdminAblyClient();
      const channelName = `cafe:${cafeId}:orders`;
      channel = client.channels.get(channelName);

      const handleConnectionChange = (stateChange: Ably.ConnectionStateChange) => {
        if (stateChange.current === "connected") {
          setConnectionState("connected");
          // On reconnect from disconnected/suspended/failed, reconcile orders with server
          if (
            stateChange.previous === "disconnected" ||
            stateChange.previous === "suspended" ||
            stateChange.previous === "failed"
          ) {
            fetchOrders();
          }
        } else if (stateChange.current === "connecting") {
          setConnectionState("connecting");
        } else if (
          stateChange.current === "disconnected" ||
          stateChange.current === "suspended"
        ) {
          setConnectionState("disconnected");
        } else if (stateChange.current === "failed") {
          setConnectionState("failed");
        }
      };

      client.connection.on(handleConnectionChange);

      // Initialize state from existing connection
      if (client.connection.state === "connected") {
        setConnectionState("connected");
      } else if (client.connection.state === "connecting") {
        setConnectionState("connecting");
      } else if (
        client.connection.state === "disconnected" ||
        client.connection.state === "suspended"
      ) {
        setConnectionState("disconnected");
      } else if (client.connection.state === "failed") {
        setConnectionState("failed");
      }

      // Handle real-time order events
      const handleOrderEvent = (message: Ably.Message) => {
        const payload = message.data as RealtimeOrderPayload;
        if (!payload || !payload.order_id) return;

        setOrders((prevOrders) => {
          const resolvedStatus = (payload.order_status ||
            payload.status ||
            "PLACED") as OrderStatus;

          const existingIndex = prevOrders.findIndex(
            (o) =>
              o.order_id === payload.order_id ||
              (payload.order_reference &&
                o.order_reference === payload.order_reference)
          );

          if (message.name === "NEW_ORDER") {
            // Deduplicate: if order already exists in state, update status and total
            if (existingIndex !== -1) {
              const updated = [...prevOrders];
              updated[existingIndex] = {
                ...updated[existingIndex],
                order_status: resolvedStatus,
                total: payload.total ?? updated[existingIndex].total,
                table_number:
                  payload.table_number || updated[existingIndex].table_number,
              };
              return updated;
            }

            // Construct new order entry with server timestamp
            const newOrder: Order = {
              order_id: payload.order_id,
              order_number: payload.order_number,
              order_reference: payload.order_reference,
              cafe_id: payload.cafe_id,
              table_id: payload.table_id,
              table_number: payload.table_number,
              order_type: payload.order_type || "DINE_IN",
              customer_name: payload.customer_name,
              customer_phone: payload.customer_phone,
              items: payload.items || [],
              subtotal: payload.subtotal ?? payload.total,
              tax: payload.tax ?? 0,
              discount: 0,
              total: payload.total,
              payment_status: "PENDING",
              order_status: resolvedStatus,
              created_at: payload.created_at || new Date().toISOString(),
              updated_at:
                payload.updated_at ||
                payload.created_at ||
                new Date().toISOString(),
            };

            // Prepend new order and maintain newest-first order
            const merged = [newOrder, ...prevOrders];
            return merged.sort((a, b) => {
              const timeA = new Date(a.created_at).getTime() || 0;
              const timeB = new Date(b.created_at).getTime() || 0;
              return timeB - timeA;
            });
          }

          // Status update events (ORDER_ACCEPTED, ORDER_PREPARING, ORDER_READY, ORDER_COMPLETED, ORDER_CANCELLED)
          if (existingIndex !== -1) {
            const updated = [...prevOrders];
            updated[existingIndex] = {
              ...updated[existingIndex],
              order_status: resolvedStatus,
              updated_at: payload.updated_at || new Date().toISOString(),
            };
            return updated;
          }

          // If order wasn't in state (e.g. initial fetch missed it), re-fetch authoritative list
          fetchOrders();
          return prevOrders;
        });
      };

      channel.subscribe(handleOrderEvent);

      return () => {
        if (channel) {
          channel.unsubscribe(handleOrderEvent);
        }
        if (client) {
          client.connection.off(handleConnectionChange);
        }
      };
    } catch (err) {
      console.error("Failed to initialize Ably connection:", err);
      setConnectionState("disconnected");
    }
  }, [cafeId, fetchOrders]);

  return {
    orders,
    loading,
    error,
    connectionState,
    lastRefreshed,
    refreshOrders: handleRefresh,
    setOrders,
  };
}
