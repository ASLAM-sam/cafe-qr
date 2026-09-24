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
    default: "Cafe QR SaaS — Simple QR Table Ordering for Cafes",
    template: "%s | Cafe QR SaaS",
  },
  description:
    "Simple QR ordering for your cafe. Let customers scan a QR code, view your menu, add items and place orders from their phone. No app needed.",
  keywords: [
    "cafe QR ordering",
    "digital menu",
    "table ordering system",
    "QR menu SaaS",
    "contactless cafe menu",
    "cafe orders",
    "multi-cafe platform",
  ],
  authors: [{ name: "Cafe QR SaaS Platform" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://cafe-qr-seven.vercel.app",
    siteName: "Cafe QR SaaS",
    title: "Cafe QR SaaS — Turn Every Table Into an Instant Ordering Experience",
    description:
      "Customers scan a QR code, view your menu, add items and place orders from their phone. See new orders instantly in your dashboard.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cafe QR SaaS — Turn Every Table Into an Instant Ordering Experience",
    description:
      "Simple QR table ordering for modern cafes. No app needed.",
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
