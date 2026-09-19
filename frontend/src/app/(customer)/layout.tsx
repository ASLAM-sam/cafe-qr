"use client";

import * as React from "react";
import { TenantProvider, useTenant } from "@/context/TenantContext";
import { CartProvider } from "@/context/CartContext";
import { CustomerHeader } from "@/components/customer/CustomerHeader";

function CustomerShell({ children }: { children: React.ReactNode }) {
  const { isPlatform } = useTenant();

  if (isPlatform) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100/60">
      {/* Customer Container (mobile-first max-w-lg container centered on larger screens) */}
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col bg-slate-50 shadow-sm min-h-screen border-x border-slate-200/60">
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

