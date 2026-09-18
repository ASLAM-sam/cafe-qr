"use client";

import * as React from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Plus, Layers } from "lucide-react";

export default function AdminCategoriesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Menu Categories"
        description="Organize your menu into groups like Coffee, Burgers, and Desserts."
        action={
          <Button size="sm" variant="primary" className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Add Category</span>
          </Button>
        }
      />

      <EmptyState
        icon={Layers}
        title="No categories created yet"
        description="Create your first category (e.g. 'Coffee', 'Burgers') so you can organize your menu items."
        actionLabel="Create First Category"
        onAction={() => {}}
      />
    </div>
  );
}
