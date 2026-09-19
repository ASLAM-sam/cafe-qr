"use client";

import * as React from "react";
import Link from "next/link";
import {
  Coffee,
  Plus,
  ExternalLink,
  Shield,
  CheckCircle2,
  AlertCircle,
  Building2,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";

interface ManagedCafe {
  cafe_id?: string;
  name: string;
  subdomain: string;
  owner_name?: string;
  owner_email?: string;
  currency: string;
  status: "ACTIVE" | "INACTIVE";
  created_at?: string;
}

export function PlatformAdminDashboard() {
  const { showToast } = useToast();

  const [cafes, setCafes] = React.useState<ManagedCafe[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // Form state for creating a new cafe
  const [formData, setFormData] = React.useState({
    name: "",
    subdomain: "",
    owner_name: "",
    owner_email: "",
    owner_password: "",
    currency: "INR",
    primary_color: "#0f172a",
    description: "",
  });

  // Load registered cafes from real backend API
  const loadCafes = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/platform/cafes", {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setCafes(Array.isArray(data) ? data : []);
      } else {
        setCafes([]);
      }
    } catch {
      setCafes([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadCafes();
  }, [loadCafes]);

  const handleCreateCafe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/platform/cafes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          subdomain: formData.subdomain.trim().toLowerCase(),
          owner_name: formData.owner_name.trim(),
          owner_email: formData.owner_email.trim().toLowerCase(),
          owner_password: formData.owner_password,
          currency: formData.currency,
          primary_color: formData.primary_color,
          description: formData.description.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ detail: "Failed to create café." }));
        throw new Error(errorBody.detail || "Failed to create café.");
      }

      const created = await response.json();

      const newCafe: ManagedCafe = {
        cafe_id: created.cafe_id || `cafe_${Date.now()}`,
        name: formData.name,
        subdomain: formData.subdomain.toLowerCase(),
        owner_name: formData.owner_name,
        owner_email: formData.owner_email,
        currency: formData.currency,
        status: "ACTIVE",
        created_at: new Date().toISOString(),
      };

      // Persist in local storage for session review
      const currentList = [...cafes, newCafe];
      setCafes(currentList);
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("platform_onboarded_cafes");
        const list = stored ? JSON.parse(stored) : [];
        list.push(newCafe);
        localStorage.setItem("platform_onboarded_cafes", JSON.stringify(list));
      }

      showToast(
        "success",
        `${formData.name} (${formData.subdomain}) is now live.`,
        "Café Onboarded Successfully"
      );

      setIsModalOpen(false);
      setFormData({
        name: "",
        subdomain: "",
        owner_name: "",
        owner_email: "",
        owner_password: "",
        currency: "INR",
        primary_color: "#0f172a",
        description: "",
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Failed to provision café. Please verify your platform credentials.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
              <Shield className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-900">
                  Platform Admin
                </span>
                <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                  Root
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Manage all café tenants across the platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="outline" size="sm" className="text-xs">
                View Platform Website
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              <span>Onboard New Café</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Registered Cafés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-900">
                {cafes.length}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Active tenant subdomains on platform
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Tenants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-emerald-600">
                {cafes.filter((c) => c.status === "ACTIVE").length}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Ready to accept customer QR orders
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Platform Architecture
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Multi-Tenant Isolated</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Single codebase & MongoDB Atlas instance
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Café Directory Table */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Managed Café Tenants
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Each café has its own isolated menu, orders, tables, and settings.
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Loading tenant directory...
              </div>
            ) : cafes.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={Building2}
                  title="No Cafés Registered Yet"
                  description="Use the button above to provision your first café tenant."
                  actionLabel="Onboard New Café"
                  onAction={() => setIsModalOpen(true)}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Café Name</th>
                      <th className="px-5 py-3">Subdomain</th>
                      <th className="px-5 py-3">Owner Contact</th>
                      <th className="px-5 py-3">Currency</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/75">
                    {cafes.map((cafe) => (
                      <tr
                        key={cafe.subdomain}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-semibold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600">
                              <Coffee className="h-4 w-4" />
                            </div>
                            <span>{cafe.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-slate-600">
                          <span className="rounded bg-slate-100 px-2 py-0.5 border border-slate-200">
                            {cafe.subdomain}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          <div>{cafe.owner_name || "—"}</div>
                          <div className="text-[11px] text-slate-400">
                            {cafe.owner_email || "—"}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 font-semibold">
                          {cafe.currency}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge status={cafe.status}>
                            {cafe.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-2">
                          <a
                            href={`/?cafe=${encodeURIComponent(cafe.subdomain)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-md border border-amber-200 transition-colors"
                          >
                            <span>Customer Menu</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <a
                            href={`/dashboard?cafe=${encodeURIComponent(cafe.subdomain)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md border border-slate-200 transition-colors"
                          >
                            <span>Admin Dashboard</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Onboard Café Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Onboard New Café Tenant"
        description="Provision a new café subdomain, configure default branding, and generate an owner account."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateCafe} className="space-y-4">
          {submitError && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Café Name"
              placeholder="e.g. Artisanal Roastery"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Subdomain / Slug"
              placeholder="e.g. artisanal"
              value={formData.subdomain}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                })
              }
              required
              helperText="Will be used as: [subdomain].yourdomain.com"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Owner Name"
              placeholder="e.g. Aslam Sam"
              value={formData.owner_name}
              onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
              required
            />
            <Input
              label="Owner Email"
              type="email"
              placeholder="owner@artisanal.com"
              value={formData.owner_email}
              onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Initial Password"
              type="password"
              placeholder="••••••••"
              value={formData.owner_password}
              onChange={(e) =>
                setFormData({ ...formData, owner_password: e.target.value })
              }
              required
              helperText="Minimum 6 characters for owner dashboard login."
            />
            <Input
              label="Currency"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              required
            />
          </div>

          <Input
            label="Brief Description"
            placeholder="Specialty coffees, fresh pastries, and breakfast."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
            >
              Provision Café
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
