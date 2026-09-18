"use client";

import * as React from "react";
import { CartItem, Product } from "@/types";
import { useTenant } from "./TenantContext";

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = React.createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { subdomain } = useTenant();
  const storageKey = `cafe_cart_${subdomain || "default"}`;

  const [items, setItems] = React.useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = React.useState<boolean>(false);
  const [isHydrated, setIsHydrated] = React.useState<boolean>(false);

  // Load tenant-specific cart from localStorage on mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          setItems(JSON.parse(saved));
        } else {
          setItems([]);
        }
      } catch {
        setItems([]);
      }
      setIsHydrated(true);
    }, 0);

    return () => clearTimeout(timer);
  }, [storageKey]);

  // Persist cart items whenever they change (after hydration)
  React.useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  }, [items, storageKey, isHydrated]);

  const addItem = React.useCallback((product: Product) => {
    if (!product.is_available) return;

    setItems((prev) => {
      const existing = prev.find((item) => item.product_id === product.product_id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          product_id: product.product_id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image_url: product.image_url,
          category_id: product.category_id,
        },
      ];
    });
  }, []);

  const removeItem = React.useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.product_id !== productId));
  }, []);

  const updateQuantity = React.useCallback((productId: string, delta: number) => {
    setItems((prev) => {
      return prev
        .map((item) => {
          if (item.product_id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  }, []);

  const clearCart = React.useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = React.useMemo(() => {
    return items.reduce((acc, item) => acc + item.quantity, 0);
  }, [items]);

  const subtotal = React.useMemo(() => {
    return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = React.useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
