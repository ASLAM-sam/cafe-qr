"use client";

import * as React from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Plus, UtensilsCrossed } from "lucide-react";

export default function AdminProductsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage menu items, prices, descriptions, and availability."
        action={
          <Button size="sm" variant="primary" className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </Button>
        }
      />

      <EmptyState
        icon={UtensilsCrossed}
        title="No products yet"
        description="Add your first food or drink item with pricing and photos to start building your digital menu."
        actionLabel="Add First Product"
        onAction={() => {}}
      />
    </div>
  );
}
