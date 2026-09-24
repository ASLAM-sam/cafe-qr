"use client";

import * as React from "react";
import { useTenant } from "@/context/TenantContext";
import { CartProvider } from "@/context/CartContext";

import { CustomerHeader } from "@/components/customer/CustomerHeader";

function CustomerShell({ children }: { children: React.ReactNode }) {
  const { isPlatform } = useTenant();

  if (isPlatform) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-stone-100/60">
      {/* Customer Container — mobile-first, responsively wider on tablets/desktops */}
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col bg-white shadow-sm min-h-screen md:max-w-xl lg:max-w-2xl md:shadow-lg md:my-0 md:border-x md:border-stone-200/40">
        <CustomerHeader />
        <main className="flex-1 pb-20">{children}</main>
      </div>
    </div>
  );
}

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <CustomerShell>{children}</CustomerShell>
    </CartProvider>
  );
}
