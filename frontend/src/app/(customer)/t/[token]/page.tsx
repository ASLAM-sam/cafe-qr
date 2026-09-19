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
      let resolvedCafeSubdomain: string | null = subdomain;
      try {
        const res = await customerService.resolveTableToken(
          subdomain || "default",
          token
        ) as unknown as { table?: { qr_token: string; table_number: string }; cafe?: { subdomain: string } };

        if (res?.table) {
          setTableContext(res.table.qr_token, res.table.table_number);
        }
        if (res?.cafe?.subdomain) {
          resolvedCafeSubdomain = res.cafe.subdomain;
        }
      } catch {
        // Fallback: store token directly
        setTableContext(token, null);
      } finally {
        const targetUrl = resolvedCafeSubdomain
          ? `/?cafe=${encodeURIComponent(resolvedCafeSubdomain)}`
          : "/";
        router.replace(targetUrl);
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
