"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useTenant } from "@/context/TenantContext";
import { customerService } from "@/services/apiClient";
import { Loader2 } from "lucide-react";

export default function TableQrRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const { subdomain, setTableContext } = useTenant();
  const token = params?.token as string;

  React.useEffect(() => {
    async function resolveToken() {
      if (!token) return;
      try {
        const table = await customerService.resolveTableToken(
          subdomain || "default",
          token
        );
        if (table) {
          setTableContext(table.qr_token, table.table_number);
        }
      } catch {
        // Fallback: store token directly
        setTableContext(token, null);
      } finally {
        router.replace("/");
      }
    }

    resolveToken();
  }, [token, subdomain, setTableContext, router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
      <p className="mt-3 text-sm font-semibold text-slate-800">
        Connecting to table...
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Loading your digital menu experience
      </p>
    </div>
  );
}
