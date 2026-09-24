import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { TenantProvider } from "@/context/TenantContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#171221",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://cafe-qr-seven.vercel.app"),
  title: {
    default: "Café QR SaaS — Multi-Tenant QR Table Ordering Platform",
    template: "%s | Café QR SaaS",
  },
  description:
    "High-performance digital menu and QR ordering platform for cafés & roasteries. Guests scan table QR codes, order from their browser with zero app downloads, while managers receive live orders with sub-second real-time sync.",
  keywords: [
    "café QR ordering",
    "digital menu",
    "table ordering system",
    "QR menu SaaS",
    "restaurant QR ordering",
    "contactless café menu",
    "multi-tenant ordering platform",
  ],
  authors: [{ name: "Café QR SaaS Platform" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://cafe-qr-seven.vercel.app",
    siteName: "Café QR SaaS",
    title: "Café QR SaaS — Turn Every Table Into an Instant Ordering Experience",
    description:
      "Web-first digital menu and live order management for cafés. No app downloads, cryptographic table tokens, server-verified pricing, and real-time order tracking.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Café QR SaaS — Turn Every Table Into an Instant Ordering Experience",
    description:
      "Web-first digital menu and live order management for modern cafés & roasteries.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <ToastProvider>
          <TenantProvider>
            {children}
          </TenantProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
