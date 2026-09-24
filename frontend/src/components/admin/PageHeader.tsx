import * as React from "react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 pb-6 sm:flex-row sm:items-center sm:justify-between border-b border-[oklch(1_0_0/8%)] mb-6",
        className
      )}
    >
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-xs sm:text-sm text-[oklch(0.70_0.03_280)]">{description}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
