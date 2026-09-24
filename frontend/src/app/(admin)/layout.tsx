"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useTenant } from "@/context/TenantContext";
import { adminService } from "@/services/apiClient";
import { User } from "@/types";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const { cafe, subdomain, setCafe } = useTenant();
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;

    adminService
      .getMe()
      .then((data) => {
        if (!isMounted) return;

        const user = data?.user;
        const userCafe = data?.cafe;

        if (!user) {
          // Case 1: No authenticated user -> Redirect to /login
          const loginTarget = subdomain
            ? `/login?cafe=${encodeURIComponent(subdomain)}`
            : "/login";
          router.replace(loginTarget);
          return;
        }

        if (user.role === "PLATFORM_ADMIN") {
          // Case 2: Platform Admin attempting to access cafe owner dashboard -> Redirect to /admin
          router.replace("/admin");
          return;
        }

        if (user.role === "OWNER" || user.role === "ADMIN") {
          // Case 3 & 4: Authorized tenant roles -> Allow access
          setCurrentUser(user);
          if (userCafe && !cafe) {
            setCafe(userCafe);
          }
          setIsAuthLoading(false);
          return;
        }

        // Unrecognized role -> Redirect to /login
        router.replace("/login");
      })
      .catch(() => {
        if (!isMounted) return;
        // Case 1: Unauthenticated or network error -> Redirect to /login
        const loginTarget = subdomain
          ? `/login?cafe=${encodeURIComponent(subdomain)}`
          : "/login";
        router.replace(loginTarget);
      });

    return () => {
      isMounted = false;
    };
  }, [router, subdomain, cafe, setCafe]);

  // Case 5: Authentication check still loading -> Show loading state
  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[oklch(0.13_0.02_280)] text-white">
        <div className="flex flex-col items-center gap-2.5">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[oklch(0.62_0.27_305)] border-t-transparent" />
          <div className="text-xs font-semibold text-[oklch(0.70_0.03_280)]">
            Loading cafe dashboard...
          </div>
        </div>
      </div>
    );
  }

  const dynamicCafeName =
    cafe?.name ||
    (subdomain
      ? `${subdomain.charAt(0).toUpperCase() + subdomain.slice(1)} Cafe`
      : "Cafe Admin");

  return (
    <div className="flex min-h-screen bg-[oklch(0.13_0.02_280)] text-[oklch(0.98_0.005_280)] selection:bg-[oklch(0.62_0.27_305)] selection:text-white">
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
          userName={currentUser?.name || "Cafe Owner"}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
