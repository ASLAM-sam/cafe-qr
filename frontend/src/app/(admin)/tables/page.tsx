"use client";

import * as React from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Plus, Grid } from "lucide-react";

export default function AdminTablesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tables"
        description="Manage café dining tables and their ordering status."
        action={
          <Button size="sm" variant="primary" className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Add Table</span>
          </Button>
        }
      />

      <EmptyState
        icon={Grid}
        title="No tables configured"
        description="Create your tables (e.g. Table 1, Table 2) to generate unique QR ordering tokens for your guests."
        actionLabel="Add Table"
        onAction={() => {}}
      />
    </div>
  );
}
