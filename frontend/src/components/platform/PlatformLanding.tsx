"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Coffee,
  QrCode,
  Smartphone,
  Clock,
  ShieldCheck,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Layers,
  CheckCircle2,
  ChevronDown,
  Menu,
  X,
  Radio,
  Sliders,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/Button";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Do customers need to download a mobile app to order?",
    answer:
      "No app download is ever required. Customers simply scan the QR code on their table using the native camera on iOS Safari or Android Chrome. The digital menu opens instantly as a fast, responsive web application directly in their browser.",
  },
  {
    question: "How does table identification work with QR codes?",
    answer:
      "Each table is assigned an unguessable 12-character cryptographic token. When a guest scans the QR code, the system securely resolves both the café tenant and the specific table number, automatically binding the order session to that table.",
  },
  {
    question: "Can multiple cafés use the platform without data mixing?",
    answer:
      "Yes. The platform is architected with strict multi-tenancy. Every database query, category, product, table, and order is strictly isolated by the café's tenant identifier (cafe_id). Café A cannot see or mutate any data belonging to Café B.",
  },
  {
    question: "What is included in the ₹999/month Café QR Pro plan?",
    answer:
      "Everything. There are no locked tiers, no upgrade walls, and no hidden fees. You get unlimited menu categories and products, Cloudinary image hosting, table management, high-res printable QR generation, live Ably real-time order updates, customer tracking, and the private Café Admin dashboard.",
  },
  {
    question: "How are customer payments handled?",
    answer:
      "To keep the ordering experience fast and free of payment gateway fees or checkout failures, payments are settled directly between the customer and the café (cash or direct UPI at the counter/table). The digital order is placed directly into the manager queue.",
  },
  {
    question: "Does the café owner need specialized POS hardware?",
    answer:
      "No specialized POS equipment is needed. The Café Admin dashboard runs smoothly on any smartphone, iPad/tablet, laptop, or desktop computer with a modern browser. It automatically plays an alert sound when a new order arrives.",
  },
  {
    question: "Can café managers update prices and item availability instantly?",
    answer:
      "Yes. Whenever a product is marked unavailable or its price is updated in the Café Admin dashboard, the change takes effect immediately. The backend validates prices authoritatively upon order submission, preventing stale or tampered client prices.",
  },
];

