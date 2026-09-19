"use client";

import * as React from "react";
import { Cafe } from "@/types";

interface TenantContextType {
  cafe: Cafe | null;
  subdomain: string | null;
  isPlatform: boolean;
  tableToken: string | null;
  tableNumber: string | null;
  isLoading: boolean;
  setCafe: (cafe: Cafe | null) => void;
  setTableContext: (token: string | null, number: string | null) => void;
}

const TenantContext = React.createContext<TenantContextType | undefined>(undefined);

export function resolveTenantFromHost(hostname: string, searchParams?: URLSearchParams): {
  subdomain: string | null;
  isPlatform: boolean;
} {
  // Query param override (useful for dev and testing: ?cafe=slug)
  const paramCafe = searchParams?.get("cafe");
  if (paramCafe) {
    return { subdomain: paramCafe.toLowerCase().trim(), isPlatform: false };
  }

  // Handle localhost: e.g. "brewhouse.localhost" vs "localhost"
  const cleanHost = hostname.split(":")[0].toLowerCase();
  if (cleanHost === "localhost" || cleanHost === "127.0.0.1") {
    return { subdomain: null, isPlatform: true };
  }

  const parts = cleanHost.split(".");

  // e.g. "brewhouse.localhost" -> parts = ["brewhouse", "localhost"]
  if (parts.length === 2 && parts[1] === "localhost") {
    return { subdomain: parts[0], isPlatform: false };
  }

  // e.g. "brewhouse.yourdomain.com" -> parts = ["brewhouse", "yourdomain", "com"]
  // e.g. "brewhouse.cafe-qr.vercel.app" -> parts = ["brewhouse", "cafe-qr", "vercel", "app"]
  if (parts.length > 2 && parts[0] !== "www" && parts[0] !== "app" && parts[0] !== "platform") {
    return { subdomain: parts[0], isPlatform: false };
  }

  // Root platform domain: e.g. "yourdomain.com", "www.yourdomain.com", "cafe-qr.vercel.app"
  return { subdomain: null, isPlatform: true };
}

export function TenantProvider({
  children,
  initialCafe = null,
  initialSubdomain = null,
  initialIsPlatform = false,
}: {
  children: React.ReactNode;
  initialCafe?: Cafe | null;
  initialSubdomain?: string | null;
  initialIsPlatform?: boolean;
}) {
  const [cafe, setCafe] = React.useState<Cafe | null>(initialCafe);
  const [subdomain, setSubdomain] = React.useState<string | null>(initialSubdomain);
  const [isPlatform, setIsPlatform] = React.useState<boolean>(initialIsPlatform);
  const [tableToken, setTableToken] = React.useState<string | null>(null);
  const [tableNumber, setTableNumber] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(!initialCafe && !initialIsPlatform);

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

        const resolution = resolveTenantFromHost(hostname, urlParams);
        setSubdomain(resolution.subdomain);
        setIsPlatform(resolution.isPlatform);

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
        isPlatform,
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

