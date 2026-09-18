import * as React from "react";
import { cn } from "@/lib/utils";
import { OrderStatus } from "@/types";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "success"
    | "warning"
    | "error"
    | "info";
  status?: OrderStatus | "ACTIVE" | "INACTIVE";
}

export function Badge({
  className,
  variant = "default",
  status,
  children,
  ...props
}: BadgeProps) {
  let resolvedVariant = variant;
  let statusText = children;

  if (status) {
    statusText = status;
    switch (status) {
      case "PLACED":
        resolvedVariant = "warning";
        break;
      case "ACCEPTED":
        resolvedVariant = "info";
        break;
      case "PREPARING":
        resolvedVariant = "info";
        break;
      case "READY":
        resolvedVariant = "success";
        break;
      case "COMPLETED":
        resolvedVariant = "secondary";
        break;
      case "CANCELLED":
        resolvedVariant = "error";
        break;
      case "ACTIVE":
        resolvedVariant = "success";
        break;
      case "INACTIVE":
        resolvedVariant = "secondary";
        break;
    }
  }

  const variantStyles = {
    default: "bg-slate-900 text-white",
    secondary: "bg-slate-100 text-slate-700 border border-slate-200",
    outline: "border border-slate-300 text-slate-700 bg-white",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    error: "bg-rose-50 text-rose-700 border border-rose-200",
    info: "bg-sky-50 text-sky-700 border border-sky-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors",
        variantStyles[resolvedVariant],
        className
      )}
      {...props}
    >
      {statusText}
    </span>
  );
}
