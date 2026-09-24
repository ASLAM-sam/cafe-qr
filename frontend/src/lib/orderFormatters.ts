/**
 * Utility functions for formatting order date, time, and table context
 * for the Cafe Admin dashboard and order details modal.
 */

/**
 * Format a server-generated ISO timestamp into a human-readable string:
 * - "Today, 12:13 AM"
 * - "Yesterday, 11:48 PM"
 * - "24 Sep 2026, 11:48 PM"
 * Fallback: "Time unavailable"
 */
export function formatOrderDateTime(dateInput?: string | Date | null): string {
  if (!dateInput) return "Time unavailable";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "Time unavailable";

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const timeString = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) {
    return `Today, ${timeString}`;
  }
  if (isYesterday) {
    return `Yesterday, ${timeString}`;
  }

  const day = String(date.getDate()).padStart(2, "0");
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}, ${timeString}`;
}

/**
 * Format only the date portion (e.g. for modal details):
 * - "Today"
 * - "Yesterday"
 * - "24 Sep 2026"
 */
export function formatOrderDate(dateInput?: string | Date | null): string {
  if (!dateInput) return "Date unavailable";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "Date unavailable";

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return "Today";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "Yesterday";

  const day = String(date.getDate()).padStart(2, "0");
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Format only the time portion (e.g. for modal details):
 * - "12:13 AM"
 * - "11:48 PM"
 */
export function formatOrderTime(dateInput?: string | Date | null): string {
  if (!dateInput) return "Time unavailable";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "Time unavailable";

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format table and dining context:
 * - "Table 01 · Dine-in"
 * - "Takeaway"
 * - "Table information unavailable · Dine-in" (for older records without table data)
 */
export function formatOrderTableContext(order: {
  order_type: "DINE_IN" | "TAKEAWAY" | string;
  table_number?: string | null;
  table_id?: string | null;
}): string {
  if (order.order_type === "TAKEAWAY") {
    return "Takeaway";
  }

  // Dine-in order with table number
  if (order.table_number) {
    const rawNumber = String(order.table_number).trim();
    const formatted = rawNumber.toLowerCase().startsWith("table")
      ? rawNumber
      : `Table ${rawNumber.padStart(2, "0")}`;
    return `${formatted} · Dine-in`;
  }

  // Dine-in order without table number
  return "Table information unavailable · Dine-in";
}
