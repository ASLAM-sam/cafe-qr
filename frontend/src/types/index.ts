export type Role = "OWNER" | "ADMIN" | "PLATFORM_ADMIN";

export interface CafeTaxSettings {
  tax_enabled: boolean;
  tax_rate_percent: number;
}

export interface Cafe {
  cafe_id: string;
  name: string;
  slug: string;
  subdomain: string;
  logo?: string;
  banner?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  currency: string;
  tax_settings?: CafeTaxSettings;
  primary_color?: string;
  status: "ACTIVE" | "INACTIVE";
  created_at: string;
  updated_at: string;
}

export interface User {
  user_id: string;
  cafe_id?: string;
  name?: string;
  email?: string;
  username?: string;
  role: Role;
  status: "ACTIVE" | "INACTIVE";
  created_at: string;
}

export interface Category {
  category_id: string;
  cafe_id: string;
  name: string;
  description?: string;
  image?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  product_id: string;
  cafe_id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  image_public_id?: string;
  is_available: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type TableStatus = "AVAILABLE" | "OCCUPIED";

export interface Table {
  table_id: string;
  cafe_id: string;
  table_number: string;
  qr_token: string;
  status: TableStatus;
  created_at: string;
  updated_at: string;
}

export type OrderType = "DINE_IN" | "TAKEAWAY";

export type OrderStatus =
  | "PLACED"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED";

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  order_id: string;
  order_number: string;
  order_reference?: string;
  cafe_id: string;
  table_id?: string;
  table_number?: string;
  order_type: OrderType;
  customer_name?: string;
  customer_phone?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  category_id?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  status_code?: number;
  detail?: string | Record<string, string[]>;
}
