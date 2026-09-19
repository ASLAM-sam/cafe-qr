"use client";

import * as React from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { CategoryRowSkeleton } from "@/components/ui/Skeleton";
import { adminService } from "@/services/apiClient";
import { Category } from "@/types";
import { Plus, Layers, Edit2, Trash2 } from "lucide-react";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  // Form Fields
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [displayOrder, setDisplayOrder] = React.useState("0");
  const [isActive, setIsActive] = React.useState(true);

  // Delete State
  const [deletingCatId, setDeletingCatId] = React.useState<string | null>(null);

  const loadCategories = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminService.getCategories();
      setCategories(data || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load categories.";
      setError(msg);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName("");
    setDescription("");
    setDisplayOrder(categories.length.toString());
    setIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description || "");
    setDisplayOrder(category.display_order.toString());
    setIsActive(category.is_active);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const orderNum = parseInt(displayOrder, 10);

    setIsSaving(true);
    try {
      if (editingCategory) {
        const updated = await adminService.updateCategory(editingCategory.category_id, {
          name: name.trim(),
          description: description.trim() || undefined,
          display_order: isNaN(orderNum) ? 0 : orderNum,
          is_active: isActive,
        });
        setCategories((prev) =>
          prev.map((c) => (c.category_id === updated.category_id ? updated : c))
        );
      } else {
        const created = await adminService.createCategory({
          name: name.trim(),
          description: description.trim() || undefined,
          display_order: isNaN(orderNum) ? 0 : orderNum,
          is_active: isActive,
        });
        setCategories((prev) => [...prev, created]);
      }
      setIsModalOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save category.";
      setFormError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category? Categories with active products cannot be deleted.")) {
      return;
    }

    setDeletingCatId(categoryId);
    try {
      await adminService.deleteCategory(categoryId);
      setCategories((prev) => prev.filter((c) => c.category_id !== categoryId));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete category.";
      alert(msg);
    } finally {
      setDeletingCatId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Menu Categories"
        description="Organize your menu into groups like Coffee, Burgers, and Desserts."
        action={
          <Button
            size="sm"
            variant="primary"
            className="gap-1.5"
            onClick={handleOpenCreate}
          >
            <Plus className="h-4 w-4" />
            <span>Add Category</span>
          </Button>
        }
      />

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          <CategoryRowSkeleton />
          <CategoryRowSkeleton />
          <CategoryRowSkeleton />
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No categories created yet"
          description="Create your first category (e.g. 'Coffee', 'Burgers') so you can organize your menu items."
          actionLabel="Create First Category"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <div className="divide-y divide-slate-100">
            {categories.map((category) => (
              <div
                key={category.category_id}
                className="flex items-center justify-between p-4 hover:bg-slate-50/60 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-bold text-xs shrink-0">
                    <Layers className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-900">
                        {category.name}
                      </h4>
                      {category.is_active ? (
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                          Hidden
                        </span>
                      )}
                    </div>
                    {category.description && (
                      <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenEdit(category)}
                    className="h-8 w-8 p-0"
                    title="Edit category"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(category.category_id)}
                    disabled={deletingCatId === category.category_id}
                    className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    title="Delete category"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create / Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSaving && setIsModalOpen(false)}
        title={editingCategory ? "Edit Category" : "Create Category"}
        description={
          editingCategory
            ? "Update category name, description, and display order."
            : "Add a new menu section for organizing products."
        }
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
              {formError}
            </div>
          )}

          <Input
            label="Category Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Artisanal Coffees"
            required
          />

          <Input
            label="Display Order"
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(e.target.value)}
            placeholder="0"
            helperText="Lower numbers appear first on the menu."
          />

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-800">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of this category..."
              rows={2}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActiveCheckbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <label
              htmlFor="isActiveCheckbox"
              className="text-xs font-medium text-slate-800 cursor-pointer"
            >
              Active (visible on customer menu)
            </label>
          </div>

          <div className="pt-3 flex gap-2">
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
              {editingCategory ? "Save Changes" : "Create Category"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
