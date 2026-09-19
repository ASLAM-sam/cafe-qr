"use client";

import * as React from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { adminService } from "@/services/apiClient";
import { Cafe } from "@/types";
import { Loader2 } from "lucide-react";

export default function AdminSettingsPage() {
  const { showToast } = useToast();
  const [cafe, setCafe] = React.useState<Cafe | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Form Fields
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [taxRate, setTaxRate] = React.useState("5");
  const [taxEnabled, setTaxEnabled] = React.useState(true);

  React.useEffect(() => {
    async function loadCafe() {
      setIsLoading(true);
      try {
        const data = await adminService.getCafe();
        if (data) {
          setCafe(data);
          setName(data.name || "");
          setDescription(data.description || "");
          setPhone(data.phone || "");
          setEmail(data.email || "");
          setAddress(data.address || "");
          if (data.tax_settings) {
            setTaxEnabled(data.tax_settings.tax_enabled ?? true);
            setTaxRate(data.tax_settings.tax_rate_percent?.toString() || "5");
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load café settings.";
        setErrorMessage(msg);
      } finally {
        setIsLoading(false);
      }
    }
    loadCafe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    const parsedTaxRate = parseFloat(taxRate);

    try {
      const updated = await adminService.updateCafe({
        name: name.trim(),
        description: description.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        tax_settings: {
          tax_enabled: taxEnabled,
          tax_rate_percent: isNaN(parsedTaxRate) ? 0 : parsedTaxRate,
        },
      });

      setCafe(updated);
      showToast("success", "Café settings updated successfully", "Saved");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save settings.";
      setErrorMessage(msg);
      showToast("error", msg, "Error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-3">
        <Loader2 className="h-7 w-7 animate-spin text-slate-900" />
        <p className="text-xs text-slate-500">Loading café settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Settings"
        description="Configure your café profile, branding, and billing details."
      />

      {errorMessage && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Café Profile & Branding */}
        <Card>
          <CardHeader>
            <CardTitle>Café Information & Branding</CardTitle>
            <CardDescription>
              Basic details shown to customers on the digital QR menu.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Café Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Brew House"
                required
              />
              <Input
                label="Subdomain"
                value={cafe?.subdomain || ""}
                disabled
                helperText="Subdomain is managed by the platform."
              />
            </div>
            <Input
              label="Tagline / Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short tagline for your menu"
            />
          </CardContent>
        </Card>

        {/* Contact & Location */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Details</CardTitle>
            <CardDescription>
              Address and phone numbers displayed on your public ordering website.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91..."
              />
              <Input
                label="Contact Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="info@cafe.com"
              />
            </div>
            <Input
              label="Physical Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full address of the café"
            />
          </CardContent>
        </Card>

        {/* Tax Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Tax Configuration</CardTitle>
            <CardDescription>
              Configure goods & services tax (GST / VAT) applied at checkout.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="taxEnabledCheckbox"
                checked={taxEnabled}
                onChange={(e) => setTaxEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <label
                htmlFor="taxEnabledCheckbox"
                className="text-xs font-semibold text-slate-800 cursor-pointer"
              >
                Enable tax calculation at checkout
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Tax Rate (%)"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="e.g. 5"
                disabled={!taxEnabled}
                helperText="Percentage added to order subtotal."
              />
              <Input
                label="Currency"
                value={cafe?.currency || "INR (₹)"}
                disabled
                helperText="Contact platform admin to modify currency."
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end pt-4">
            <Button type="submit" variant="primary" isLoading={isSaving}>
              Save Settings
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
