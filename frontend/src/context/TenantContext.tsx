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
  const SUBDOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
  const RESERVED_SUBDOMAINS = new Set(["www", "app", "platform", "api", "admin", "mail", "smtp", "cdn", "static"]);

  // Query param override (useful for dev and testing: ?cafe=slug)
  const paramCafe = searchParams?.get("cafe");
  if (paramCafe) {
    const candidate = paramCafe.toLowerCase().trim();
    if (SUBDOMAIN_REGEX.test(candidate) && !RESERVED_SUBDOMAINS.has(candidate)) {
      return { subdomain: candidate, isPlatform: false };
    }
  }

  const cleanHost = hostname.split(":")[0].toLowerCase().trim();
  const configuredDomain = (process.env.NEXT_PUBLIC_DOMAIN || "").split(":")[0].toLowerCase().trim();

  // Local development
  if (cleanHost === "localhost" || cleanHost === "127.0.0.1") {
    return { subdomain: null, isPlatform: true };
  }

  if (cleanHost.endsWith(".localhost")) {
    const candidate = cleanHost.replace(/\.localhost$/, "");
    if (SUBDOMAIN_REGEX.test(candidate) && !RESERVED_SUBDOMAINS.has(candidate)) {
      return { subdomain: candidate, isPlatform: false };
    }
    return { subdomain: null, isPlatform: true };
  }

  // Configured production domain
  if (configuredDomain && (cleanHost === configuredDomain || cleanHost === `www.${configuredDomain}`)) {
    return { subdomain: null, isPlatform: true };
  }

  if (configuredDomain && cleanHost.endsWith("." + configuredDomain)) {
    const candidate = cleanHost.slice(0, -(configuredDomain.length + 1));
    if (SUBDOMAIN_REGEX.test(candidate) && !RESERVED_SUBDOMAINS.has(candidate)) {
      return { subdomain: candidate, isPlatform: false };
    }
    return { subdomain: null, isPlatform: true };
  }

  // Vercel deployment preview / app domain
  if (cleanHost.endsWith(".vercel.app")) {
    const parts = cleanHost.split(".");
    if (parts.length > 3) {
      const candidate = parts[0];
      if (SUBDOMAIN_REGEX.test(candidate) && !RESERVED_SUBDOMAINS.has(candidate)) {
        return { subdomain: candidate, isPlatform: false };
      }
    }
    return { subdomain: null, isPlatform: true };
  }

  // Generic 3-part domain fallback
  const parts = cleanHost.split(".");
  if (parts.length > 2) {
    const candidate = parts[0];
    if (SUBDOMAIN_REGEX.test(candidate) && !RESERVED_SUBDOMAINS.has(candidate)) {
      return { subdomain: candidate, isPlatform: false };
    }
  }

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

