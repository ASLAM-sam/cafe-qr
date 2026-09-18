import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/Card";
import { LucideIcon } from "lucide-react";

export interface StatCardProps {
  title: string;
  value: number | string | null;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "warning" | "info" | "success";
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  className,
}: StatCardProps) {
  const iconVariants = {
    default: "bg-slate-100 text-slate-700",
    warning: "bg-amber-100 text-amber-800",
    info: "bg-sky-100 text-sky-800",
    success: "bg-emerald-100 text-emerald-800",
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {title}
          </span>
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg",
              iconVariants[variant]
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-slate-900">
            {value !== null && value !== undefined ? (
              value
            ) : (
              <span className="text-xs font-normal text-slate-400 italic">
                No data yet
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-[11px] text-slate-500 font-medium">
              {subtitle}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
