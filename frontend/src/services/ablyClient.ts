import * as Ably from "ably";
import { adminService, customerService } from "./apiClient";

let adminAblyClient: Ably.Realtime | null = null;
const customerAblyClients = new Map<string, Ably.Realtime>();

/**
 * Get or create an Ably Realtime client for Café Admin.
 * Uses authCallback requesting scoped token from /api/realtime/token,
 * or fallback to NEXT_PUBLIC_ABLY_CLIENT_KEY if configured.
 */
export function getAdminAblyClient(): Ably.Realtime {
  if (adminAblyClient && adminAblyClient.connection.state !== "closed" && adminAblyClient.connection.state !== "failed") {
    return adminAblyClient;
  }

  const clientKey = process.env.NEXT_PUBLIC_ABLY_CLIENT_KEY;

  const clientOptions: Ably.ClientOptions = clientKey
    ? { key: clientKey }
    : {
        authCallback: async (_data, callback) => {
          try {
            const res = await adminService.getRealtimeToken();
            callback(null, res.tokenRequest as unknown as Ably.TokenRequest);
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Token request failed";
            callback(msg, null);
          }
        },
      };

  adminAblyClient = new Ably.Realtime({
    ...clientOptions,
    autoConnect: true,
  });

  return adminAblyClient;
}

/**
 * Get or create an Ably Realtime client for a Customer tracking a specific order.
 * Scoped to order:{order_reference}.
 */
export function getCustomerAblyClient(orderReference: string): Ably.Realtime {
  const existing = customerAblyClients.get(orderReference);
  if (existing && existing.connection.state !== "closed" && existing.connection.state !== "failed") {
    return existing;
  }

  const clientKey = process.env.NEXT_PUBLIC_ABLY_CLIENT_KEY;

  const clientOptions: Ably.ClientOptions = clientKey
    ? { key: clientKey }
    : {
        authCallback: async (_data, callback) => {
          try {
            const res = await customerService.getCustomerRealtimeToken(orderReference);
            callback(null, res.tokenRequest as unknown as Ably.TokenRequest);
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Customer token request failed";
            callback(msg, null);
          }
        },
      };

  const client = new Ably.Realtime({
    ...clientOptions,
    autoConnect: true,
  });

  customerAblyClients.set(orderReference, client);
  return client;
}

/**
 * Gracefully close and clean up an Ably client instance.
 */
export function closeAdminAblyClient(): void {
  if (adminAblyClient) {
    adminAblyClient.close();
    adminAblyClient = null;
  }
}

export function closeCustomerAblyClient(orderReference: string): void {
  const client = customerAblyClients.get(orderReference);
  if (client) {
    client.close();
    customerAblyClients.delete(orderReference);
  }
}
