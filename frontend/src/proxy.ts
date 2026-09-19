import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const url = request.nextUrl;
  const paramCafe = url.searchParams.get("cafe");

  let subdomain: string | null = null;
  let isPlatform = true;

  if (paramCafe) {
    subdomain = paramCafe.toLowerCase().trim();
    isPlatform = false;
  } else {
    const cleanHost = hostname.split(":")[0].toLowerCase();
    if (cleanHost !== "localhost" && cleanHost !== "127.0.0.1") {
      const parts = cleanHost.split(".");
      if (parts.length === 2 && parts[1] === "localhost") {
        subdomain = parts[0];
        isPlatform = false;
      } else if (
        parts.length > 2 &&
        parts[0] !== "www" &&
        parts[0] !== "app" &&
        parts[0] !== "platform"
      ) {
        subdomain = parts[0];
        isPlatform = false;
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
