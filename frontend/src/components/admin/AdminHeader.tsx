"use client";

import * as React from "react";
import { Menu, ExternalLink } from "lucide-react";
import Link from "next/link";

export interface AdminHeaderProps {
  onToggleSidebar: () => void;
  cafeName?: string;
  userName?: string;
}

export function AdminHeader({
  onToggleSidebar,
  cafeName = "Brew House",
  userName = "Owner",
}: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xs sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold text-slate-700">
            {cafeName} (Live)
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Link to public menu */}
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
        >
          <span>View Public Menu</span>
          <ExternalLink className="h-3 w-3 text-slate-400" />
        </Link>

        {/* User avatar badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-medium text-slate-700 hidden sm:inline">
            {userName}
          </span>
        </div>
      </div>
    </header>
  );
}
