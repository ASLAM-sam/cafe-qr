"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useTenant } from "@/context/TenantContext";
import { customerService } from "@/services/apiClient";
import { Loader2, QrCode, AlertCircle } from "lucide-react";

export default function TableQrRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const { setTableContext } = useTenant();
  const token = params?.token as string;

  const [status, setStatus] = React.useState<"resolving" | "redirecting" | "error">("resolving");
  const [errorMessage, setErrorMessage] = React.useState<string>("This table QR code is no longer active.");

  React.useEffect(() => {
    let isMounted = true;

    async function resolveToken() {
      if (!token) {
        if (isMounted) {
          setStatus("error");
          setErrorMessage("QR code not valid.");
        }
        return;
      }

      try {
        const res = await customerService.resolveTableToken(token);

        if (!isMounted) return;

        if (res?.table && res?.cafe) {
          setTableContext(res.table.qr_token, res.table.table_number, res.table.table_id);

          if (typeof window !== "undefined") {
            try {
              sessionStorage.setItem("cafe_table_token", res.table.qr_token);
              sessionStorage.setItem("cafe_table_number", res.table.table_number);
              sessionStorage.setItem("cafe_table_id", res.table.table_id);
              sessionStorage.setItem("cafe_subdomain", res.cafe.subdomain);
            } catch {
              // Ignore sessionStorage errors in restricted environments
            }

            const cleanHost = window.location.hostname.toLowerCase().trim();
            const configuredDomain = (process.env.NEXT_PUBLIC_DOMAIN || "").split(":")[0].toLowerCase().trim();
            const isSubdomainMatch =
              configuredDomain && cleanHost.startsWith(`${res.cafe.subdomain.toLowerCase()}.`);

            const targetUrl = isSubdomainMatch
              ? `/?table=${encodeURIComponent(res.table.table_number)}&token=${encodeURIComponent(res.table.qr_token)}`
              : `/?cafe=${encodeURIComponent(res.cafe.subdomain)}&table=${encodeURIComponent(res.table.table_number)}&token=${encodeURIComponent(res.table.qr_token)}`;

            setStatus("redirecting");
            router.replace(targetUrl);
          }
        } else {
          setStatus("error");
          setErrorMessage("This table QR code is no longer active.");
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        setStatus("error");
        const msg = err instanceof Error ? err.message : "";
        if (msg.toLowerCase().includes("unavailable") || msg.toLowerCase().includes("inactive")) {
          setErrorMessage("This cafe is currently unavailable.");
        } else {
          setErrorMessage("This table QR code is no longer active.");
        }
      }
    }

    resolveToken();

    return () => {
      isMounted = false;
    };
  }, [token, setTableContext, router]);

  if (status === "error") {
    return (
      <main className="min-h-screen bg-[oklch(0.12_0.02_280)] text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-[oklch(1_0_0/10%)] bg-[oklch(0.16_0.025_280)] p-8 text-center shadow-2xl space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <QrCode className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              QR Code Not Valid
            </h1>
            <p className="text-sm text-slate-400">
              {errorMessage}
            </p>
          </div>

          <div className="rounded-2xl bg-[oklch(0.13_0.02_280)] border border-[oklch(1_0_0/8%)] p-4 text-xs text-slate-400 flex items-start gap-2.5 text-left">
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Please ask cafe staff for assistance or request a new table QR code to view the menu and place your order.
            </span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[oklch(0.12_0.02_280)] text-slate-100 flex flex-col items-center justify-center p-4 text-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-2xl bg-[oklch(0.62_0.27_305/15%)] border border-[oklch(0.62_0.27_305/30%)] flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[oklch(0.70_0.22_305)]" />
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">
            Connecting to table...
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Loading your digital menu experience
          </p>
        </div>
      </div>
    </main>
  );
}
