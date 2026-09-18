"use client";

import * as React from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export default function AdminSettingsPage() {
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast("success", "Settings updated successfully", "Saved");
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Settings"
        description="Configure your café profile, branding, and billing details."
      />

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
                defaultValue="Brew House"
                placeholder="e.g. Brew House"
                required
              />
              <Input
                label="Subdomain"
                defaultValue="brewhouse"
                placeholder="e.g. brewhouse"
                disabled
                helperText="Subdomain is managed by the platform."
              />
            </div>
            <Input
              label="Tagline / Description"
              defaultValue="Fresh artisanal coffee and handcrafted bites."
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
                defaultValue="+91 98765 43210"
                placeholder="+91..."
              />
              <Input
                label="Contact Email"
                defaultValue="hello@brewhouse.com"
                type="email"
                placeholder="info@cafe.com"
              />
            </div>
            <Input
              label="Physical Address"
              defaultValue="Shop 4, Market Complex, MG Road"
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Tax Rate (%)"
                type="number"
                defaultValue="5"
                placeholder="e.g. 5"
                helperText="Percentage added to order subtotal."
              />
              <Input
                label="Currency"
                defaultValue="INR (₹)"
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
