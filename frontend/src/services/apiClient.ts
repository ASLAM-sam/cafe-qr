import { Cafe, Category, Product, Order, Table } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

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
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
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
      order_type: "DINE_IN" | "TAKEAWAY";
      customer_name?: string;
      customer_phone?: string;
      items: { product_id: string; quantity: number }[];
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

  getOrderStatus: (subdomain: string, orderId: string) =>
    request<Order>(`/public/orders/${encodeURIComponent(orderId)}`, { method: "GET" }, subdomain),
};

/**
 * Admin Dashboard Services
 */
export const adminService = {
  login: (credentials: { email: string; password: string }) =>
    request<{ success: boolean; user: { name: string; email: string; cafe_id: string } }>(
      `/auth/login`,
      {
        method: "POST",
        body: JSON.stringify(credentials),
      }
    ),

  logout: () =>
    request<{ success: boolean }>(`/auth/logout`, { method: "POST" }),

  getDashboardStats: () =>
    request<{
      total_orders_today: number;
      pending_orders: number;
      preparing_orders: number;
      ready_orders: number;
      completed_orders: number;
    }>(`/admin/dashboard/stats`, { method: "GET" }),

  getOrders: (status?: string) => {
    const query = status && status !== "ALL" ? `?status=${encodeURIComponent(status)}` : "";
    return request<Order[]>(`/admin/orders${query}`, { method: "GET" });
  },

  updateOrderStatus: (orderId: string, status: string) =>
    request<Order>(
      `/admin/orders/${encodeURIComponent(orderId)}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }
    ),

  getCategories: () =>
    request<Category[]>(`/admin/categories`, { method: "GET" }),

  getProducts: () =>
    request<Product[]>(`/admin/products`, { method: "GET" }),

  getTables: () =>
    request<Table[]>(`/admin/tables`, { method: "GET" }),
};
