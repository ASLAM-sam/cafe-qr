"use client";

import * as React from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { adminService } from "@/services/apiClient";
import {
  ShoppingBag,
  Clock,
  Flame,
  CheckCircle,
  Plus,
  QrCode,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface DashboardStats {
  total_orders_today: number;
  pending_orders: number;
  preparing_orders: number;
  ready_orders: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadStats() {
      setIsLoading(true);
      try {
        const data = await adminService.getDashboardStats();
        setStats(data);
      } catch {
        // Backend not connected or no data yet: setStats(null) ensures zero fake data
        setStats(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        description="Overview of current cafe activity and active orders."
        action={
          <Link href="/orders">
            <Button variant="outline" size="sm" className="gap-1.5">
              <span>View All Orders</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        }
      />

      {/* Metrics Row (Strictly No Fake Numbers) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Orders Today"
          value={isLoading ? "..." : stats ? stats.total_orders_today : null}
          subtitle="Orders placed today"
          icon={ShoppingBag}
          variant="default"
        />
        <StatCard
          title="Pending"
          value={isLoading ? "..." : stats ? stats.pending_orders : null}
          subtitle="Awaiting acceptance"
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Preparing"
          value={isLoading ? "..." : stats ? stats.preparing_orders : null}
          subtitle="In preparation"
          icon={Flame}
          variant="info"
        />
        <StatCard
          title="Ready"
          value={isLoading ? "..." : stats ? stats.ready_orders : null}
          subtitle="Ready to serve/pickup"
          icon={CheckCircle}
          variant="success"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Onboarding Guide */}
        <Card className="lg:col-span-1 border-[oklch(1_0_0/10%)] bg-[oklch(0.18_0.025_280)]">
          <CardHeader>
            <CardTitle>Setup Your Cafe</CardTitle>
            <CardDescription>
              Follow these steps to start receiving customer QR orders.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-[oklch(1_0_0/8%)] p-3 bg-[oklch(0.15_0.022_280)]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[oklch(0.62_0.27_305/15%)] text-purple-300">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    Add Menu Categories
                  </h4>
                  <p className="text-[11px] text-[oklch(0.70_0.03_280)]">e.g. Coffee, Snacks</p>
                </div>
              </div>
              <Link href="/menu/categories">
                <Button variant="ghost" size="sm" className="text-purple-300 hover:text-white hover:bg-[oklch(0.22_0.03_280)]">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[oklch(1_0_0/8%)] p-3 bg-[oklch(0.15_0.022_280)]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[oklch(0.62_0.27_305/15%)] text-purple-300">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    Add Menu Items
                  </h4>
                  <p className="text-[11px] text-[oklch(0.70_0.03_280)]">Names, prices & photos</p>
                </div>
              </div>
              <Link href="/menu/products">
                <Button variant="ghost" size="sm" className="text-purple-300 hover:text-white hover:bg-[oklch(0.22_0.03_280)]">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[oklch(1_0_0/8%)] p-3 bg-[oklch(0.15_0.022_280)]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[oklch(0.62_0.27_305/15%)] text-purple-300">
                  <QrCode className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    Generate Table QRs
                  </h4>
                  <p className="text-[11px] text-[oklch(0.70_0.03_280)]">Printable table tokens</p>
                </div>
              </div>
              <Link href="/qr-codes">
                <Button variant="ghost" size="sm" className="text-purple-300 hover:text-white hover:bg-[oklch(0.22_0.03_280)]">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Live Orders Overview (Strict Real Empty State) */}
        <Card className="lg:col-span-2 border-[oklch(1_0_0/10%)] bg-[oklch(0.18_0.025_280)]">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>
                Live incoming customer orders requiring action.
              </CardDescription>
            </div>
            <Link href="/orders">
              <Button variant="ghost" size="sm" className="text-[oklch(0.70_0.03_280)] hover:text-white hover:bg-[oklch(0.22_0.03_280)]">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={ShoppingBag}
              title="No active orders"
              description="Customer orders placed via table QR codes will appear here in real time."
              actionLabel="View Orders Page"
              onAction={() => {
                router.push("/orders");
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
