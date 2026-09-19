import { Cafe, Category, Product, Order, Table, User } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

/**
 * Normalizes base URL and endpoint into a clean backend URL.
 * Guarantees:
 * - Trailing slashes on base URL are stripped
 * - Leading slashes on endpoint are stripped
 * - Double slashes ('//') anywhere in the path are eliminated
 * - Preserves target backend protocol (http:// or https://)
 * - Avoids duplicate '/api/api' segments
 */
export function normalizeUrl(base: string, endpoint: string): string {
  const cleanBase = base.trim().replace(/\/+$/, "");
  let cleanEndpoint = endpoint.trim().replace(/^\/+/, "");

  // Prevent duplicate '/api/api' if both base ends with '/api' and endpoint starts with 'api/'
  if (cleanBase.endsWith("/api") && cleanEndpoint.startsWith("api/")) {
    cleanEndpoint = cleanEndpoint.slice(4);
  }

  // Combine and replace any repeated internal slashes (preserving protocol ://)
  const combined = `${cleanBase}/${cleanEndpoint}`;
  return combined.replace(/([^:]\/)\/+/g, "$1");
}

export function buildApiUrl(endpoint: string): string {
  return normalizeUrl(API_BASE_URL, endpoint);
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  subdomain?: string
): Promise<T> {
  const url = buildApiUrl(endpoint);

  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
  };

  if (subdomain) {
    headers["X-Tenant-Subdomain"] = subdomain;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // for HTTP-only cookie authentication
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    let errorData: unknown;
    try {
      errorData = await response.json();
      if (typeof errorData === "object" && errorData && "detail" in errorData) {
        errorMessage = String((errorData as { detail: unknown }).detail);
      }
    } catch {
      // Non-JSON response
    }
    throw new ApiError(errorMessage, response.status, errorData);
  }

  return response.json();
}

/**
 * Public Customer Services
 */
export const customerService = {
  getCafeBySubdomain: (subdomain: string) =>
    request<Cafe>(`/public/cafe`, { method: "GET" }, subdomain),

  getCategories: (subdomain: string) =>
    request<Category[]>(`/public/categories`, { method: "GET" }, subdomain),

  getProducts: (subdomain: string, categoryId?: string) => {
    const query = categoryId ? `?category_id=${encodeURIComponent(categoryId)}` : "";
    return request<Product[]>(`/public/products${query}`, { method: "GET" }, subdomain);
  },

  resolveTableToken: (subdomain: string, token: string) =>
    request<Table>(`/public/table/${encodeURIComponent(token)}`, { method: "GET" }, subdomain),

  createOrder: (
    subdomain: string,
    orderData: {
      table_id?: string;
      table_token?: string;
      order_type: "DINE_IN" | "TAKEAWAY";
      customer_name?: string;
      customer_phone?: string;
      items: { product_id: string; quantity: number }[];
      idempotency_key?: string;
    }
  ) =>
    request<Order>(
      `/public/orders`,
      {
        method: "POST",
        body: JSON.stringify(orderData),
      },
      subdomain
    ),

  getOrderStatus: (subdomain: string, orderReference: string) =>
    request<Order>(`/public/orders/${encodeURIComponent(orderReference)}`, { method: "GET" }, subdomain),

  getCustomerRealtimeToken: (orderReference: string) =>
    request<{ tokenRequest: Record<string, unknown> }>(
      `/realtime/customer-token/${encodeURIComponent(orderReference)}`,
      { method: "GET" }
    ),
};

/**
 * Admin Dashboard Services
 */
