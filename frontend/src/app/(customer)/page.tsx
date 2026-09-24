"use client";

import * as React from "react";
import { useTenant } from "@/context/TenantContext";
import { customerService } from "@/services/apiClient";
import { Category, Product, Order } from "@/types";
import { CustomerHero } from "@/components/customer/CustomerHero";
import { CategoryNav } from "@/components/customer/CategoryNav";
import { ProductCard } from "@/components/customer/ProductCard";
import { ProductDetailModal } from "@/components/customer/ProductDetailModal";
import { FloatingCartBar } from "@/components/customer/FloatingCartBar";
import { CartDrawer } from "@/components/customer/CartDrawer";
import { OrderTimeline } from "@/components/customer/OrderTimeline";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { UtensilsCrossed, Search, X } from "lucide-react";
import { PlatformLanding } from "@/components/platform/PlatformLanding";

export default function CustomerMenuPage() {
  const { subdomain, cafe, setCafe, isPlatform } = useTenant();

  const [categories, setCategories] = React.useState<Category[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);

  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [activeOrder, setActiveOrder] = React.useState<Order | null>(null);
  const [isOrderTrackingOpen, setIsOrderTrackingOpen] = React.useState(false);

  const loadMenuData = React.useCallback(async () => {
    if (isPlatform) {
      setIsLoading(false);
      return;
    }

    try {
      const activeSubdomain = subdomain || "default";

      // Fetch cafe branding, categories, and products
      const [cafeData, categoriesData, productsData] = await Promise.allSettled([
        customerService.getCafeBySubdomain(activeSubdomain),
        customerService.getCategories(activeSubdomain),
        customerService.getProducts(activeSubdomain),
      ]);

      if (cafeData.status === "fulfilled") {
        setCafe(cafeData.value);
      }
      if (categoriesData.status === "fulfilled") {
        setCategories(categoriesData.value);
      } else {
        setCategories([]);
      }
      if (productsData.status === "fulfilled") {
        setProducts(productsData.value);
      } else {
        setProducts([]);
      }
    } catch {
      setError("Unable to connect to the cafe menu service. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [isPlatform, subdomain, setCafe]);

  React.useEffect(() => {
    loadMenuData();
  }, [loadMenuData]);

  const filteredProducts = React.useMemo(() => {
    let result = products;

    // Filter by category
    if (selectedCategoryId) {
      result = result.filter((p) => p.category_id === selectedCategoryId);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    return result;
  }, [products, selectedCategoryId, searchQuery]);

  // Group products by category for display
  const groupedProducts = React.useMemo(() => {
    if (selectedCategoryId || searchQuery.trim()) {
      return [{ categoryName: null, products: filteredProducts }];
    }

    const activeCategories = categories
      .filter((c) => c.is_active)
      .sort((a, b) => a.display_order - b.display_order);

    const groups: { categoryName: string | null; products: Product[] }[] = [];

    for (const cat of activeCategories) {
      const catProducts = filteredProducts.filter((p) => p.category_id === cat.category_id);
      if (catProducts.length > 0) {
        groups.push({ categoryName: cat.name, products: catProducts });
      }
    }

    // Uncategorized products
    const categorizedIds = new Set(activeCategories.map((c) => c.category_id));
    const uncategorized = filteredProducts.filter((p) => !categorizedIds.has(p.category_id));
    if (uncategorized.length > 0) {
      groups.push({ categoryName: "Other", products: uncategorized });
    }

    return groups;
  }, [filteredProducts, categories, selectedCategoryId, searchQuery]);

  const handleOrderPlaced = (order: Order) => {
    setActiveOrder(order);
    setIsOrderTrackingOpen(true);
  };

  // Only render PlatformLanding AFTER all hooks have executed unconditionally
  if (isPlatform) {
    return <PlatformLanding />;
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Cafe Hero & Branding */}
      <CustomerHero />

      {/* Search Bar */}
      <div className="px-4 py-3 bg-white border-b border-stone-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-9 rounded-xl bg-stone-100 border border-stone-200/60 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-300 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Navigation Bar */}
      {categories.length > 0 && (
        <CategoryNav
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />
      )}

      {/* Main Content Area */}
      <div className="px-4 py-4 pb-28">
        {isLoading ? (
          <div className="space-y-3">
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </div>
        ) : error ? (
          <ErrorState
            title="Could not load menu"
            message={error}
            onRetry={loadMenuData}
          />
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon={UtensilsCrossed}
            title={
              searchQuery
                ? "No items found"
                : selectedCategoryId
                ? "No items in this category"
                : "No menu items available"
            }
            description={
              searchQuery
                ? `No menu items match "${searchQuery}". Try a different search.`
                : selectedCategoryId
                ? "Items for this category will appear here once added by the cafe."
                : "The cafe has not added any menu items yet. Please check back shortly."
            }
            actionLabel={selectedCategoryId ? "View All Items" : undefined}
            onAction={
              selectedCategoryId ? () => setSelectedCategoryId(null) : undefined
            }
          />
        ) : (
          <div className="space-y-6">
            {groupedProducts.map((group, groupIdx) => (
              <div key={group.categoryName || groupIdx}>
                {group.categoryName && (
                  <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3 px-1">
                    {group.categoryName}
                  </h3>
                )}
                <div className="space-y-2.5">
                  {group.products.map((product) => (
                    <ProductCard
                      key={product.product_id}
                      product={product}
                      currency={cafe?.currency || "INR"}
                      onViewDetail={setSelectedProduct}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Floating Cart Summary */}
      <FloatingCartBar currency={cafe?.currency || "INR"} />

      {/* Cart Drawer & Checkout Form */}
      <CartDrawer onOrderPlaced={handleOrderPlaced} />

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          currency={cafe?.currency || "INR"}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Order Tracking & Status Modal */}
      <OrderTimeline
        order={activeOrder}
        isOpen={isOrderTrackingOpen}
        onClose={() => setIsOrderTrackingOpen(false)}
      />
    </div>
  );
}
