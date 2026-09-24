"use client";

import * as React from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import { adminService } from "@/services/apiClient";
import { Table } from "@/types";
import { Plus, Grid, Trash2, QrCode, ExternalLink, Download } from "lucide-react";
import Link from "next/link";

export default function AdminTablesPage() {
  const [tables, setTables] = React.useState<Table[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [tableNumber, setTableNumber] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  // QR Modal State
  const [selectedTableForQr, setSelectedTableForQr] = React.useState<Table | null>(null);

  // Delete State
  const [deletingTableId, setDeletingTableId] = React.useState<string | null>(null);

  const loadTables = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
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
  }, []);

  React.useEffect(() => {
    loadTables();
  }, [loadTables]);

  const handleOpenCreate = () => {
    setTableNumber("");
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!tableNumber.trim()) {
      setFormError("Table number or identifier is required.");
      return;
    }

    setIsSaving(true);
    try {
      const created = await adminService.createTable({
        table_number: tableNumber.trim(),
      });
      setTables((prev) => [...prev, created]);
      setIsModalOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create table.";
      setFormError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (tableId: string) => {
    if (!confirm("Are you sure you want to delete this table? Customers using this QR token will no longer be able to place table orders.")) {
      return;
    }

    setDeletingTableId(tableId);
    try {
      await adminService.deleteTable(tableId);
      setTables((prev) => prev.filter((t) => t.table_id !== tableId));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete table.";
      alert(msg);
    } finally {
      setDeletingTableId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Tables"
          description="Manage dining tables and secure QR ordering tokens for your guests."
        />

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link href="/qr-codes">
            <Button variant="outline" size="sm" className="gap-1.5">
              <QrCode className="h-4 w-4" />
              <span>Print All QRs</span>
            </Button>
          </Link>
          <Button
            size="sm"
            variant="primary"
            className="gap-1.5"
            onClick={handleOpenCreate}
          >
            <Plus className="h-4 w-4" />
            <span>Add Table</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          <TableRowSkeleton />
          <TableRowSkeleton />
          <TableRowSkeleton />
        </div>
      ) : tables.length === 0 ? (
        <EmptyState
          icon={Grid}
          title="No tables configured"
          description="Create your dining tables (e.g. Table 1, Table 2) to generate unique QR ordering tokens for your guests."
          actionLabel="Add Table"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map((table) => (
            <div
              key={table.table_id}
              className="rounded-2xl border border-[oklch(1_0_0/10%)] bg-[oklch(0.18_0.025_280)] p-5 shadow-xl hover:border-[oklch(0.62_0.27_305/40%)] transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] text-white font-bold text-xs shadow-md shadow-[oklch(0.62_0.27_305/20%)]">
                      {table.table_number}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        Table {table.table_number}
                      </h4>
                      <span className="text-[11px] text-[oklch(0.70_0.03_280)] font-mono">
                        Token: {table.qr_token.substring(0, 10)}...
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(table.table_id)}
                    disabled={deletingTableId === table.table_id}
                    className="h-8 w-8 p-0 text-[oklch(0.70_0.03_280)] hover:text-rose-400 hover:bg-rose-500/10"
                    title="Delete table"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t border-[oklch(1_0_0/8%)] flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 flex-1 text-xs border-[oklch(1_0_0/10%)] bg-[oklch(0.20_0.025_280)] text-white hover:bg-[oklch(0.24_0.03_280)]"
                  onClick={() => setSelectedTableForQr(table)}
                >
                  <QrCode className="h-3.5 w-3.5" />
                  <span>View QR</span>
                </Button>

                <a
                  href={`/t/${table.qr_token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-8 px-2.5 rounded-lg border border-[oklch(1_0_0/10%)] text-xs font-semibold text-[oklch(0.70_0.03_280)] hover:text-white hover:bg-[oklch(0.22_0.03_280)] transition"
                  title="Test customer table ordering URL"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Table Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSaving && setIsModalOpen(false)}
        title="Add Table"
        description="Create a new dining table and generate its unique secure QR token."
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
              {formError}
            </div>
          )}

          <Input
            label="Table Identifier / Number"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            placeholder="e.g. 1, 2, Patio-A, Bar-1"
            required
            autoFocus
          />

          <p className="text-[11px] text-[oklch(0.70_0.03_280)]">
            A unique and secure QR code will be generated for this table.
          </p>

          <div className="pt-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSaving}
              onClick={() => setIsModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSaving}
              className="flex-1"
            >
              Create Table
            </Button>
          </div>
        </form>
      </Modal>

      {/* Single Table QR Code Modal */}
      <Modal
        isOpen={selectedTableForQr !== null}
        onClose={() => setSelectedTableForQr(null)}
        title={selectedTableForQr ? `QR Code — Table ${selectedTableForQr.table_number}` : ""}
        description="Customers scan this QR code to open the digital menu scoped to this table."
        maxWidth="sm"
      >
        {selectedTableForQr && (
          <div className="space-y-4 text-center">
            <div className="flex justify-center p-4 bg-white rounded-xl border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={adminService.getTableQrUrl(selectedTableForQr.table_id)}
                alt={`Table ${selectedTableForQr.table_number} QR Code`}
                className="w-48 h-48 object-contain"
              />
            </div>

            <p className="text-xs text-slate-500 font-mono break-all">
              Token: {selectedTableForQr.qr_token}
            </p>

            <div className="flex gap-2 pt-2">
              <a
                href={adminService.getTableQrUrl(selectedTableForQr.table_id)}
                download={`table-${selectedTableForQr.table_number}-qr.png`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download PNG</span>
              </a>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTableForQr(null)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