export const adminService = {
  login: (credentials: { email: string; password: string }) =>
    request<{ access_token: string; token_type: string; user: { name: string; email: string; cafe_id: string } }>(
      `/auth/login`,
      {
        method: "POST",
        body: JSON.stringify(credentials),
      }
    ),

  logout: () =>
    request<{ success: boolean; message?: string }>(`/auth/logout`, { method: "POST" }),

  getMe: () =>
    request<{ user: User; cafe: Cafe }>(`/auth/me`, { method: "GET" }),

  getCafe: () =>
    request<Cafe>(`/cafe`, { method: "GET" }),

  updateCafe: (data: Partial<Cafe>) =>
    request<Cafe>(`/cafe`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getDashboardStats: () =>
    request<{
      total_orders_today: number;
      pending_orders: number;
      preparing_orders: number;
      ready_orders: number;
      completed_orders: number;
    }>(`/admin/dashboard/stats`, { method: "GET" }),

  getOrders: (status?: string, limit: number = 50, skip: number = 0) => {
    const params = new URLSearchParams();
    if (status && status !== "ALL") params.append("status", status);
    params.append("limit", limit.toString());
    params.append("skip", skip.toString());
    return request<Order[]>(`/admin/orders?${params.toString()}`, { method: "GET" });
  },

  getOrderDetails: (orderId: string) =>
    request<Order>(`/orders/${encodeURIComponent(orderId)}`, { method: "GET" }),

  updateOrderStatus: (orderId: string, status: string) =>
    request<Order>(
      `/orders/${encodeURIComponent(orderId)}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }
    ),

  getCategories: () =>
    request<Category[]>(`/admin/categories`, { method: "GET" }),

  createCategory: (data: { name: string; description?: string; display_order?: number; is_active?: boolean }) =>
    request<Category>(`/categories`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateCategory: (categoryId: string, data: Partial<Category>) =>
    request<Category>(`/categories/${encodeURIComponent(categoryId)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteCategory: (categoryId: string) =>
    request<{ success: boolean; message: string }>(`/categories/${encodeURIComponent(categoryId)}`, {
      method: "DELETE",
    }),

  getProducts: (categoryId?: string) => {
    const query = categoryId ? `?category_id=${encodeURIComponent(categoryId)}` : "";
    return request<Product[]>(`/admin/products${query}`, { method: "GET" });
  },

  createProduct: (data: {
    category_id: string;
    name: string;
    description?: string;
    price: number;
    image_url?: string;
    image_public_id?: string;
    is_available?: boolean;
    display_order?: number;
  }) =>
    request<Product>(`/products`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateProduct: (productId: string, data: Partial<Product>) =>
    request<Product>(`/products/${encodeURIComponent(productId)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteProduct: (productId: string) =>
    request<{ success: boolean; message: string }>(`/products/${encodeURIComponent(productId)}`, {
      method: "DELETE",
    }),

  uploadProductImage: (productId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<Product>(`/products/${encodeURIComponent(productId)}/image`, {
      method: "POST",
      body: formData,
    });
  },

  standaloneUploadImage: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<{ image_url: string; image_public_id: string; format: string; bytes: number }>(
      `/products/upload-image`,
      {
        method: "POST",
        body: formData,
      }
    );
  },

  getTables: () =>
    request<Table[]>(`/admin/tables`, { method: "GET" }),

  createTable: (data: { table_number: string }) =>
    request<Table>(`/tables`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateTable: (tableId: string, data: { table_number?: string; status?: string }) =>
    request<Table>(`/tables/${encodeURIComponent(tableId)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteTable: (tableId: string) =>
    request<{ success: boolean; message: string }>(`/tables/${encodeURIComponent(tableId)}`, {
      method: "DELETE",
    }),

  getTableQrUrl: (tableId: string) =>
    buildApiUrl(`/tables/${encodeURIComponent(tableId)}/qr`),

  getRealtimeToken: () =>
    request<{ tokenRequest: Record<string, unknown> }>(`/realtime/token`, { method: "GET" }),
};

/**
 * Platform Admin Services
 */
export const platformService = {
  listCafes: () =>
    request<
      {
        cafe_id?: string;
        name: string;
        subdomain: string;
        owner_name?: string;
        owner_email?: string;
        currency: string;
        status: "ACTIVE" | "INACTIVE";
        created_at?: string;
      }[]
    >(`/platform/cafes`, { method: "GET" }),

  createCafe: (data: {
    name: string;
    subdomain: string;
    owner_name: string;
    owner_email: string;
    owner_password: string;
    currency: string;
    primary_color?: string;
    description?: string;
  }) =>
    request<{
      cafe_id: string;
      name: string;
      subdomain: string;
      owner_name: string;
      owner_email: string;
      currency: string;
      status: "ACTIVE" | "INACTIVE";
    }>(`/platform/cafes`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
