"use client";

import * as React from "react";
import Link from "next/link";
import {
  Coffee,
  Plus,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  LogOut,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { platformService } from "@/services/apiClient";
import { User } from "@/types";

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

interface PlatformAdminDashboardProps {
  user?: User | null;
  onLogout?: () => void;
}

export function PlatformAdminDashboard({ user, onLogout }: PlatformAdminDashboardProps) {
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
    primary_color: "#7e22ce",
    description: "",
  });

  const handleSignOut = async () => {
    try {
      await platformService.logout();
    } finally {
      if (onLogout) {
        onLogout();
      }
    }
  };

  // Load registered cafes from real backend API
  const loadCafes = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await platformService.listCafes();
      setCafes(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      if (err instanceof Error && (err.message.includes("401") || err.message.includes("Unauthorized"))) {
        showToast("error", "Platform session expired. Please sign in again.", "Unauthorized");
        if (onLogout) {
          onLogout();
        }
      }
      setCafes([]);
    } finally {
      setIsLoading(false);
    }
  }, [onLogout, showToast]);

  React.useEffect(() => {
    loadCafes();
  }, [loadCafes]);

  const handleCreateCafe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const created = await platformService.createCafe({
        name: formData.name.trim(),
        subdomain: formData.subdomain.trim().toLowerCase(),
        owner_name: formData.owner_name.trim(),
        owner_email: formData.owner_email.trim().toLowerCase(),
        owner_password: formData.owner_password,
        currency: formData.currency,
        primary_color: formData.primary_color,
        description: formData.description.trim() || undefined,
      });

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
        "Cafe Added Successfully"
      );

      setIsModalOpen(false);
      setFormData({
        name: "",
        subdomain: "",
        owner_name: "",
        owner_email: "",
        owner_password: "",
        currency: "INR",
        primary_color: "#7e22ce",
        description: "",
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Failed to add cafe. Please check your credentials.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[oklch(0.13_0.02_280)] text-[oklch(0.98_0.005_280)] selection:bg-[oklch(0.62_0.27_305)] selection:text-white">
      {/* Top Header */}
      <header className="border-b border-[oklch(1_0_0/8%)] bg-[oklch(0.15_0.022_280/85%)] backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] text-white shadow-lg shadow-[oklch(0.62_0.27_305/25%)]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white tracking-tight">
                  Platform Admin
                </span>
                <span className="rounded-full bg-[oklch(0.82_0.14_85/15%)] border border-[oklch(0.82_0.14_85/30%)] px-2 py-0.5 text-[10px] font-bold text-[oklch(0.82_0.14_85)] uppercase tracking-wider">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-[oklch(0.70_0.03_280)]">
                Manage all cafes from one place
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user?.username && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[oklch(0.18_0.025_280)] border border-[oklch(1_0_0/10%)] text-xs font-medium text-[oklch(0.70_0.03_280)]">
                <span>Admin:</span>
                <span className="font-semibold text-white">{user.username}</span>
              </div>
            )}
            <Link href="/">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-[oklch(1_0_0/10%)] bg-[oklch(0.18_0.025_280)] hover:bg-[oklch(0.22_0.03_280)] text-white h-9 rounded-xl"
              >
                Platform Website
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="text-xs bg-gradient-to-r from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] hover:opacity-95 text-white font-bold h-9 rounded-xl shadow-md shadow-[oklch(0.62_0.27_305/20%)]"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              <span>Add Cafe</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="text-xs text-rose-300 hover:text-rose-200 bg-[oklch(0.18_0.025_280)] hover:bg-rose-950/40 border-[oklch(1_0_0/10%)] h-9 rounded-xl"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-10">
          <div className="lux-glass rounded-2xl p-6 border border-[oklch(1_0_0/10%)]">
            <div className="text-xs font-semibold text-[oklch(0.70_0.03_280)] uppercase tracking-wider mb-2">
              Total Cafes
            </div>
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {cafes.length}
            </div>
            <p className="text-xs text-[oklch(0.70_0.03_280)] mt-2">
              Registered cafes on the platform
            </p>
          </div>

          <div className="lux-glass rounded-2xl p-6 border border-[oklch(1_0_0/10%)]">
            <div className="text-xs font-semibold text-[oklch(0.70_0.03_280)] uppercase tracking-wider mb-2">
              Active Cafes
            </div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">
              {cafes.filter((c) => c.status === "ACTIVE").length}
            </div>
            <p className="text-xs text-[oklch(0.70_0.03_280)] mt-2">
              Open and ready to receive orders
            </p>
          </div>

          <div className="lux-glass rounded-2xl p-6 border border-[oklch(1_0_0/10%)]">
            <div className="text-xs font-semibold text-[oklch(0.70_0.03_280)] uppercase tracking-wider mb-2">
              Cafe System
            </div>
            <div className="flex items-center gap-2 text-base font-bold text-white tracking-tight">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span>Independent Cafes</span>
            </div>
            <p className="text-xs text-[oklch(0.70_0.03_280)] mt-2">
              Separate data and menus for each cafe
            </p>
          </div>
        </div>

        {/* Cafe Directory Table */}
        <div className="lux-glass rounded-3xl border border-[oklch(1_0_0/10%)] overflow-hidden shadow-2xl">
          <div className="p-6 sm:p-8 border-b border-[oklch(1_0_0/8%)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Cafe Management
              </h2>
              <p className="text-xs text-[oklch(0.70_0.03_280)] mt-1">
                Each cafe has its own menu, orders, tables, and settings.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="sm:hidden text-xs bg-gradient-to-r from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] text-white font-bold h-9 rounded-xl"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              <span>Add Cafe</span>
            </Button>
          </div>

          <div>
            {isLoading ? (
              <div className="p-12 text-center text-xs text-[oklch(0.70_0.03_280)]">
                Loading cafes...
              </div>
            ) : cafes.length === 0 ? (
              <div className="p-12 text-center">
                <Building2 className="h-10 w-10 text-[oklch(0.70_0.03_280)] mx-auto mb-3" />
                <div className="text-sm font-bold text-white">No Cafes Added Yet</div>
                <div className="text-xs text-[oklch(0.70_0.03_280)] mt-1 mb-4">
                  Click the button above to add your first cafe.
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                  className="bg-gradient-to-r from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] text-white font-bold text-xs"
                >
                  Add First Cafe
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[oklch(1_0_0/8%)] bg-[oklch(0.15_0.022_280)] text-[11px] font-bold uppercase tracking-wider text-[oklch(0.70_0.03_280)]">
                    <tr>
                      <th className="px-6 py-4">Cafe Name</th>
                      <th className="px-6 py-4">Subdomain</th>
                      <th className="px-6 py-4">Cafe Owner</th>
                      <th className="px-6 py-4">Currency</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[oklch(1_0_0/6%)]">
                    {cafes.map((cafe) => (
                      <tr
                        key={cafe.subdomain}
                        className="hover:bg-[oklch(0.20_0.025_280/50%)] transition-colors"
                      >
                        <td className="px-6 py-4 font-semibold text-white">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-[oklch(0.62_0.27_305/15%)] border border-[oklch(0.62_0.27_305/30%)] flex items-center justify-center text-[oklch(0.62_0.27_305)]">
                              <Coffee className="h-4 w-4" />
                            </div>
                            <span>{cafe.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-[oklch(0.70_0.03_280)]">
                          <span className="rounded-lg bg-[oklch(0.15_0.022_280)] px-2.5 py-1 border border-[oklch(1_0_0/8%)] text-purple-300">
                            {cafe.subdomain}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[oklch(0.70_0.03_280)]">
                          <div className="text-white font-medium">{cafe.owner_name || "—"}</div>
                          <div className="text-[11px] text-[oklch(0.70_0.03_280)]">
                            {cafe.owner_email || "—"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-white font-bold">
                          {cafe.currency}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                            {cafe.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <a
                            href={`/?cafe=${encodeURIComponent(cafe.subdomain)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-300 hover:text-white bg-[oklch(0.62_0.27_305/15%)] hover:bg-[oklch(0.62_0.27_305/30%)] px-3 py-1.5 rounded-lg border border-[oklch(0.62_0.27_305/30%)] transition-colors"
                          >
                            <span>Customer Menu</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <a
                            href={`/login?cafe=${encodeURIComponent(cafe.subdomain)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-[oklch(0.20_0.025_280)] hover:bg-[oklch(0.24_0.03_280)] px-3 py-1.5 rounded-lg border border-[oklch(1_0_0/10%)] transition-colors"
                          >
                            <span>Cafe Login</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Cafe Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Cafe"
        description="Create a new cafe, choose its subdomain, and set up the owner account."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateCafe} className="space-y-4">
          {submitError && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Cafe Name"
              placeholder="e.g. Modern Roast"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Subdomain / Slug"
              placeholder="e.g. modernroast"
              value={formData.subdomain}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                })
              }
              required
              helperText="Used as: [subdomain].yourdomain.com"
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
              placeholder="owner@yourcafe.com"
              value={formData.owner_email}
              onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={formData.owner_password}
              onChange={(e) =>
                setFormData({ ...formData, owner_password: e.target.value })
              }
              required
              helperText="At least 6 characters for cafe owner login."
            />
            <Input
              label="Currency"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              required
            />
          </div>

          <Input
            label="Description"
            placeholder="Specialty coffees, fresh pastries, and snacks."
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
              className="bg-gradient-to-r from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] text-white font-bold"
            >
              Create Cafe
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
