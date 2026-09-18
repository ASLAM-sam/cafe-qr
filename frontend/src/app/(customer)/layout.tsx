import * as React from "react";
import { TenantProvider } from "@/context/TenantContext";
import { CartProvider } from "@/context/CartContext";
import { CustomerHeader } from "@/components/customer/CustomerHeader";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TenantProvider>
      <CartProvider>
        <div className="flex min-h-screen flex-col bg-slate-100/60">
          {/* Customer Container (mobile-first max-w-lg container centered on larger screens) */}
          <div className="mx-auto flex w-full max-w-lg flex-1 flex-col bg-slate-50 shadow-sm min-h-screen border-x border-slate-200/60">
            <CustomerHeader />
            <main className="flex-1 pb-20">{children}</main>
          </div>
        </div>
      </CartProvider>
    </TenantProvider>
  );
}
