"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  side?: "bottom" | "right";
}

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  side = "bottom",
}: DrawerProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={cn(
          "fixed z-50 bg-white shadow-2xl transition-transform duration-200 ease-out",
          side === "bottom"
            ? "inset-x-0 bottom-0 max-h-[90vh] rounded-t-2xl border-t border-slate-200 flex flex-col"
            : "inset-y-0 right-0 w-full max-w-md border-l border-slate-200 flex flex-col",
          className
        )}
      >
        {/* Mobile pull handle indicator */}
        {side === "bottom" && (
          <div className="flex justify-center pt-2.5 pb-1">
            <div className="h-1 w-10 rounded-full bg-slate-300" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            )}
            {description && (
              <p className="text-xs text-slate-500">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label="Close drawer"
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body content with scrolling */}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
