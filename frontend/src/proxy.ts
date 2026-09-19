import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const rawHost = request.headers.get("host") || "";
  const cleanHost = rawHost.split(":")[0].toLowerCase().trim();
  const url = request.nextUrl;
  const paramCafe = url.searchParams.get("cafe");

  const SUBDOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
  const RESERVED_SUBDOMAINS = new Set(["www", "app", "platform", "api", "admin", "mail", "smtp", "cdn", "static"]);

  let subdomain: string | null = null;
  let isPlatform = true;

  if (paramCafe) {
    const candidate = paramCafe.toLowerCase().trim();
    if (SUBDOMAIN_REGEX.test(candidate) && !RESERVED_SUBDOMAINS.has(candidate)) {
      subdomain = candidate;
      isPlatform = false;
    }
  } else {
    const configuredDomain = (process.env.NEXT_PUBLIC_DOMAIN || "").split(":")[0].toLowerCase().trim();

    if (cleanHost === "localhost" || cleanHost === "127.0.0.1") {
      isPlatform = true;
    } else if (cleanHost.endsWith(".localhost")) {
      const candidate = cleanHost.replace(/\.localhost$/, "");
      if (SUBDOMAIN_REGEX.test(candidate) && !RESERVED_SUBDOMAINS.has(candidate)) {
        subdomain = candidate;
        isPlatform = false;
      }
    } else if (configuredDomain && cleanHost.endsWith("." + configuredDomain)) {
      const candidate = cleanHost.slice(0, -(configuredDomain.length + 1));
      if (SUBDOMAIN_REGEX.test(candidate) && !RESERVED_SUBDOMAINS.has(candidate)) {
        subdomain = candidate;
        isPlatform = false;
      }
    } else if (configuredDomain && (cleanHost === configuredDomain || cleanHost === `www.${configuredDomain}`)) {
      isPlatform = true;
    } else if (cleanHost.endsWith(".vercel.app")) {
      const parts = cleanHost.split(".");
      // e.g. brewhouse.cafe-qr.vercel.app (4 parts)
      if (parts.length > 3) {
        const candidate = parts[0];
        if (SUBDOMAIN_REGEX.test(candidate) && !RESERVED_SUBDOMAINS.has(candidate)) {
          subdomain = candidate;
          isPlatform = false;
        }
      } else {
        isPlatform = true;
      }
    } else {
      // Fallback for custom domains when NEXT_PUBLIC_DOMAIN is not explicitly set
      const parts = cleanHost.split(".");
      if (parts.length > 2) {
        const candidate = parts[0];
        if (SUBDOMAIN_REGEX.test(candidate) && !RESERVED_SUBDOMAINS.has(candidate)) {
          subdomain = candidate;
          isPlatform = false;
        }
      }
    }
  }

  // Clone request headers and set tenant context
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-subdomain", subdomain || "");
  requestHeaders.set("x-is-platform", isPlatform ? "true" : "false");

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
