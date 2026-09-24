"use client";

import * as React from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { adminService } from "@/services/apiClient";
import { AddonGroup, AddonItem, Product } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  Plus,
  PlusCircle,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Layers,
  Sparkles,
  Check,
} from "lucide-react";

interface AddonItemFormState {
  addon_item_id?: string;
  name: string;
  price: string;
  is_available: boolean;
}

export default function AdminAddonsPage() {
  const [addonGroups, setAddonGroups] = React.useState<AddonGroup[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingGroup, setEditingGroup] = React.useState<AddonGroup | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  // Form Fields
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [selectionType, setSelectionType] = React.useState<"single" | "multiple">("multiple");
  const [isRequired, setIsRequired] = React.useState(false);
  const [maxSelections, setMaxSelections] = React.useState("1");
  const [selectedProductIds, setSelectedProductIds] = React.useState<string[]>([]);
  const [items, setItems] = React.useState<AddonItemFormState[]>([
    { name: "", price: "0", is_available: true },
  ]);

  // Delete State
  const [deletingGroupId, setDeletingGroupId] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [addons, prods] = await Promise.all([
        adminService.getAddons(),
        adminService.getProducts(),
      ]);
      setAddonGroups(addons || []);
      setProducts(prods || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load add-on groups.";
      setError(msg);
      setAddonGroups([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setEditingGroup(null);
    setName("");
    setDescription("");
    setSelectionType("multiple");
    setIsRequired(false);
    setMaxSelections("1");
    setSelectedProductIds([]);
    setItems([{ name: "", price: "0", is_available: true }]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (group: AddonGroup) => {
    setEditingGroup(group);
    setName(group.name);
    setDescription(group.description || "");
    const isSingle = group.max_selections === 1;
    setSelectionType(isSingle ? "single" : "multiple");
    setIsRequired(group.is_required);
    setMaxSelections(group.max_selections.toString());
    setSelectedProductIds(group.product_ids || []);
    setItems(
      group.items.map((it) => ({
        addon_item_id: it.addon_item_id,
        name: it.name,
        price: it.price.toString(),
        is_available: it.is_available,
      }))
    );
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleAddItemRow = () => {
    setItems((prev) => [...prev, { name: "", price: "0", is_available: true }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof AddonItemFormState, value: string | boolean) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAllProducts = () => {
    if (selectedProductIds.length === products.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(products.map((p) => p.product_id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Group name is required.");
      return;
    }

    const validItems = items.filter((it) => it.name.trim().length > 0);
    if (validItems.length === 0) {
      setFormError("At least one option with a name is required.");
      return;
    }

    const maxSel = selectionType === "single" ? 1 : parseInt(maxSelections) || 1;
    const minSel = isRequired ? 1 : 0;

    const formattedItems = validItems.map((it) => ({
      addon_item_id: it.addon_item_id,
      name: it.name.trim(),
      price: Math.max(0, parseFloat(it.price) || 0),
      is_available: it.is_available,
    }));

    setIsSaving(true);
    try {
      if (editingGroup) {
        await adminService.updateAddon(editingGroup.addon_group_id, {
          name: name.trim(),
          description: description.trim() || undefined,
          is_required: isRequired,
          min_selections: minSel,
          max_selections: maxSel,
          items: formattedItems as AddonItem[],
          product_ids: selectedProductIds,
        });
      } else {
        await adminService.createAddon({
          name: name.trim(),
          description: description.trim() || undefined,
          is_required: isRequired,
          min_selections: minSel,
          max_selections: maxSel,
          items: formattedItems,
          product_ids: selectedProductIds,
        });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save add-on group.";
      setFormError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (groupId: string) => {
    try {
      await adminService.deleteAddon(groupId);
      setDeletingGroupId(null);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete add-on group.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add-ons & Options"
        description="Offer customizations like extra toppings, milk choices, and upgrades for your menu items."
        action={
          <Button
            onClick={handleOpenCreate}
            size="sm"
            className="gap-2 bg-gradient-to-r from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] text-white shadow-md shadow-[oklch(0.62_0.27_305/20%)] font-semibold"
          >
            <Plus className="h-4 w-4" />
            <span>New Add-on Group</span>
          </Button>
        }
      />

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-950/40 border border-rose-500/30 p-4 text-sm text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 rounded-2xl bg-[oklch(0.18_0.025_280)] border border-[oklch(1_0_0/8%)] animate-pulse p-5"
            />
          ))}
        </div>
      ) : addonGroups.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No add-on groups yet"
          description="Create your first add-on group to offer extras, toppings, or size choices to your customers."
          actionLabel="Create Add-on Group"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {addonGroups.map((group) => {
            const applicableProductCount = group.product_ids?.length || 0;
            return (
              <div
                key={group.addon_group_id}
                className="flex flex-col justify-between rounded-2xl border border-[oklch(1_0_0/10%)] bg-[oklch(0.18_0.025_280)] p-5 shadow-xl transition-all duration-200 hover:border-[oklch(0.62_0.27_305/40%)] hover:shadow-2xl hover:shadow-[oklch(0.62_0.27_305/8%)]"
              >
                <div>
                  {/* Group Header */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">
                        {group.name}
                      </h3>
                      {group.description && (
                        <p className="text-xs text-[oklch(0.70_0.03_280)] mt-0.5">
                          {group.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {group.is_required ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/30">
                          Required
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[oklch(1_0_0/6%)] text-[oklch(0.70_0.03_280)] border border-[oklch(1_0_0/8%)]">
                          Optional
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metadata Chips */}
                  <div className="flex items-center gap-2 flex-wrap mb-3.5 text-xs text-[oklch(0.65_0.03_280)]">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[oklch(0.15_0.02_280)] border border-[oklch(1_0_0/8%)] text-[11px]">
                      {group.max_selections === 1
                        ? "Single choice (Radio)"
                        : `Choose up to ${group.max_selections}`}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[oklch(0.15_0.02_280)] border border-[oklch(1_0_0/8%)] text-[11px]">
                      <Layers className="h-3 w-3 text-[oklch(0.62_0.27_305)]" />
                      {applicableProductCount === 0
                        ? "All products"
                        : `${applicableProductCount} product${applicableProductCount > 1 ? "s" : ""}`}
                    </span>
                  </div>

                  {/* Items List */}
                  <div className="space-y-1.5 border-t border-[oklch(1_0_0/8%)] pt-3">
                    <span className="block text-[10px] uppercase tracking-wider font-semibold text-[oklch(0.60_0.03_280)] mb-1">
                      Options ({group.items.length})
                    </span>
                    <div className="divide-y divide-[oklch(1_0_0/6%)] max-h-36 overflow-y-auto pr-1">
                      {group.items.map((item, idx) => (
                        <div
                          key={item.addon_item_id || idx}
                          className="flex items-center justify-between py-1.5 text-xs"
                        >
                          <div className="flex items-center gap-1.5 truncate mr-2">
                            {item.is_available ? (
                              <CheckCircle className="h-3 w-3 text-emerald-400 shrink-0" />
                            ) : (
                              <XCircle className="h-3 w-3 text-rose-400 shrink-0" />
                            )}
                            <span
                              className={`truncate ${
                                item.is_available
                                  ? "text-white/90"
                                  : "text-white/40 line-through"
                              }`}
                            >
                              {item.name}
                            </span>
                          </div>
                          <span className="font-mono text-[oklch(0.85_0.15_305)] shrink-0 font-medium">
                            {item.price > 0 ? `+${formatCurrency(item.price)}` : "Free"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-3.5 mt-4 flex items-center justify-end gap-2 border-t border-[oklch(1_0_0/8%)]">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(group)}
                    className="h-8 text-xs gap-1.5 bg-[oklch(0.15_0.02_280)] border-[oklch(1_0_0/10%)] text-white hover:bg-[oklch(0.20_0.025_280)]"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-[oklch(0.62_0.27_305)]" />
                    <span>Edit</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingGroupId(group.addon_group_id)}
                    className="h-8 text-xs gap-1.5 bg-[oklch(0.15_0.02_280)] border-rose-500/20 text-rose-300 hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                    <span>Delete</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGroup ? "Edit Add-on Group" : "Create Add-on Group"}
        description="Configure options and prices that customers can add to items."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-white">
          {formError && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-950/40 border border-rose-500/30 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{formError}</span>
            </div>
          )}

          {/* Group Name & Description */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[oklch(0.75_0.02_280)] mb-1">
                Group Name <span className="text-rose-400">*</span>
              </label>
              <Input
                placeholder="e.g., Milk Choice, Extra Toppings, Size"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-[oklch(0.15_0.02_280)] border-[oklch(1_0_0/12%)] text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[oklch(0.75_0.02_280)] mb-1">
                Description (Optional)
              </label>
              <Input
                placeholder="e.g., Choose your preferred milk option"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-[oklch(0.15_0.02_280)] border-[oklch(1_0_0/12%)] text-white"
              />
            </div>
          </div>

          {/* Selection Rules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[oklch(0.15_0.02_280)] border border-[oklch(1_0_0/8%)]">
            <div>
              <label className="block text-xs font-semibold text-[oklch(0.75_0.02_280)] mb-1">
                Selection Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectionType("single");
                    setMaxSelections("1");
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                    selectionType === "single"
                      ? "bg-[oklch(0.62_0.27_305)] border-[oklch(0.62_0.27_305)] text-white"
                      : "bg-[oklch(0.18_0.025_280)] border-[oklch(1_0_0/10%)] text-[oklch(0.70_0.03_280)] hover:text-white"
                  }`}
                >
                  Single (Radio)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectionType("multiple");
                    if (maxSelections === "1") setMaxSelections("3");
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                    selectionType === "multiple"
                      ? "bg-[oklch(0.62_0.27_305)] border-[oklch(0.62_0.27_305)] text-white"
                      : "bg-[oklch(0.18_0.025_280)] border-[oklch(1_0_0/10%)] text-[oklch(0.70_0.03_280)] hover:text-white"
                  }`}
                >
                  Multiple (Checkboxes)
                </button>
              </div>
            </div>

            {selectionType === "multiple" ? (
              <div>
                <label className="block text-xs font-semibold text-[oklch(0.75_0.02_280)] mb-1">
                  Max Selections Allowed
                </label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={maxSelections}
                  onChange={(e) => setMaxSelections(e.target.value)}
                  className="bg-[oklch(0.18_0.025_280)] border-[oklch(1_0_0/12%)] text-white"
                />
              </div>
            ) : (
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-white/90">
                  <input
                    type="checkbox"
                    checked={isRequired}
                    onChange={(e) => setIsRequired(e.target.checked)}
                    className="h-4 w-4 rounded border-[oklch(1_0_0/20%)] bg-[oklch(0.18_0.025_280)] text-[oklch(0.62_0.27_305)] focus:ring-[oklch(0.62_0.27_305)]"
                  />
                  <span>Customer Must Choose One (Required)</span>
                </label>
              </div>
            )}
          </div>

          {/* Options Items Builder */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[oklch(0.75_0.02_280)] uppercase tracking-wider">
                Options / Add-on Items <span className="text-rose-400">*</span>
              </label>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="text-xs font-semibold text-[oklch(0.85_0.15_305)] hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 rounded-xl bg-[oklch(0.15_0.02_280)] border border-[oklch(1_0_0/8%)]"
                >
                  <div className="flex-1">
                    <Input
                      placeholder="Option name (e.g. Oat Milk)"
                      value={item.name}
                      onChange={(e) => handleItemChange(index, "name", e.target.value)}
                      required
                      className="h-8 text-xs bg-[oklch(0.18_0.025_280)] border-[oklch(1_0_0/10%)] text-white"
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="Price (₹)"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, "price", e.target.value)}
                      className="h-8 text-xs font-mono bg-[oklch(0.18_0.025_280)] border-[oklch(1_0_0/10%)] text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleItemChange(index, "is_available", !item.is_available)}
                    title={item.is_available ? "In stock" : "Out of stock"}
                    className={`h-8 px-2 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 ${
                      item.is_available
                        ? "bg-emerald-950/60 border-emerald-500/30 text-emerald-300"
                        : "bg-rose-950/60 border-rose-500/30 text-rose-300"
                    }`}
                  >
                    {item.is_available ? "Active" : "Hidden"}
                  </button>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(index)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-white/50 hover:text-rose-400 hover:bg-rose-500/10"
                      title="Remove option"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Linked Products Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[oklch(0.75_0.02_280)] uppercase tracking-wider">
                Applies To Products
              </label>
              <button
                type="button"
                onClick={handleSelectAllProducts}
                className="text-xs text-[oklch(0.70_0.03_280)] hover:text-white"
              >
                {selectedProductIds.length === products.length
                  ? "Deselect All"
                  : "Select All Products"}
              </button>
            </div>
            <p className="text-[11px] text-[oklch(0.60_0.03_280)]">
              {selectedProductIds.length === 0
                ? "Currently applies to ALL menu items. Select specific items below if this add-on only applies to certain drinks or dishes."
                : `Applies to ${selectedProductIds.length} selected product(s).`}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2 rounded-xl bg-[oklch(0.15_0.02_280)] border border-[oklch(1_0_0/8%)]">
              {products.map((p) => {
                const isSelected = selectedProductIds.includes(p.product_id);
                return (
                  <button
                    key={p.product_id}
                    type="button"
                    onClick={() => toggleProductSelection(p.product_id)}
                    className={`flex items-center justify-between gap-1.5 p-2 rounded-lg text-left text-xs transition-colors ${
                      isSelected
                        ? "bg-[oklch(0.62_0.27_305/20%)] border border-[oklch(0.62_0.27_305/50%)] text-white"
                        : "bg-[oklch(0.18_0.025_280)] border border-[oklch(1_0_0/6%)] text-white/70 hover:text-white"
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-[oklch(0.85_0.15_305)] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 flex justify-end gap-2 border-t border-[oklch(1_0_0/8%)]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="bg-[oklch(0.18_0.025_280)] border-[oklch(1_0_0/10%)] text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSaving}
              className="bg-gradient-to-r from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] text-white shadow-md font-semibold"
            >
              {editingGroup ? "Save Changes" : "Create Add-on Group"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deletingGroupId !== null}
        onClose={() => setDeletingGroupId(null)}
        title="Delete Add-on Group"
        description="Are you sure you want to delete this add-on group? This action cannot be undone."
      >
        <div className="pt-2 flex justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeletingGroupId(null)}
            className="bg-[oklch(0.18_0.025_280)] border-[oklch(1_0_0/10%)] text-white"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => deletingGroupId && handleDelete(deletingGroupId)}
            className="bg-rose-950/80 border border-rose-500/40 text-rose-200 hover:bg-rose-900"
          >
            Delete Group
          </Button>
        </div>
      </Modal>
    </div>
  );
}
