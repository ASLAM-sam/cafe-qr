"use client";

import * as React from "react";
import { Cafe } from "@/types";

interface TenantContextType {
  cafe: Cafe | null;
  subdomain: string | null;
  isPlatform: boolean;
  tableToken: string | null;
  tableNumber: string | null;
  tableId: string | null;
  isLoading: boolean;
  setCafe: (cafe: Cafe | null) => void;
  setTableContext: (token: string | null, number: string | null, id?: string | null) => void;
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
  initialIsPlatform = true,
}: {
  children: React.ReactNode;
  initialCafe?: Cafe | null;
  initialSubdomain?: string | null;
  initialIsPlatform?: boolean;
}) {
  const [cafe, setCafe] = React.useState<Cafe | null>(initialCafe);
  const [subdomain, setSubdomain] = React.useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const res = resolveTenantFromHost(window.location.hostname, urlParams);
      return res.subdomain || initialSubdomain;
    }
    return initialSubdomain;
  });
  const [isPlatform, setIsPlatform] = React.useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const res = resolveTenantFromHost(window.location.hostname, urlParams);
      return res.isPlatform;
    }
    return initialIsPlatform;
  });
  const [tableToken, setTableToken] = React.useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const fromUrl = urlParams.get("token") || urlParams.get("t");
      if (fromUrl) return fromUrl;
      try {
        return sessionStorage.getItem("cafe_table_token") || null;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [tableNumber, setTableNumber] = React.useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const fromUrl = urlParams.get("table");
      if (fromUrl) return fromUrl;
      try {
        return sessionStorage.getItem("cafe_table_number") || null;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [tableId, setTableId] = React.useState<string | null>(() => {
    if (typeof window !== "undefined") {
      try {
        return sessionStorage.getItem("cafe_table_id") || null;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const hostname = window.location.hostname;
    const urlParams = new URLSearchParams(window.location.search);

    const tokenFromUrl = urlParams.get("token") || urlParams.get("t");
    const tableFromUrl = urlParams.get("table");

    if (tokenFromUrl) {
      setTableToken(tokenFromUrl);
      try {
        sessionStorage.setItem("cafe_table_token", tokenFromUrl);
      } catch {
        // Ignore sessionStorage errors
      }
    } else {
      try {
        const storedToken = sessionStorage.getItem("cafe_table_token");
        if (storedToken && !tableToken) setTableToken(storedToken);
      } catch {
        // Ignore sessionStorage errors
      }
    }

    if (tableFromUrl) {
      setTableNumber(tableFromUrl);
      try {
        sessionStorage.setItem("cafe_table_number", tableFromUrl);
      } catch {
        // Ignore sessionStorage errors
      }
    } else {
      try {
        const storedTable = sessionStorage.getItem("cafe_table_number");
        if (storedTable && !tableNumber) setTableNumber(storedTable);
      } catch {
        // Ignore sessionStorage errors
      }
    }

    try {
      const storedId = sessionStorage.getItem("cafe_table_id");
      if (storedId && !tableId) setTableId(storedId);
    } catch {
      // Ignore sessionStorage errors
    }

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
  }, [cafe, tableToken, tableNumber, tableId]);

  const setTableContext = React.useCallback(
    (token: string | null, number: string | null, id?: string | null) => {
      setTableToken(token);
      setTableNumber(number);
      if (id !== undefined) setTableId(id);
      if (typeof window !== "undefined") {
        try {
          if (token) sessionStorage.setItem("cafe_table_token", token);
          else sessionStorage.removeItem("cafe_table_token");
          if (number) sessionStorage.setItem("cafe_table_number", number);
          else sessionStorage.removeItem("cafe_table_number");
          if (id) sessionStorage.setItem("cafe_table_id", id);
          else if (id === null) sessionStorage.removeItem("cafe_table_id");
        } catch {
          // Ignore sessionStorage errors
        }
      }
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
        tableId,
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

