"use client";

import * as React from "react";
import { useTenant } from "@/context/TenantContext";
import { customerService } from "@/services/apiClient";
import { Category, Product, Order } from "@/types";
import { CustomerHero } from "@/components/customer/CustomerHero";
import { CategoryNav } from "@/components/customer/CategoryNav";
import { ProductCard } from "@/components/customer/ProductCard";
import { FloatingCartBar } from "@/components/customer/FloatingCartBar";
import { CartDrawer } from "@/components/customer/CartDrawer";
import { OrderTimeline } from "@/components/customer/OrderTimeline";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { UtensilsCrossed } from "lucide-react";
import { PlatformLanding } from "@/components/platform/PlatformLanding";

export default function CustomerMenuPage() {
  const { subdomain, cafe, setCafe, isPlatform } = useTenant();

  const [categories, setCategories] = React.useState<Category[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(null);

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
      setError("Unable to connect to the café menu service. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [isPlatform, subdomain, setCafe]);

  React.useEffect(() => {
    loadMenuData();
  }, [loadMenuData]);

  const filteredProducts = React.useMemo(() => {
    if (!selectedCategoryId) return products;
    return products.filter((p) => p.category_id === selectedCategoryId);
  }, [products, selectedCategoryId]);

  const handleOrderPlaced = (order: Order) => {
    setActiveOrder(order);
    setIsOrderTrackingOpen(true);
  };

  // Only render PlatformLanding AFTER all hooks have executed unconditionally
  if (isPlatform) {
    return <PlatformLanding />;
  }

  return (

    <div>
      {/* Cafe Hero & Branding */}
      <CustomerHero />

      {/* Category Navigation Bar */}
      {categories.length > 0 && (
        <CategoryNav
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />
      )}

      {/* Main Content Area */}
      <div className="px-4 py-4">
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
              selectedCategoryId
                ? "No products in this category"
                : "No menu items available"
            }
            description={
              selectedCategoryId
                ? "Items for this category will appear here once added by the café."
                : "The café has not added any menu items yet. Please check back shortly."
            }
            actionLabel={selectedCategoryId ? "View All Items" : undefined}
            onAction={
              selectedCategoryId ? () => setSelectedCategoryId(null) : undefined
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.product_id}
                product={product}
                currency={cafe?.currency || "INR"}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mobile Floating Cart Summary */}
      <FloatingCartBar currency={cafe?.currency || "INR"} />

      {/* Cart Drawer & Checkout Form */}
      <CartDrawer onOrderPlaced={handleOrderPlaced} />

      {/* Order Tracking & Status Modal */}
      <OrderTimeline
        order={activeOrder}
        isOpen={isOrderTrackingOpen}
        onClose={() => setIsOrderTrackingOpen(false)}
      />
    </div>
  );
}
