"use client";

import * as React from "react";
import { useTenant } from "@/context/TenantContext";
import { PlatformAdminDashboard } from "@/components/platform/PlatformAdminDashboard";
import { PlatformAdminLogin } from "@/components/platform/PlatformAdminLogin";
import AdminDashboardPage from "@/app/(admin)/dashboard/page";
import AdminLayout from "@/app/(admin)/layout";
import { platformService } from "@/services/apiClient";
import { User } from "@/types";

export default function AdminControllerPage() {
  const { isPlatform, isLoading: isTenantLoading } = useTenant();
  const [platformUser, setPlatformUser] = React.useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = React.useState(true);

  React.useEffect(() => {
    if (!isPlatform) {
      setIsAuthChecking(false);
      return;
    }

    let isMounted = true;
    platformService
      .getMe()
      .then((data) => {
        if (isMounted) {
          if (data && data.user && data.user.role === "PLATFORM_ADMIN") {
            setPlatformUser(data.user);
          } else {
            setPlatformUser(null);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setPlatformUser(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsAuthChecking(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isPlatform]);

  if (isTenantLoading || (isPlatform && isAuthChecking)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-xs font-semibold text-slate-400 animate-pulse">
          Authenticating platform environment...
        </div>
      </div>
    );
  }

  // 1. Root Platform Domain: mydomain.com/admin -> Platform Admin
  if (isPlatform) {
    if (!platformUser) {
      return (
        <PlatformAdminLogin
          onLoginSuccess={(user) => {
            setPlatformUser(user);
          }}
        />
      );
    }

    return (
      <PlatformAdminDashboard
        user={platformUser}
        onLogout={() => {
          setPlatformUser(null);
        }}
      />
    );
  }

  // 2. Café Subdomain: cafe.mydomain.com/admin -> Café Owner Admin Dashboard
  return (
    <AdminLayout>
      <AdminDashboardPage />
    </AdminLayout>
  );
}
