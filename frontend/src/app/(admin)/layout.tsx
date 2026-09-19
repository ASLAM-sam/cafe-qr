"use client";

import * as React from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useTenant } from "@/context/TenantContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const { cafe, subdomain } = useTenant();

  const dynamicCafeName =
    cafe?.name ||
    (subdomain
      ? `${subdomain.charAt(0).toUpperCase() + subdomain.slice(1)} Café`
      : "Café Admin");

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar navigation */}
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        cafeName={dynamicCafeName}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-x-hidden">
        <AdminHeader
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          cafeName={dynamicCafeName}
          userName="Café Owner"
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
