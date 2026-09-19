"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { QrCode, Download, Printer } from "lucide-react";
import { adminService } from "@/services/apiClient";
import { Table } from "@/types";
import { TableRowSkeleton } from "@/components/ui/Skeleton";

export default function AdminQrCodesPage() {
  const router = useRouter();
  const [tables, setTables] = React.useState<Table[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadTables() {
      setIsLoading(true);
      try {
        const data = await adminService.getTables();
        setTables(data || []);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load tables.";
        setError(msg);
        setTables([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadTables();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <PageHeader
          title="QR Codes"
          description="High-resolution printable QR codes for each dining table in your café."
        />

        {tables.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrint}
              className="gap-1.5"
            >
              <Printer className="h-4 w-4" />
              <span>Print All</span>
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 print:hidden">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3 print:hidden">
          <TableRowSkeleton />
          <TableRowSkeleton />
          <TableRowSkeleton />
        </div>
      ) : tables.length === 0 ? (
        <EmptyState
          icon={QrCode}
          title="No QR codes available yet"
          description="Add tables in Table Management to automatically generate printable QR codes for your café."
          actionLabel="Go to Tables"
          onAction={() => {
            router.push("/tables");
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.map((table) => {
            const qrUrl = adminService.getTableQrUrl(table.table_id);
            return (
              <div
                key={table.table_id}
                className="rounded-2xl border-2 border-slate-200 bg-white p-6 text-center shadow-xs flex flex-col items-center justify-between gap-4 break-inside-avoid"
              >
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Dine-in Ordering
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-1">
                    Table {table.table_number}
                  </h3>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrUrl}
                    alt={`Table ${table.table_number} QR Code`}
                    className="w-44 h-44 object-contain"
                  />
                </div>

                <div className="w-full space-y-2">
                  <p className="text-[11px] text-slate-500">
                    Scan with any smartphone camera to order.
                  </p>
                  <a
                    href={qrUrl}
                    download={`table-${table.table_number}-qr.png`}
                    className="inline-flex items-center justify-center gap-1.5 w-full h-8 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition print:hidden"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download PNG</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
