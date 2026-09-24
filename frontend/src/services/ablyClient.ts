import * as Ably from "ably";
import { adminService, customerService } from "./apiClient";

let adminAblyClient: Ably.Realtime | null = null;
const customerAblyClients = new Map<string, Ably.Realtime>();

/**
 * Get or create an Ably Realtime client for Cafe Admin.
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
            const tokenReq = (res.tokenRequest || res.token_request) as unknown as Ably.TokenRequest;
            if (!tokenReq || res.configured === false) {
              const msg = res.message || "Realtime is not configured on this server.";
              callback(msg, null);
              return;
            }
            callback(null, tokenReq);
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
            const tokenReq = (res.tokenRequest || res.token_request) as unknown as Ably.TokenRequest;
            if (!tokenReq || res.configured === false) {
              const msg = res.message || "Customer realtime tracking is not configured.";
              callback(msg, null);
              return;
            }
            callback(null, tokenReq);
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
