"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, title?: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const showToast = React.useCallback(
    (type: ToastType, message: string, title?: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, message, title }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex max-w-sm w-full flex-col gap-2 pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg transition-all duration-200 animate-in slide-in-from-bottom-5",
              t.type === "success" && "border-emerald-200 bg-emerald-50 text-emerald-900",
              t.type === "error" && "border-rose-200 bg-rose-50 text-rose-900",
              t.type === "info" && "border-slate-200 bg-white text-slate-900"
            )}
          >
            {t.type === "success" && (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            {t.type === "error" && (
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            {t.type === "info" && (
              <Info className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
            )}

            <div className="flex-1 text-xs">
              {t.title && <p className="font-semibold">{t.title}</p>}
              <p className={cn(t.title && "mt-0.5 text-slate-600")}>{t.message}</p>
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="rounded-md p-1 hover:bg-black/5 text-slate-400 hover:text-slate-700 transition"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
