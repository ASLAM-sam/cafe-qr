"use client";

import { useState, useEffect, useCallback } from "react";
import * as Ably from "ably";
import { Order, OrderStatus } from "@/types";
import { customerService } from "@/services/apiClient";
import { getCustomerAblyClient, closeCustomerAblyClient } from "@/services/ablyClient";

export function useCustomerOrderRealtime(subdomain: string, orderReference?: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<"connected" | "connecting" | "disconnected">("connecting");

  const fetchOrder = useCallback(async () => {
    if (!orderReference || !subdomain) return;
    try {
      setError(null);
      const data = await customerService.getOrderStatus(subdomain, orderReference);
      setOrder(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load order status.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [subdomain, orderReference]);

  // Initial fetch
  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Subscribe to customer-specific Ably order channel
  useEffect(() => {
    if (!orderReference) return;

    let client: Ably.Realtime | null = null;
    let channel: Ably.RealtimeChannel | null = null;

    try {
      client = getCustomerAblyClient(orderReference);
      const channelName = `order:${orderReference}`;
      channel = client.channels.get(channelName);

      const handleConnectionChange = (stateChange: Ably.ConnectionStateChange) => {
        if (stateChange.current === "connected") {
          setConnectionState("connected");
          if (stateChange.previous === "disconnected" || stateChange.previous === "suspended") {
            fetchOrder();
          }
        } else if (stateChange.current === "connecting") {
          setConnectionState("connecting");
        } else {
          setConnectionState("disconnected");
        }
      };

      client.connection.on(handleConnectionChange);
      if (client.connection.state === "connected") {
        setConnectionState("connected");
      }

      const handleOrderUpdate = (message: Ably.Message) => {
        const payload = message.data as { status?: OrderStatus; event?: string };
        if (payload?.status) {
          setOrder((prev) => (prev ? { ...prev, order_status: payload.status! } : prev));
        } else {
          // Re-fetch authoritative state
          fetchOrder();
        }
      };

      channel.subscribe(handleOrderUpdate);

      return () => {
        if (channel) {
          channel.unsubscribe(handleOrderUpdate);
        }
        if (client) {
          client.connection.off(handleConnectionChange);
        }
        closeCustomerAblyClient(orderReference);
      };
    } catch (err) {
      console.error("Failed to initialize customer Ably connection:", err);
      setConnectionState("disconnected");
    }
  }, [orderReference, fetchOrder]);

  return {
    order,
    loading,
    error,
    connectionState,
    refreshOrder: fetchOrder,
  };
}
