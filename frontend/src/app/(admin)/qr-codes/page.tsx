"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { QrCode, Download } from "lucide-react";

export default function AdminQrCodesPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <PageHeader
        title="QR Codes"
        description="Download and print high-resolution QR codes for each dining table."
        action={
          <Button size="sm" variant="outline" className="gap-1.5" disabled>
            <Download className="h-4 w-4" />
            <span>Download All QRs</span>
          </Button>
        }
      />

      <EmptyState
        icon={QrCode}
        title="No QR codes available yet"
        description="Add tables in Table Management to automatically generate printable QR codes for your café."
        actionLabel="Go to Tables"
        onAction={() => {
          router.push("/tables");
        }}
      />
    </div>
  );
}
