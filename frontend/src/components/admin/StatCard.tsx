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
    default: "bg-[oklch(0.22_0.03_280)] text-purple-300 border border-[oklch(1_0_0/8%)]",
    warning: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    info: "bg-sky-500/15 text-sky-400 border border-sky-500/30",
    success: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  };

  return (
    <Card className={cn("overflow-hidden border-[oklch(1_0_0/10%)] bg-[oklch(0.18_0.025_280)] text-white shadow-xl", className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[oklch(0.70_0.03_280)] uppercase tracking-wider">
            {title}
          </span>
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl",
              iconVariants[variant]
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-white">
            {value !== null && value !== undefined ? (
              value
            ) : (
              <span className="text-xs font-normal text-[oklch(0.70_0.03_280)] italic">
                No data yet
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-[11px] text-[oklch(0.70_0.03_280)] font-medium">
              {subtitle}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
