import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./Button";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load the information. Please check your connection and try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center",
        className
      )}
    >
      <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h4 className="text-base font-semibold text-rose-950">{title}</h4>
      <p className="mt-1 max-w-sm text-xs text-rose-700/80 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <div className="mt-5">
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
