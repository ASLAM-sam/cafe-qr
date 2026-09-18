"use client";

import * as React from "react";
import { Cafe } from "@/types";

interface TenantContextType {
  cafe: Cafe | null;
  subdomain: string | null;
  tableToken: string | null;
  tableNumber: string | null;
  isLoading: boolean;
  setCafe: (cafe: Cafe | null) => void;
  setTableContext: (token: string | null, number: string | null) => void;
}

const TenantContext = React.createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({
  children,
  initialCafe = null,
}: {
  children: React.ReactNode;
  initialCafe?: Cafe | null;
}) {
  const [cafe, setCafe] = React.useState<Cafe | null>(initialCafe);
  const [subdomain, setSubdomain] = React.useState<string | null>(null);
  const [tableToken, setTableToken] = React.useState<string | null>(null);
  const [tableNumber, setTableNumber] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(!initialCafe);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        const urlParams = new URLSearchParams(window.location.search);

        // Extract table token or table number from URL params if present
        const tokenFromUrl = urlParams.get("token") || urlParams.get("t");
        const tableFromUrl = urlParams.get("table");
        if (tokenFromUrl) setTableToken(tokenFromUrl);
        if (tableFromUrl) setTableNumber(tableFromUrl);

        // Determine subdomain:
        // In production: e.g. "brewhouse.ourplatform.com" -> "brewhouse"
        // In dev: allow "?cafe=brewhouse" or fallback to env NEXT_PUBLIC_DEFAULT_TENANT
        const parts = hostname.split(".");
        let detectedSubdomain = "";

        if (parts.length > 2 && parts[0] !== "www") {
          detectedSubdomain = parts[0];
        } else {
          detectedSubdomain =
            urlParams.get("cafe") ||
            process.env.NEXT_PUBLIC_DEFAULT_TENANT ||
            "brewhouse";
        }

        setSubdomain(detectedSubdomain);

        // Apply dynamic brand primary color if provided
        if (cafe?.primary_color) {
          document.documentElement.style.setProperty(
            "--tenant-primary",
            cafe.primary_color
          );
        }

        setIsLoading(false);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [cafe]);

  const setTableContext = React.useCallback(
    (token: string | null, number: string | null) => {
      setTableToken(token);
      setTableNumber(number);
    },
    []
  );

  return (
    <TenantContext.Provider
      value={{
        cafe,
        subdomain,
        tableToken,
        tableNumber,
        isLoading,
        setCafe,
        setTableContext,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = React.useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
