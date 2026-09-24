"use client";

import * as React from "react";
import { Menu, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useTenant } from "@/context/TenantContext";

export interface AdminHeaderProps {
  onToggleSidebar: () => void;
  cafeName?: string;
  userName?: string;
}

export function AdminHeader({
  onToggleSidebar,
  cafeName = "Cafe Admin",
  userName = "Owner",
}: AdminHeaderProps) {
  const { subdomain } = useTenant();
  const publicMenuHref =
    typeof window !== "undefined" && window.location.search.includes("cafe=") && subdomain
      ? `/?cafe=${encodeURIComponent(subdomain)}`
      : "/";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[oklch(1_0_0/8%)] bg-[oklch(0.15_0.022_280/90%)] px-4 backdrop-blur-xl sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="rounded-xl p-2 text-[oklch(0.70_0.03_280)] hover:bg-[oklch(0.20_0.025_280)] hover:text-white lg:hidden focus:outline-none"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-white">
            {cafeName}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Link to public menu */}
        <Link
          href={publicMenuHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[oklch(1_0_0/10%)] bg-[oklch(0.18_0.025_280)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[oklch(0.22_0.03_280)] transition"
        >
          <span>View Public Menu</span>
          <ExternalLink className="h-3 w-3 text-[oklch(0.70_0.03_280)]" />
        </Link>

        {/* User avatar badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-[oklch(1_0_0/8%)]">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] text-xs font-bold text-white shadow-sm shadow-[oklch(0.62_0.27_305/20%)]">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-medium text-[oklch(0.70_0.03_280)] hidden sm:inline">
            {userName}
          </span>
        </div>
      </div>
    </header>
  );
}
