import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center",
        className
      )}
    >
      {Icon && (
        <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h4 className="text-base font-semibold text-slate-900">{title}</h4>
      <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
