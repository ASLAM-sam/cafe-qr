"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingBag,
  Layers,
  UtensilsCrossed,
  Grid,
  QrCode,
  Settings,
  LogOut,
  Coffee,
  X,
} from "lucide-react";
import { adminService } from "@/services/apiClient";
import { useRouter } from "next/navigation";

export interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  cafeName?: string;
}

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/orders", icon: ShoppingBag },
  {
    label: "Menu",
    icon: UtensilsCrossed,
    children: [
      { label: "Categories", href: "/menu/categories", icon: Layers },
      { label: "Products", href: "/menu/products", icon: UtensilsCrossed },
    ],
  },
  { label: "Tables", href: "/tables", icon: Grid },
  { label: "QR Codes", href: "/qr-codes", icon: QrCode },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function AdminSidebar({
  isOpen = false,
  onClose,
  cafeName = "Café Admin",
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await adminService.logout();
    } catch {
      // Ignore errors on logout
    }
    router.push("/login");
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white shrink-0">
              <Coffee className="h-4 w-4" />
            </div>
            <div className="truncate">
              <h2 className="text-sm font-bold text-slate-900 truncate">
                {cafeName}
              </h2>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                Management
              </span>
            </div>
          </div>

          {/* Close button on mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
          {NAV_ITEMS.map((item) => {
            if (item.children) {
              return (
                <div key={item.label} className="pt-2">
                  <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {item.label}
                  </span>
                  <div className="mt-1 space-y-1">
                    {item.children.map((child) => {
                      const isActive = pathname === child.href;
                      const Icon = child.icon;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onClose}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors duration-150",
                            isActive
                              ? "bg-slate-900 text-white shadow-xs"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span>{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }

            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors duration-150",
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer with Logout */}
        <div className="border-t border-slate-200 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
