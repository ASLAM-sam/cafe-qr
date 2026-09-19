"use client";

import * as React from "react";
import { useTenant } from "@/context/TenantContext";
import { PlatformAdminDashboard } from "@/components/platform/PlatformAdminDashboard";
import AdminDashboardPage from "@/app/(admin)/dashboard/page";
import AdminLayout from "@/app/(admin)/layout";

export default function AdminControllerPage() {
  const { isPlatform, isLoading } = useTenant();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-xs font-semibold text-slate-500 animate-pulse">
          Resolving tenant admin environment...
        </div>
      </div>
    );
  }

  // 1. Root Platform Domain: mydomain.com/admin -> Platform Admin
  if (isPlatform) {
    return <PlatformAdminDashboard />;
  }

  // 2. Café Subdomain: cafe.mydomain.com/admin -> Café Owner Admin Dashboard
  return (
    <AdminLayout>
      <AdminDashboardPage />
    </AdminLayout>
  );
}