export function PlatformLanding() {
  const router = useRouter();
  const [customSlug, setCustomSlug] = React.useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(0);
  const [activeShowcaseTab, setActiveShowcaseTab] = React.useState<"manager" | "customer">("manager");

  const handleLaunchCustomCafe = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSlug.trim()) {
      router.push(`/?cafe=${encodeURIComponent(customSlug.trim().toLowerCase())}`);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[oklch(0.13_0.02_280)] text-[oklch(0.98_0.005_280)] selection:bg-[oklch(0.62_0.27_305)] selection:text-white">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse_at_center,oklch(0.62_0.27_305/18%),transparent_70%)] blur-3xl animate-lux-pulse-glow" />
        <div className="absolute top-[40%] -left-40 w-[600px] h-[600px] bg-[radial-gradient(circle,oklch(0.55_0.25_270/12%),transparent_65%)] blur-3xl" />
        <div className="absolute top-[70%] -right-40 w-[650px] h-[650px] bg-[radial-gradient(circle,oklch(0.62_0.27_305/10%),transparent_65%)] blur-3xl" />
      </div>

      {/* Luxury Sticky Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-[oklch(1_0_0/8%)] bg-[oklch(0.13_0.02_280/80%)] backdrop-blur-xl transition-all">
        <div className="w-full max-w-7xl mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-12">
          {/* Brand Logo & Multi-Tenant Pill */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] text-white shadow-lg shadow-[oklch(0.62_0.27_305/30%)] transition-transform group-hover:scale-105">
              <Coffee className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white group-hover:text-purple-200 transition-colors">
                  Café QR SaaS
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-[oklch(0.82_0.14_85/35%)] bg-[oklch(0.82_0.14_85/10%)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[oklch(0.82_0.14_85)]">
                  Multi-Tenant
                </span>
              </div>
              <span className="text-[11px] font-medium text-[oklch(0.70_0.03_280)] tracking-wide">
                Production Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-[oklch(0.70_0.03_280)]">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#demo" className="hover:text-white transition-colors">
              Live Demo
            </a>
            <a href="#showcase" className="hover:text-white transition-colors">
              Showcase
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-[oklch(0.98_0.005_280)] hover:text-white hover:bg-[oklch(0.22_0.03_280)] text-xs font-semibold px-4 h-9 rounded-xl border border-[oklch(1_0_0/8%)]"
              >
                Café Login
              </Button>
            </Link>
            <Link href="/admin">
              <Button
                size="sm"
                className="bg-gradient-to-r from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] hover:opacity-95 text-white font-semibold text-xs px-4 h-9 rounded-xl shadow-md shadow-[oklch(0.62_0.27_305/25%)] border border-[oklch(1_0_0/15%)]"
              >
                <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                <span>Platform Admin</span>
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl border border-[oklch(1_0_0/10%)] bg-[oklch(0.18_0.025_280)] text-slate-300 hover:text-white focus:outline-hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-b border-[oklch(1_0_0/10%)] bg-[oklch(0.16_0.025_280)] px-4 py-6 space-y-4">
            <nav className="flex flex-col space-y-3 text-sm font-medium text-[oklch(0.70_0.03_280)]">
              <a
                href="#features"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-white py-1 transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-white py-1 transition-colors"
              >
                How It Works
              </a>
              <a
                href="#demo"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-white py-1 transition-colors"
              >
                Live Demo
              </a>
              <a
                href="#showcase"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-white py-1 transition-colors"
              >
                Showcase
              </a>
              <a
                href="#pricing"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-white py-1 transition-colors"
              >
                Pricing
              </a>
              <a
                href="#faq"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-white py-1 transition-colors"
              >
                FAQ
              </a>
            </nav>
            <div className="flex flex-col gap-2 pt-4 border-t border-[oklch(1_0_0/10%)]">
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button
                  variant="outline"
                  className="w-full border-[oklch(1_0_0/12%)] bg-[oklch(0.20_0.025_280)] text-white text-xs h-10 rounded-xl"
                >
                  Café Owner Login
                </Button>
              </Link>
              <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full bg-gradient-to-r from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] text-white font-semibold text-xs h-10 rounded-xl">
                  Platform Admin
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 text-center">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[oklch(0.62_0.27_305/40%)] bg-[oklch(0.62_0.27_305/12%)] px-4 py-1.5 text-xs font-semibold text-purple-200 backdrop-blur-md mb-8">
            <Sparkles className="h-4 w-4 text-[oklch(0.82_0.14_85)]" />
            <span>The Modern QR Ordering Engine for Cafés & Roasteries</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.12]">
            Turn Every Table Into an{" "}
            <span className="bg-gradient-to-r from-[oklch(0.62_0.27_305)] via-[oklch(0.55_0.25_270)] to-[oklch(0.82_0.14_85)] bg-clip-text text-transparent">
              Instant Ordering Experience
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-7 text-base sm:text-lg md:text-xl text-[oklch(0.70_0.03_280)] max-w-3xl mx-auto font-normal leading-relaxed">
            A high-performance, web-first digital menu and live order management platform.
            Customers scan table QR codes, browse your menu, and place orders directly from their browser.
            Zero apps, zero downloads, pure instant speed.
          </p>

          {/* Hero CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto sm:max-w-none">
            <a href="#demo" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] hover:opacity-95 text-white font-bold shadow-xl shadow-[oklch(0.62_0.27_305/25%)] px-8 h-12 rounded-xl text-sm transition-all"
              >
                <span>Try Live Demo</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </a>
            <a href="#features" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-[oklch(1_0_0/15%)] bg-[oklch(0.18_0.025_280)] hover:bg-[oklch(0.22_0.03_280)] text-white font-semibold px-7 h-12 rounded-xl text-sm transition-all"
              >
                <span>Explore Features</span>
              </Button>
            </a>
          </div>

          {/* Architecture Trust Highlights */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto text-left">
            <div className="lux-glass rounded-2xl p-5 lux-glass-hover">
              <div className="text-[oklch(0.62_0.27_305)] text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5" />
                <span>Zero App Downloads</span>
              </div>
              <div className="text-white font-semibold text-sm">
                Instant Mobile Web
              </div>
              <div className="text-[oklch(0.70_0.03_280)] text-xs mt-1.5 leading-relaxed">
                Runs instantly on Safari and Chrome via table camera scan.
              </div>
            </div>

            <div className="lux-glass rounded-2xl p-5 lux-glass-hover">
              <div className="text-[oklch(0.55_0.25_270)] text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5" />
                <span>Real-Time Events</span>
              </div>
              <div className="text-white font-semibold text-sm">
                Ably Order Streams
              </div>
              <div className="text-[oklch(0.70_0.03_280)] text-xs mt-1.5 leading-relaxed">
                Sub-second order delivery and status tracking with reconnect sync.
              </div>
            </div>

            <div className="lux-glass rounded-2xl p-5 lux-glass-hover">
              <div className="text-[oklch(0.82_0.14_85)] text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Server Integrity</span>
              </div>
              <div className="text-white font-semibold text-sm">
                Authoritative Pricing
              </div>
              <div className="text-[oklch(0.70_0.03_280)] text-xs mt-1.5 leading-relaxed">
                Backend looks up database records; client price tampering is impossible.
              </div>
            </div>

            <div className="lux-glass rounded-2xl p-5 lux-glass-hover">
              <div className="text-[oklch(0.62_0.27_305)] text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <QrCode className="h-3.5 w-3.5" />
                <span>Cryptographic QR</span>
              </div>
              <div className="text-white font-semibold text-sm">
                Secure Table Tokens
              </div>
              <div className="text-[oklch(0.70_0.03_280)] text-xs mt-1.5 leading-relaxed">
                Unguessable 12-char tokens protect and bind table sessions cleanly.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Capability Metrics Strip */}
      <section className="relative z-10 py-10 border-y border-[oklch(1_0_0/8%)] bg-[oklch(0.15_0.022_280/60%)]">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                &lt; 2.0s
              </div>
              <div className="text-xs font-medium text-[oklch(0.70_0.03_280)] mt-1">
                First Menu Load Time
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[oklch(0.62_0.27_305)] tracking-tight">
                100%
              </div>
              <div className="text-xs font-medium text-[oklch(0.70_0.03_280)] mt-1">
                Server-Authoritative Pricing
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[oklch(0.82_0.14_85)] tracking-tight">
                0
              </div>
              <div className="text-xs font-medium text-[oklch(0.70_0.03_280)] mt-1">
                App Downloads Required
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[oklch(0.55_0.25_270)] tracking-tight">
                100%
              </div>
              <div className="text-xs font-medium text-[oklch(0.70_0.03_280)] mt-1">
                Tenant Data Scoping
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Showcase Section */}
      <section id="showcase" className="relative z-10 py-24">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[oklch(0.62_0.27_305)]">
              Product Visual Showcase
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mt-2">
              Designed for Speed & Flawless Execution
            </h2>
            <p className="text-[oklch(0.70_0.03_280)] text-sm sm:text-base mt-4">
              Explore the two synchronized sides of Café QR SaaS: the lightning-fast mobile customer ordering menu and the live manager order command terminal.
            </p>

            {/* Showcase Toggle Buttons */}
            <div className="inline-flex items-center gap-2 p-1.5 rounded-2xl bg-[oklch(0.18_0.025_280)] border border-[oklch(1_0_0/10%)] mt-8">
              <button
                type="button"
                onClick={() => setActiveShowcaseTab("manager")}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeShowcaseTab === "manager"
                    ? "bg-gradient-to-r from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] text-white shadow-md"
                    : "text-[oklch(0.70_0.03_280)] hover:text-white"
                }`}
              >
                Café Manager Live Terminal
              </button>
              <button
                type="button"
                onClick={() => setActiveShowcaseTab("customer")}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeShowcaseTab === "customer"
                    ? "bg-gradient-to-r from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] text-white shadow-md"
                    : "text-[oklch(0.70_0.03_280)] hover:text-white"
                }`}
              >
                Customer Mobile Menu
              </button>
            </div>
          </div>

          {/* Interactive UI Mockup Card */}
          <div className="lux-glass rounded-3xl p-6 sm:p-8 lg:p-10 border border-[oklch(1_0_0/12%)] shadow-2xl relative overflow-hidden">
            {activeShowcaseTab === "manager" ? (
              <div>
                {/* Mockup Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-[oklch(1_0_0/8%)] gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-rose-500" />
                    <div className="h-3 w-3 rounded-full bg-amber-500" />
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-mono text-[oklch(0.70_0.03_280)] ml-2">
                      brewhouse.cafe-qr.app/orders — Live Order Queue
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      Ably Realtime Connected
                    </span>
                  </div>
                </div>

                {/* Live Order Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  {/* Order 1: Placed */}
                  <div className="rounded-2xl border border-[oklch(0.82_0.14_85/30%)] bg-[oklch(0.15_0.022_280)] p-5 relative">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-[oklch(0.82_0.14_85)] bg-[oklch(0.82_0.14_85/15%)] px-2.5 py-0.5 rounded-full">
                        PLACED
                      </span>
                      <span className="text-xs font-mono text-[oklch(0.70_0.03_280)]">
                        Just now
                      </span>
                    </div>
                    <div className="text-lg font-bold text-white mb-1">
                      Order #1042 &bull; Table 04
                    </div>
                    <div className="text-xs text-[oklch(0.70_0.03_280)] mb-4">
                      Customer: Rahul Sharma
                    </div>
                    <div className="space-y-2 border-t border-[oklch(1_0_0/8%)] pt-3 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span>2x Flat White</span>
                        <span className="font-semibold text-white">₹380</span>
                      </div>
                      <div className="flex justify-between">
                        <span>1x Avocado Toast</span>
                        <span className="font-semibold text-white">₹290</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[oklch(1_0_0/8%)] flex items-center justify-between">
                      <span className="text-xs text-[oklch(0.70_0.03_280)]">Total (incl. tax)</span>
                      <span className="text-base font-bold text-white">₹703.50</span>
                    </div>
                    <button
                      type="button"
                      className="mt-4 w-full rounded-xl bg-gradient-to-r from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] text-white text-xs font-bold py-2.5 hover:opacity-90 transition-opacity"
                    >
                      Accept Order
                    </button>
                  </div>

                  {/* Order 2: Preparing */}
                  <div className="rounded-2xl border border-[oklch(0.55_0.25_270/40%)] bg-[oklch(0.15_0.022_280)] p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-[oklch(0.55_0.25_270)] bg-[oklch(0.55_0.25_270/15%)] px-2.5 py-0.5 rounded-full">
                        PREPARING
                      </span>
                      <span className="text-xs font-mono text-[oklch(0.70_0.03_280)]">
                        4 mins ago
                      </span>
                    </div>
                    <div className="text-lg font-bold text-white mb-1">
                      Order #1041 &bull; Table 07
                    </div>
                    <div className="text-xs text-[oklch(0.70_0.03_280)] mb-4">
                      Customer: Priya Verma
                    </div>
                    <div className="space-y-2 border-t border-[oklch(1_0_0/8%)] pt-3 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span>1x Cold Brew Tonic</span>
                        <span className="font-semibold text-white">₹220</span>
                      </div>
                      <div className="flex justify-between">
                        <span>1x Croissant</span>
                        <span className="font-semibold text-white">₹160</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[oklch(1_0_0/8%)] flex items-center justify-between">
                      <span className="text-xs text-[oklch(0.70_0.03_280)]">Total (incl. tax)</span>
                      <span className="text-base font-bold text-white">₹399.00</span>
                    </div>
                    <button
                      type="button"
                      className="mt-4 w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 transition-colors"
                    >
                      Mark as Ready
                    </button>
                  </div>

                  {/* Order 3: Ready */}
                  <div className="rounded-2xl border border-emerald-500/30 bg-[oklch(0.15_0.022_280)] p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full">
                        READY
                      </span>
                      <span className="text-xs font-mono text-[oklch(0.70_0.03_280)]">
                        8 mins ago
                      </span>
                    </div>
                    <div className="text-lg font-bold text-white mb-1">
                      Order #1040 &bull; Table 02
                    </div>
                    <div className="text-xs text-[oklch(0.70_0.03_280)] mb-4">
                      Customer: Aman K.
                    </div>
                    <div className="space-y-2 border-t border-[oklch(1_0_0/8%)] pt-3 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span>2x Iced Vanilla Latte</span>
                        <span className="font-semibold text-white">₹460</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[oklch(1_0_0/8%)] flex items-center justify-between">
                      <span className="text-xs text-[oklch(0.70_0.03_280)]">Total (incl. tax)</span>
                      <span className="text-base font-bold text-white">₹483.00</span>
                    </div>
                    <button
                      type="button"
                      className="mt-4 w-full rounded-xl border border-slate-700 bg-[oklch(0.20_0.025_280)] hover:bg-[oklch(0.24_0.03_280)] text-slate-200 text-xs font-bold py-2.5 transition-colors"
                    >
                      Complete Order
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Customer Mobile View Showcase */
              <div className="max-w-md mx-auto rounded-3xl border border-[oklch(1_0_0/15%)] bg-slate-900 p-6 shadow-2xl">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Coffee className="h-5 w-5 text-[oklch(0.62_0.27_305)]" />
                    <span className="font-bold text-white text-sm">Brew House Roastery</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[oklch(0.62_0.27_305/15%)] text-[oklch(0.62_0.27_305)]">
                    Table 04
                  </span>
                </div>

                {/* Category Pills */}
                <div className="flex gap-2 py-4 overflow-x-auto no-scrollbar">
                  <span className="rounded-full bg-[oklch(0.62_0.27_305)] text-white px-3 py-1 text-xs font-bold">
                    Specialty Coffee
                  </span>
                  <span className="rounded-full bg-slate-800 text-slate-300 px-3 py-1 text-xs font-medium">
                    Artisanal Teas
                  </span>
                  <span className="rounded-full bg-slate-800 text-slate-300 px-3 py-1 text-xs font-medium">
                    Fresh Pastries
                  </span>
                </div>

                {/* Product Card */}
                <div className="rounded-2xl border border-slate-800 bg-slate-800/60 p-4 flex gap-4 items-center">
                  <div className="h-16 w-16 rounded-xl bg-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                    <Coffee className="h-8 w-8 text-purple-300" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-white">Ethiopian Pourover</h4>
                    <p className="text-xs text-slate-400 line-clamp-1">Jasmine, peach & citrus notes</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-extrabold text-white">₹220</span>
                      <button
                        type="button"
                        className="rounded-lg bg-[oklch(0.62_0.27_305)] px-3 py-1 text-xs font-bold text-white"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Order Tracking Pill */}
                <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <div>
                      <div className="text-xs font-bold text-white">Order #1042: PREPARING</div>
                      <div className="text-[11px] text-emerald-300">Estimated ready in ~3 mins</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-emerald-400" />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Core Platform Features Grid */}
      <section id="features" className="relative z-10 py-24 border-t border-[oklch(1_0_0/8%)]">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[oklch(0.62_0.27_305)]">
              Core SaaS Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mt-2">
              Everything Your Café Needs. Nothing It Doesn&apos;t.
            </h2>
            <p className="text-[oklch(0.70_0.03_280)] text-sm sm:text-base mt-4">
              Built specifically for modern cafés, roasteries, and coffee lounges. No bloated restaurant POS baggage, no waiter hardware, just frictionless ordering.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="lux-glass rounded-2xl p-6 lux-glass-hover">
              <div className="h-11 w-11 rounded-xl bg-[oklch(0.62_0.27_305/15%)] border border-[oklch(0.62_0.27_305/30%)] flex items-center justify-center text-[oklch(0.62_0.27_305)] mb-4">
                <QrCode className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Dynamic Table QR Generation
              </h3>
              <p className="text-xs text-[oklch(0.70_0.03_280)] leading-relaxed">
                Generate high-resolution printable QR codes per table with secure, unguessable 12-char cryptographic tokens. Download instantly as SVG/PNG.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="lux-glass rounded-2xl p-6 lux-glass-hover">
              <div className="h-11 w-11 rounded-xl bg-[oklch(0.55_0.25_270/15%)] border border-[oklch(0.55_0.25_270/30%)] flex items-center justify-center text-[oklch(0.55_0.25_270)] mb-4">
                <Smartphone className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Mobile-First Digital Menu
              </h3>
              <p className="text-xs text-[oklch(0.70_0.03_280)] leading-relaxed">
                Lightning-fast mobile browsing with categorized pill navigation, high-res photos, sliding cart drawer, and live table binding.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="lux-glass rounded-2xl p-6 lux-glass-hover">
              <div className="h-11 w-11 rounded-xl bg-[oklch(0.82_0.14_85/15%)] border border-[oklch(0.82_0.14_85/30%)] flex items-center justify-center text-[oklch(0.82_0.14_85)] mb-4">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Real-Time Order Lifecycle
              </h3>
              <p className="text-xs text-[oklch(0.70_0.03_280)] leading-relaxed">
                Enforces a strict state machine: PLACED &rarr; ACCEPTED &rarr; PREPARING &rarr; READY &rarr; COMPLETED with immediate status updates.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="lux-glass rounded-2xl p-6 lux-glass-hover">
              <div className="h-11 w-11 rounded-xl bg-[oklch(0.62_0.27_305/15%)] border border-[oklch(0.62_0.27_305/30%)] flex items-center justify-center text-[oklch(0.62_0.27_305)] mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Server-Authoritative Pricing
              </h3>
              <p className="text-xs text-[oklch(0.70_0.03_280)] leading-relaxed">
                Client prices are never trusted. The backend verifies current database prices, item availability, and calculates taxes and subtotals authoritatively.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="lux-glass rounded-2xl p-6 lux-glass-hover">
              <div className="h-11 w-11 rounded-xl bg-[oklch(0.55_0.25_270/15%)] border border-[oklch(0.55_0.25_270/30%)] flex items-center justify-center text-[oklch(0.55_0.25_270)] mb-4">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Strict Multi-Tenant Scoping
              </h3>
              <p className="text-xs text-[oklch(0.70_0.03_280)] leading-relaxed">
                A single production backend serving hundreds of cafés. Every repository query, menu item, and order is strictly isolated by authenticated cafe_id.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="lux-glass rounded-2xl p-6 lux-glass-hover">
              <div className="h-11 w-11 rounded-xl bg-[oklch(0.82_0.14_85/15%)] border border-[oklch(0.82_0.14_85/30%)] flex items-center justify-center text-[oklch(0.82_0.14_85)] mb-4">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Cloudinary Asset Pipeline
              </h3>
              <p className="text-xs text-[oklch(0.70_0.03_280)] leading-relaxed">
                Server-mediated image uploads to tenant-scoped Cloudinary folders. Validates file types and sizes (≤5MB) with automated WebP compression.
              </p>
            </div>

            {/* Feature 7 */}
            <div className="lux-glass rounded-2xl p-6 lux-glass-hover">
              <div className="h-11 w-11 rounded-xl bg-[oklch(0.62_0.27_305/15%)] border border-[oklch(0.62_0.27_305/30%)] flex items-center justify-center text-[oklch(0.62_0.27_305)] mb-4">
                <Radio className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Ably Realtime WebSockets
              </h3>
              <p className="text-xs text-[oklch(0.70_0.03_280)] leading-relaxed">
                Scoped channel tokens deliver instant audio/visual order notifications to the manager dashboard and live status to the customer.
              </p>
            </div>

            {/* Feature 8 */}
            <div className="lux-glass rounded-2xl p-6 lux-glass-hover">
              <div className="h-11 w-11 rounded-xl bg-[oklch(0.55_0.25_270/15%)] border border-[oklch(0.55_0.25_270/30%)] flex items-center justify-center text-[oklch(0.55_0.25_270)] mb-4">
                <Sliders className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Real-Time Product Controls
              </h3>
              <p className="text-xs text-[oklch(0.70_0.03_280)] leading-relaxed">
                Instantly toggle item availability (86ing items on the fly), edit descriptions, adjust display orders, and update tax rates in seconds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works (7-Step Flow) */}
      <section id="how-it-works" className="relative z-10 py-24 border-t border-[oklch(1_0_0/8%)] bg-[oklch(0.14_0.02_280)]">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[oklch(0.62_0.27_305)]">
              Operational Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mt-2">
              From Table Scan to Served in 7 Steps
            </h2>
            <p className="text-[oklch(0.70_0.03_280)] text-sm sm:text-base mt-4">
              Here is how seamless the order experience is for both your guests and your café team.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="lux-glass rounded-2xl p-6 relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] text-white font-extrabold text-base mb-4 shadow-md shadow-[oklch(0.62_0.27_305/20%)]">
                01
              </div>
              <h3 className="text-base font-bold text-white mb-2">Café is Onboarded</h3>
              <p className="text-xs text-[oklch(0.70_0.03_280)] leading-relaxed">
                The café receives its branded subdomain (e.g. <code className="text-purple-300 font-mono">brewhouse</code>) and owner account credentials.
              </p>
            </div>

            {/* Step 2 */}
            <div className="lux-glass rounded-2xl p-6 relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] text-white font-extrabold text-base mb-4 shadow-md shadow-[oklch(0.62_0.27_305/20%)]">
                02
              </div>
              <h3 className="text-base font-bold text-white mb-2">Menu & Tables Setup</h3>
              <p className="text-xs text-[oklch(0.70_0.03_280)] leading-relaxed">
                Owner uploads categories, products, photos, prices, and creates dine-in table numbers in the private dashboard.
              </p>
            </div>

            {/* Step 3 */}
            <div className="lux-glass rounded-2xl p-6 relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] text-white font-extrabold text-base mb-4 shadow-md shadow-[oklch(0.62_0.27_305/20%)]">
                03
              </div>
              <h3 className="text-base font-bold text-white mb-2">QR Codes Printed</h3>
              <p className="text-xs text-[oklch(0.70_0.03_280)] leading-relaxed">
                High-resolution cryptographic QR codes are downloaded, printed, and placed on café tables or counter stands.
              </p>
            </div>

            {/* Step 4 */}
            <div className="lux-glass rounded-2xl p-6 relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] text-white font-extrabold text-base mb-4 shadow-md shadow-[oklch(0.62_0.27_305/20%)]">
                04
              </div>
              <h3 className="text-base font-bold text-white mb-2">Guest Scans QR</h3>
              <p className="text-xs text-[oklch(0.70_0.03_280)] leading-relaxed">
                Guest scans the table QR with phone camera. Menu opens instantly with their table number securely bound.
              </p>
            </div>

            {/* Step 5 */}
            <div className="lux-glass rounded-2xl p-6 relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] text-white font-extrabold text-base mb-4 shadow-md shadow-[oklch(0.62_0.27_305/20%)]">
                05
              </div>
              <h3 className="text-base font-bold text-white mb-2">Order is Placed</h3>
              <p className="text-xs text-[oklch(0.70_0.03_280)] leading-relaxed">
                Customer selects items and submits cart. Server calculates prices, subtotal, and tax authoritatively.
              </p>
            </div>

            {/* Step 6 */}
            <div className="lux-glass rounded-2xl p-6 relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] text-white font-extrabold text-base mb-4 shadow-md shadow-[oklch(0.62_0.27_305/20%)]">
                06
              </div>
              <h3 className="text-base font-bold text-white mb-2">Manager Receives Live</h3>
              <p className="text-xs text-[oklch(0.70_0.03_280)] leading-relaxed">
                Order lands on the Café Admin dashboard in sub-second time via Ably real-time event with audio alert.
              </p>
            </div>

            {/* Step 7 */}
            <div className="lux-glass rounded-2xl p-6 relative sm:col-span-2 lg:col-span-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[oklch(0.62_0.27_305)] to-[oklch(0.82_0.14_85)] text-white font-extrabold text-base mb-4 shadow-md shadow-[oklch(0.62_0.27_305/20%)]">
                07
              </div>
              <h3 className="text-base font-bold text-white mb-2">Real-Time Status Tracking</h3>
              <p className="text-xs text-[oklch(0.70_0.03_280)] leading-relaxed">
                As the barista advances the order to ACCEPTED &rarr; PREPARING &rarr; READY, the customer sees the progress live in their tracking modal without refreshing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Live Demo Section */}
      <section id="demo" className="relative z-10 py-24 border-t border-[oklch(1_0_0/8%)]">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[oklch(0.82_0.14_85)]">
              Interactive Test Drive
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mt-2">
              Experience the Real Platform Live
            </h2>
            <p className="text-[oklch(0.70_0.03_280)] text-sm sm:text-base mt-4">
              Test drive the actual customer ordering website and the café manager dashboard right now.
              Choose one of our active demo tenants below or enter any café slug.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Demo Café 1 */}
            <div className="lux-glass rounded-3xl p-8 flex flex-col justify-between lux-glass-hover">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="h-12 w-12 rounded-2xl bg-[oklch(0.62_0.27_305/15%)] border border-[oklch(0.62_0.27_305/30%)] flex items-center justify-center text-[oklch(0.62_0.27_305)]">
                      <Coffee className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        Brew House Roastery
                      </h3>
                      <p className="text-xs text-[oklch(0.70_0.03_280)]">
                        Subdomain: <code className="text-purple-300 font-mono">brewhouse</code>
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400">
                    Active Tenant
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-8">
                  Artisanal specialty coffee roastery featuring single-origin pourovers, cold brews, espresso drinks, and gourmet toasts. Table QR ordering active.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-[oklch(1_0_0/8%)]">
                <Link
                  href="/?cafe=brewhouse"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] hover:opacity-95 text-white font-bold text-xs py-3 transition-opacity shadow-md shadow-[oklch(0.62_0.27_305/20%)]"
                >
                  <span>Open Customer Menu</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/dashboard?cafe=brewhouse"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[oklch(0.20_0.025_280)] hover:bg-[oklch(0.24_0.03_280)] text-slate-200 font-semibold text-xs py-3 transition-colors border border-[oklch(1_0_0/10%)]"
                >
                  <span>Café Dashboard</span>
                </Link>
              </div>
            </div>

            {/* Demo Café 2 */}
            <div className="lux-glass rounded-3xl p-8 flex flex-col justify-between lux-glass-hover">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="h-12 w-12 rounded-2xl bg-[oklch(0.55_0.25_270/15%)] border border-[oklch(0.55_0.25_270/30%)] flex items-center justify-center text-[oklch(0.55_0.25_270)]">
                      <Coffee className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        Mocha Café &amp; Lounge
                      </h3>
                      <p className="text-xs text-[oklch(0.70_0.03_280)]">
                        Subdomain: <code className="text-purple-300 font-mono">mochacafe</code>
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400">
                    Active Tenant
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-8">
                  Cozy neighborhood café with artisanal teas, baked pastries, and quick table-side ordering. Fully configured with tax rates and table tokens.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-[oklch(1_0_0/8%)]">
                <Link
                  href="/?cafe=mochacafe"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] hover:opacity-95 text-white font-bold text-xs py-3 transition-opacity shadow-md shadow-[oklch(0.62_0.27_305/20%)]"
                >
                  <span>Open Customer Menu</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/dashboard?cafe=mochacafe"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[oklch(0.20_0.025_280)] hover:bg-[oklch(0.24_0.03_280)] text-slate-200 font-semibold text-xs py-3 transition-colors border border-[oklch(1_0_0/10%)]"
                >
                  <span>Café Dashboard</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Direct Custom Café Slug Launcher */}
          <div className="mt-10 max-w-lg mx-auto">
            <form
              onSubmit={handleLaunchCustomCafe}
              className="lux-glass rounded-2xl p-2.5 flex items-center gap-2 border border-[oklch(1_0_0/12%)] shadow-lg"
            >
              <input
                type="text"
                placeholder="Enter any café subdomain (e.g. urbanbeans)"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value)}
                className="flex-1 bg-transparent px-4 py-2 text-xs text-white placeholder-[oklch(0.70_0.03_280)] focus:outline-hidden"
              />
              <Button
                type="submit"
                size="sm"
                className="bg-gradient-to-r from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] text-white font-bold text-xs px-5 h-9 rounded-xl shadow-sm"
              >
                Launch
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Transparent Single-Plan Pricing Section */}
      <section id="pricing" className="relative z-10 py-24 border-t border-[oklch(1_0_0/8%)] bg-[oklch(0.14_0.02_280)]">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[oklch(0.82_0.14_85)]">
              Simple &amp; Transparent
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mt-2">
              One Plan. Everything Included.
            </h2>
            <p className="text-[oklch(0.70_0.03_280)] text-sm sm:text-base mt-4">
              No hidden tiers, no surprise fees, and no per-order commissions. Get the complete Café QR SaaS engine for one flat monthly price.
            </p>
          </div>

          {/* Master ₹999 Plan Card */}
          <div className="max-w-4xl mx-auto lux-glass rounded-3xl p-8 sm:p-12 border-2 border-[oklch(0.62_0.27_305/45%)] shadow-2xl shadow-[oklch(0.62_0.27_305/12%)] relative overflow-hidden">
            {/* Top Metallic Gold Badge */}
            <div className="absolute top-0 right-8 -translate-y-1/2 rounded-full border border-[oklch(0.82_0.14_85/40%)] bg-[oklch(0.82_0.14_85)] text-slate-950 px-4 py-1 text-[11px] font-extrabold uppercase tracking-wider shadow-md">
              ALL-INCLUSIVE PRO
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-8 border-b border-[oklch(1_0_0/10%)] gap-6">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    CAFÉ QR PRO
                  </h3>
                  <span className="rounded-full bg-[oklch(0.62_0.27_305/15%)] text-[oklch(0.62_0.27_305)] border border-[oklch(0.62_0.27_305/30%)] px-3 py-0.5 text-xs font-bold">
                    Full Feature Suite
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[oklch(0.70_0.03_280)] mt-2 max-w-xl">
                  Ideal for boutique coffee shops, roasteries, and multi-table café lounges seeking a fast, self-contained digital ordering experience.
                </p>
              </div>

              <div className="text-left lg:text-right shrink-0">
                <div className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                  ₹999
                  <span className="text-sm font-normal text-[oklch(0.70_0.03_280)] tracking-normal">
                    {" "}/ month
                  </span>
                </div>
                <div className="text-xs text-[oklch(0.82_0.14_85)] font-semibold mt-1">
                  Flat monthly pricing &bull; No per-transaction cut
                </div>
              </div>
            </div>

            {/* Checklist of REAL Implemented Features */}
            <div className="mt-8">
              <div className="text-xs font-bold uppercase tracking-wider text-[oklch(0.62_0.27_305)] mb-6">
                All Included Features &bull; Zero Feature Locks
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-8 text-xs text-slate-200">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.62_0.27_305)] shrink-0 mt-0.5" />
                  <span>Digital QR Table Ordering System</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.62_0.27_305)] shrink-0 mt-0.5" />
                  <span>Unlimited Menu Categories &amp; Products</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.62_0.27_305)] shrink-0 mt-0.5" />
                  <span>Product Availability &amp; Price Toggles</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.62_0.27_305)] shrink-0 mt-0.5" />
                  <span>Cloudinary Media Asset Optimization</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.62_0.27_305)] shrink-0 mt-0.5" />
                  <span>Cryptographic 12-Character Table Tokens</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.62_0.27_305)] shrink-0 mt-0.5" />
                  <span>High-Resolution Printable QR Codes</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.62_0.27_305)] shrink-0 mt-0.5" />
                  <span>Live Manager Order Command Dashboard</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.62_0.27_305)] shrink-0 mt-0.5" />
                  <span>Complete Order State Machine Lifecycle</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.62_0.27_305)] shrink-0 mt-0.5" />
                  <span>Live Customer Order Tracking Modal</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.62_0.27_305)] shrink-0 mt-0.5" />
                  <span>Ably Real-Time WebSocket Notifications</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.62_0.27_305)] shrink-0 mt-0.5" />
                  <span>Server-Authoritative Price &amp; Tax Calculation</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.62_0.27_305)] shrink-0 mt-0.5" />
                  <span>Order Idempotency Key Deduplication</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.62_0.27_305)] shrink-0 mt-0.5" />
                  <span>Strict Multi-Tenant Database Isolation</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.62_0.27_305)] shrink-0 mt-0.5" />
                  <span>Branded Café Subdomain &amp; Settings</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.62_0.27_305)] shrink-0 mt-0.5" />
                  <span>Responsive Mobile, Tablet &amp; Desktop UI</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.62_0.27_305)] shrink-0 mt-0.5" />
                  <span>Zero Customer App Downloads Required</span>
                </div>
              </div>
            </div>

            {/* Bottom Action Area */}
            <div className="mt-10 pt-8 border-t border-[oklch(1_0_0/10%)] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-[oklch(0.70_0.03_280)] text-center sm:text-left">
                Direct onboarding via Platform Admin. Ready to activate your café in minutes.
              </div>
              <Link href="/admin" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] hover:opacity-95 text-white font-bold text-xs px-8 h-11 rounded-xl shadow-lg shadow-[oklch(0.62_0.27_305/25%)]"
                >
                  <span>Get Started with Café QR</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive FAQ Section */}
      <section id="faq" className="relative z-10 py-24 border-t border-[oklch(1_0_0/8%)]">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[oklch(0.62_0.27_305)]">
              Frequently Asked Questions
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
              Everything You Need to Know
            </h2>
            <p className="text-[oklch(0.70_0.03_280)] text-sm mt-3">
              Honest and factual details about our multi-tenant café QR ordering architecture.
            </p>
          </div>

          <div className="space-y-4">
            {FAQ_ITEMS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="lux-glass rounded-2xl border border-[oklch(1_0_0/10%)] overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[oklch(0.62_0.27_305)]"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-bold text-white tracking-tight">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-[oklch(0.70_0.03_280)] shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-[oklch(0.62_0.27_305)]" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 pt-1 text-xs text-[oklch(0.70_0.03_280)] leading-relaxed border-t border-[oklch(1_0_0/6%)]">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="relative z-10 py-20 border-t border-[oklch(1_0_0/8%)] bg-gradient-to-b from-[oklch(0.14_0.02_280)] to-[oklch(0.11_0.02_280)]">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] text-white flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[oklch(0.62_0.27_305/30%)]">
            <Coffee className="h-7 w-7" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Ready to Upgrade Your Café&apos;s Ordering?
          </h2>
          <p className="text-sm sm:text-base text-[oklch(0.70_0.03_280)] max-w-2xl mx-auto mt-4 leading-relaxed">
            Eliminate ordering bottlenecks, speed up table turns, and give your guests a fluid, app-free digital ordering experience.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#demo" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] hover:opacity-95 text-white font-bold text-xs px-8 h-12 rounded-xl shadow-xl shadow-[oklch(0.62_0.27_305/25%)]"
              >
                <span>Launch Interactive Demo</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </a>
            <Link href="/admin" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-[oklch(1_0_0/15%)] bg-[oklch(0.18_0.025_280)] hover:bg-[oklch(0.22_0.03_280)] text-white font-semibold text-xs px-8 h-12 rounded-xl"
              >
                <span>Platform Admin Portal</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Luxury Footer */}
      <footer className="relative z-10 border-t border-[oklch(1_0_0/8%)] py-12 bg-[oklch(0.11_0.02_280)] text-xs text-[oklch(0.70_0.03_280)]">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-[oklch(1_0_0/8%)]">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] text-white flex items-center justify-center">
                <Coffee className="h-4 w-4" />
              </div>
              <div>
                <span className="font-bold text-white text-sm">Café QR SaaS</span>
                <span className="text-[oklch(0.70_0.03_280)] ml-2">&mdash; Single Platform, Infinite Cafés</span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <a href="#features" className="hover:text-white transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="hover:text-white transition-colors">
                How It Works
              </a>
              <a href="#demo" className="hover:text-white transition-colors">
                Live Demo
              </a>
              <a href="#pricing" className="hover:text-white transition-colors">
                Pricing (₹999)
              </a>
              <Link href="/login" className="hover:text-white transition-colors">
                Café Login
              </Link>
              <Link href="/admin" className="text-purple-300 hover:text-purple-200 transition-colors font-semibold">
                Platform Admin
              </Link>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[oklch(0.70_0.03_280)]">
            <div>
              &copy; {new Date().getFullYear()} Café QR SaaS Platform. Multi-Tenant Architecture. Built with Next.js 16 &amp; FastAPI.
            </div>
            <div className="flex items-center gap-4">
              <span>Next.js 16</span>
              <span>&bull;</span>
              <span>FastAPI</span>
              <span>&bull;</span>
              <span>MongoDB Atlas</span>
              <span>&bull;</span>
              <span>Cloudinary</span>
              <span>&bull;</span>
              <span>Ably Realtime</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
