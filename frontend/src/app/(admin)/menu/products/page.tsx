"use client";

import * as React from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { ProductRowSkeleton } from "@/components/ui/Skeleton";
import { adminService } from "@/services/apiClient";
import { Product, Category } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  Plus,
  UtensilsCrossed,
  Edit2,
  Trash2,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  // Form Fields
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [isAvailable, setIsAvailable] = React.useState(true);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);

  // Delete State
  const [deletingProductId, setDeletingProductId] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [prods, cats] = await Promise.all([
        adminService.getProducts(),
        adminService.getCategories(),
      ]);
      setProducts(prods || []);
      setCategories(cats || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load products.";
      setError(msg);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setName("");
    setDescription("");
    setPrice("");
    setCategoryId(categories.length > 0 ? categories[0].category_id : "");
    setIsAvailable(true);
    setImageFile(null);
    setImagePreview(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description || "");
    setPrice(product.price.toString());
    setCategoryId(product.category_id);
    setIsAvailable(product.is_available);
    setImageFile(null);
    setImagePreview(product.image_url || null);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setFormError("Only JPG, PNG, and WEBP image formats are supported.");
      return;
    }

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setFormError("Image file size must not exceed 5 MB.");
      return;
    }

    setFormError(null);
    setImageFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setFormError("Please enter a valid non-negative price.");
      return;
    }

    if (!categoryId) {
      setFormError("Please select a category for this product.");
      return;
    }

    setIsSaving(true);
    try {
      let savedProduct: Product;

      if (editingProduct) {
        // Update product details
        savedProduct = await adminService.updateProduct(editingProduct.product_id, {
          name: name.trim(),
          description: description.trim() || undefined,
          price: numPrice,
          category_id: categoryId,
          is_available: isAvailable,
        });

        // If new image was picked, upload and replace in Cloudinary
        if (imageFile) {
          setIsUploadingImage(true);
          try {
            savedProduct = await adminService.uploadProductImage(
              editingProduct.product_id,
              imageFile
            );
          } catch (uploadErr) {
            console.error("Image upload failed:", uploadErr);
            setFormError("Product saved, but image upload failed. Please try uploading again.");
            // Still update state with saved product
            setProducts((prev) =>
              prev.map((p) => (p.product_id === savedProduct.product_id ? savedProduct : p))
            );
            setIsSaving(false);
            setIsUploadingImage(false);
            return;
          }
        }

        setProducts((prev) =>
          prev.map((p) => (p.product_id === savedProduct.product_id ? savedProduct : p))
        );
      } else {
        // Create new product
        savedProduct = await adminService.createProduct({
          name: name.trim(),
          description: description.trim() || undefined,
          price: numPrice,
          category_id: categoryId,
          is_available: isAvailable,
        });

        // If an image was selected, upload it to Cloudinary for this new product
        if (imageFile) {
          setIsUploadingImage(true);
          try {
            savedProduct = await adminService.uploadProductImage(
              savedProduct.product_id,
              imageFile
            );
          } catch (uploadErr) {
            console.error("Image upload failed:", uploadErr);
            setFormError("Product created, but image upload failed. You can upload an image by editing.");
          }
        }

        setProducts((prev) => [savedProduct, ...prev]);
      }

      setIsModalOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save product.";
      setFormError(msg);
    } finally {
      setIsSaving(false);
      setIsUploadingImage(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product? This will also remove any associated image from Cloudinary.")) {
      return;
    }

    setDeletingProductId(productId);
    try {
      await adminService.deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.product_id !== productId));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete product.";
      alert(msg);
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleToggleAvailability = async (product: Product) => {
    try {
      const updated = await adminService.updateProduct(product.product_id, {
        is_available: !product.is_available,
      });
      setProducts((prev) =>
        prev.map((p) => (p.product_id === product.product_id ? updated : p))
      );
    } catch (err) {
      console.error("Failed to toggle availability:", err);
    }
  };

  const getCategoryName = (catId: string) => {
    const cat = categories.find((c) => c.category_id === catId);
    return cat ? cat.name : "Uncategorized";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage menu items, prices, descriptions, and Cloudinary photos."
        action={
          <Button
            size="sm"
            variant="primary"
            className="gap-1.5"
            onClick={handleOpenCreate}
            disabled={categories.length === 0}
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </Button>
        }
      />

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      {categories.length === 0 && !isLoading && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            You need to create at least one category before adding products. Please go to Menu &gt; Categories.
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          <ProductRowSkeleton />
          <ProductRowSkeleton />
          <ProductRowSkeleton />
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No products yet"
          description="Add your first food or drink item with pricing and photos to start building your digital menu."
          actionLabel={categories.length > 0 ? "Add First Product" : undefined}
          onAction={categories.length > 0 ? handleOpenCreate : undefined}
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <div className="divide-y divide-slate-100">
            {products.map((product) => (
              <div
                key={product.product_id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-slate-50/60 transition"
              >
                <div className="flex items-start sm:items-center gap-3">
                  {/* Product Image Preview */}
                  <div className="h-14 w-14 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {product.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-slate-400" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-900">
                        {product.name}
                      </h4>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        {getCategoryName(product.category_id)}
                      </span>
                      {product.is_available ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                          <CheckCircle className="h-3 w-3" />
                          In Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                          <XCircle className="h-3 w-3" />
                          Unavailable
                        </span>
                      )}
                    </div>
                    {product.description && (
                      <p className="mt-0.5 text-xs text-slate-500 line-clamp-1 max-w-md">
                        {product.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <span className="text-sm font-bold text-slate-900">
                    {formatCurrency(product.price)}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleAvailability(product)}
                      title={product.is_available ? "Mark as unavailable" : "Mark as available"}
                      className="text-xs"
                    >
                      {product.is_available ? "Disable" : "Enable"}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEdit(product)}
                      className="h-8 w-8 p-0"
                      title="Edit product"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(product.product_id)}
                      disabled={deletingProductId === product.product_id}
                      className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      title="Delete product"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSaving && setIsModalOpen(false)}
        title={editingProduct ? "Edit Product" : "Add New Product"}
        description={
          editingProduct
            ? "Update item pricing, description, availability, and Cloudinary photo."
            : "Create a new menu product with Cloudinary photo storage."
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
            label="Product Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Artisanal Cappuccino"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 180"
              required
            />

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-800">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-slate-900 focus:outline-none"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-800">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Rich description of the item, ingredients, or notes..."
              rows={2}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-slate-900 focus:outline-none"
            />
          </div>

          {/* Cloudinary Image Upload Section */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-800">
              Product Photo (Cloudinary)
            </label>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-6 w-6 text-slate-400" />
                )}
              </div>

              <div className="flex-1">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition">
                  <Upload className="h-3.5 w-3.5" />
                  <span>{editingProduct?.image_url ? "Replace Image" : "Choose Image"}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <p className="mt-1 text-[11px] text-slate-500">
                  JPG, PNG, or WEBP up to 5 MB. Uploaded securely to Cloudinary.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isAvailableCheckbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <label
              htmlFor="isAvailableCheckbox"
              className="text-xs font-medium text-slate-800 cursor-pointer"
            >
              Available for ordering (customers can add to cart)
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
              isLoading={isSaving || isUploadingImage}
              className="flex-1"
            >
              {isUploadingImage
                ? "Uploading to Cloudinary..."
                : isSaving
                ? "Saving Product..."
                : editingProduct
                ? "Save Changes"
                : "Create Product"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
