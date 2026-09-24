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
    question: "Do customers need an app?",
    answer:
      "No. Customers can scan the QR code and order directly from their phone browser (Safari or Chrome). No app download is ever required.",
  },
  {
    question: "How does table ordering work?",
    answer:
      "Every table gets its own secure QR code. When a customer scans the code, their table number is automatically attached to their order.",
  },
  {
    question: "Can I manage my menu?",
    answer:
      "Yes. You can add, edit, or remove menu categories and products at any time from your cafe dashboard.",
  },
  {
    question: "Can customers track their orders?",
    answer:
      "Yes. Customers can see the live status of their order from the moment it is placed until it is ready.",
  },
  {
    question: "Can multiple cafes use the platform?",
    answer:
      "Yes. Each cafe gets its own account and unique website address. Your menu, orders, tables, and settings are completely private.",
  },
  {
    question: "How are customer payments handled?",
    answer:
      "Customers place orders on their phone and pay you directly at the counter or table with cash or UPI. There are no payment gateway fees.",
  },
  {
    question: "Do I need special hardware?",
    answer:
      "No. You do not need expensive restaurant computers. You can view and manage orders on any phone, tablet, or laptop.",
  },
  {
    question: "How much does it cost?",
    answer:
      "₹999 per month. All features are included with no hidden fees or commissions.",
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
      <header className="sticky top-0 z-50 w-full border-b border-[oklch(1_0_0/8%)] bg-[oklch(0.13_0.02_280/85%)] backdrop-blur-xl transition-all">
        <div className="w-full max-w-7xl mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-12">
          {/* Brand Logo & Multi-Tenant Pill */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] text-white shadow-lg shadow-[oklch(0.62_0.27_305/30%)] transition-transform group-hover:scale-105">
              <Coffee className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white group-hover:text-purple-200 transition-colors">
                  Cafe QR SaaS
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-[oklch(0.82_0.14_85/35%)] bg-[oklch(0.82_0.14_85/10%)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[oklch(0.82_0.14_85)]">
                  Multi-Cafe
                </span>
              </div>
              <span className="text-[11px] font-medium text-[oklch(0.70_0.03_280)] tracking-wide">
                Simple QR Ordering
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
                Cafe Login
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
                  Cafe Owner Login
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
            <span>Modern QR Ordering for Cafes and Roasteries</span>
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
            Customers scan a QR code, view your menu, add items and place orders from their phone. No app needed.
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
            <a href="#how-it-works" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-[oklch(1_0_0/15%)] bg-[oklch(0.18_0.025_280)] hover:bg-[oklch(0.22_0.03_280)] text-white font-semibold px-7 h-12 rounded-xl text-sm transition-all"
              >
                <span>See How It Works</span>
              </Button>
            </a>
          </div>

          {/* Architecture Trust Highlights */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto text-left">
            <div className="lux-glass rounded-2xl p-5 lux-glass-hover">
              <div className="text-[oklch(0.62_0.27_305)] text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5" />
                <span>No App Needed</span>
              </div>
              <div className="text-white font-semibold text-sm">
                Instant Mobile Ordering
              </div>
              <div className="text-[oklch(0.70_0.03_280)] text-xs mt-1.5 leading-relaxed">
                Opens directly in phone browser when scanning the QR code.
              </div>
            </div>

            <div className="lux-glass rounded-2xl p-5 lux-glass-hover">
              <div className="text-[oklch(0.55_0.25_270)] text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5" />
                <span>Real-Time Orders</span>
              </div>
              <div className="text-white font-semibold text-sm">
                Instant Live Updates
              </div>
              <div className="text-[oklch(0.70_0.03_280)] text-xs mt-1.5 leading-relaxed">
                New orders appear in your dashboard instantly with a chime.
              </div>
            </div>

            <div className="lux-glass rounded-2xl p-5 lux-glass-hover">
              <div className="text-[oklch(0.82_0.14_85)] text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Secure QR Codes</span>
              </div>
              <div className="text-white font-semibold text-sm">
                Safe Table Routing
              </div>
              <div className="text-[oklch(0.70_0.03_280)] text-xs mt-1.5 leading-relaxed">
                Every table has a unique, secure code that binds the order.
              </div>
            </div>

            <div className="lux-glass rounded-2xl p-5 lux-glass-hover">
              <div className="text-[oklch(0.62_0.27_305)] text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                <span>Multi-Cafe Platform</span>
              </div>
              <div className="text-white font-semibold text-sm">
                Isolated Cafe Accounts
              </div>
              <div className="text-[oklch(0.70_0.03_280)] text-xs mt-1.5 leading-relaxed">
                Each cafe has its own private menu, tables, and orders.
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
                0
              </div>
              <div className="text-xs font-medium text-[oklch(0.70_0.03_280)] mt-1">
                Apps to Download
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[oklch(0.62_0.27_305)] tracking-tight">
                Live
              </div>
              <div className="text-xs font-medium text-[oklch(0.70_0.03_280)] mt-1">
                Instant Order Updates
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[oklch(0.82_0.14_85)] tracking-tight">
                100%
              </div>
              <div className="text-xs font-medium text-[oklch(0.70_0.03_280)] mt-1">
                Verified Prices in Database
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[oklch(0.55_0.25_270)] tracking-tight">
                Private
              </div>
              <div className="text-xs font-medium text-[oklch(0.70_0.03_280)] mt-1">
                Isolated Cafe Data
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
              Product Preview
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mt-2">
              See How Simple It Works
            </h2>
            <p className="text-[oklch(0.70_0.03_280)] text-sm sm:text-base mt-4">
              Switch between the live cafe dashboard and the mobile customer menu below.
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
                Cafe Orders Dashboard
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
                Customer Phone Menu
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
                      brewhouse.cafe-qr.app/orders — Live Orders
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      Real-Time Active
                    </span>
                  </div>
                </div>

                {/* Live Order Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  {/* Order 1: Placed */}
                  <div className="rounded-2xl border border-[oklch(0.82_0.14_85/30%)] bg-[oklch(0.15_0.022_280)] p-5 relative">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-[oklch(0.82_0.14_85)] bg-[oklch(0.82_0.14_85/15%)] px-2.5 py-0.5 rounded-full">
                        NEW ORDER
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
                      <span className="text-xs text-[oklch(0.70_0.03_280)]">Total</span>
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
                      <span className="text-xs text-[oklch(0.70_0.03_280)]">Total</span>
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
                        READY TO SERVE
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
                      <span className="text-xs text-[oklch(0.70_0.03_280)]">Total</span>
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
                    <span className="font-bold text-white text-sm">Brew House Cafe</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[oklch(0.62_0.27_305/15%)] text-[oklch(0.62_0.27_305)]">
                    Table 04
                  </span>
                </div>

                {/* Category Pills */}
                <div className="flex gap-2 py-4 overflow-x-auto no-scrollbar">
                  <span className="rounded-full bg-[oklch(0.62_0.27_305)] text-white px-3 py-1 text-xs font-bold">
                    Coffee
                  </span>
                  <span className="rounded-full bg-slate-800 text-slate-300 px-3 py-1 text-xs font-medium">
                    Teas
                  </span>
                  <span className="rounded-full bg-slate-800 text-slate-300 px-3 py-1 text-xs font-medium">
                    Pastries
                  </span>
                </div>

                {/* Product Card */}
                <div className="rounded-2xl border border-slate-800 bg-slate-800/60 p-4 flex gap-4 items-center">
                  <div className="h-16 w-16 rounded-xl bg-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                    <Coffee className="h-8 w-8 text-purple-300" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-white">Ethiopian Pourover</h4>
                    <p className="text-xs text-slate-400 line-clamp-1">Fresh brewed coffee</p>
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
                      <div className="text-[11px] text-emerald-300">Your order will be ready soon</div>
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
              Features
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mt-2">
              Everything You Need for Table Ordering
            </h2>
            <p className="text-[oklch(0.70_0.03_280)] text-sm sm:text-base mt-4">
              Built specifically for modern cafes. Simple to set up, fast for customers, and easy for your staff.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="lux-glass rounded-2xl p-6 lux-glass-hover">
              <div className="h-11 w-11 rounded-xl bg-[oklch(0.62_0.27_305/15%)] border border-[oklch(0.62_0.27_305/30%)] flex items-center justify-center text-[oklch(0.62_0.27_305)] mb-4">
                <QrCode className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Table QR Codes
              </h3>
              <p className="text-xs text-[oklch(0.70_0.03_280)] leading-relaxed">
                Create and download printable QR codes for all your tables. Each table has its own secure code.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="lux-glass rounded-2xl p-6 lux-glass-hover">
              <div className="h-11 w-11 rounded-xl bg-[oklch(0.55_0.25_270/15%)] border border-[oklch(0.55_0.25_270/30%)] flex items-center justify-center text-[oklch(0.55_0.25_270)] mb-4">
                <Smartphone className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Digital Phone Menu
              </h3>
              <p className="text-xs text-[oklch(0.70_0.03_280)] leading-relaxed">
                Customers browse categories, view product photos, add items to cart, and order from their phone browser.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="lux-glass rounded-2xl p-6 lux-glass-hover">
              <div className="h-11 w-11 rounded-xl bg-[oklch(0.82_0.14_85/15%)] border border-[oklch(0.82_0.14_85/30%)] flex items-center justify-center text-[oklch(0.82_0.14_85)] mb-4">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Live Order Dashboard
              </h3>
              <p className="text-xs text-[oklch(0.70_0.03_280)] leading-relaxed">
                See incoming orders in real time. Update order status: Placed &rarr; Preparing &rarr; Ready &rarr; Completed.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="lux-glass rounded-2xl p-6 lux-glass-hover">
              <div className="h-11 w-11 rounded-xl bg-[oklch(0.62_0.27_305/15%)] border border-[oklch(0.62_0.27_305/30%)] flex items-center justify-center text-[oklch(0.62_0.27_305)] mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Verified Prices
              </h3>
              <p className="text-xs text-[oklch(0.70_0.03_280)] leading-relaxed">
                All prices, taxes, and order totals are calculated directly on the server. Customers cannot modify prices.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="lux-glass rounded-2xl p-6 lux-glass-hover">
              <div className="h-11 w-11 rounded-xl bg-[oklch(0.55_0.25_270/15%)] border border-[oklch(0.55_0.25_270/30%)] flex items-center justify-center text-[oklch(0.55_0.25_270)] mb-4">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Multi-Cafe Platform
              </h3>
              <p className="text-xs text-[oklch(0.70_0.03_280)] leading-relaxed">
                Manage multiple cafes cleanly. Each cafe has completely private and protected data.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="lux-glass rounded-2xl p-6 lux-glass-hover">
              <div className="h-11 w-11 rounded-xl bg-[oklch(0.82_0.14_85/15%)] border border-[oklch(0.82_0.14_85/30%)] flex items-center justify-center text-[oklch(0.82_0.14_85)] mb-4">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Product Photos
              </h3>
              <p className="text-xs text-[oklch(0.70_0.03_280)] leading-relaxed">
                Upload photos of your food and drinks. Images load quickly on any phone network.
              </p>
            </div>

            {/* Feature 7 */}
            <div className="lux-glass rounded-2xl p-6 lux-glass-hover">
              <div className="h-11 w-11 rounded-xl bg-[oklch(0.62_0.27_305/15%)] border border-[oklch(0.62_0.27_305/30%)] flex items-center justify-center text-[oklch(0.62_0.27_305)] mb-4">
                <Radio className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Order Tracking
              </h3>
              <p className="text-xs text-[oklch(0.70_0.03_280)] leading-relaxed">
                Customers see live progress on their screen while waiting for their food and drinks.
              </p>
            </div>

            {/* Feature 8 */}
            <div className="lux-glass rounded-2xl p-6 lux-glass-hover">
              <div className="h-11 w-11 rounded-xl bg-[oklch(0.55_0.25_270/15%)] border border-[oklch(0.55_0.25_270/30%)] flex items-center justify-center text-[oklch(0.55_0.25_270)] mb-4">
                <Sliders className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Instant Availability
              </h3>
              <p className="text-xs text-[oklch(0.70_0.03_280)] leading-relaxed">
                Mark items as sold out or update prices with one click. Changes appear on customer menus immediately.
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
              How It Works
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mt-2">
              Simple 7-Step Flow
            </h2>
            <p className="text-[oklch(0.70_0.03_280)] text-sm sm:text-base mt-4">
              Here is how simple the ordering process is from start to finish.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="lux-glass rounded-2xl p-6 relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] text-white font-extrabold text-base mb-4 shadow-md shadow-[oklch(0.62_0.27_305/20%)]">
                01
              </div>
              <h3 className="text-base font-bold text-white mb-2">Create your cafe</h3>
              <p className="text-xs text-[oklch(0.70_0.03_280)] leading-relaxed">
                Your cafe account is created with your own web link and owner login.
              </p>
            </div>

            {/* Step 2 */}
            <div className="lux-glass rounded-2xl p-6 relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] text-white font-extrabold text-base mb-4 shadow-md shadow-[oklch(0.62_0.27_305/20%)]">
                02
              </div>
              <h3 className="text-base font-bold text-white mb-2">Add your menu</h3>
              <p className="text-xs text-[oklch(0.70_0.03_280)] leading-relaxed">
                Add food and drink categories, items, prices, and upload photos.
              </p>
            </div>

            {/* Step 3 */}
            <div className="lux-glass rounded-2xl p-6 relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] text-white font-extrabold text-base mb-4 shadow-md shadow-[oklch(0.62_0.27_305/20%)]">
                03
              </div>
              <h3 className="text-base font-bold text-white mb-2">Create tables and QR codes</h3>
              <p className="text-xs text-[oklch(0.70_0.03_280)] leading-relaxed">
                Print QR codes from your dashboard and place them on your tables.
              </p>
            </div>

            {/* Step 4 */}
            <div className="lux-glass rounded-2xl p-6 relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] text-white font-extrabold text-base mb-4 shadow-md shadow-[oklch(0.62_0.27_305/20%)]">
                04
              </div>
              <h3 className="text-base font-bold text-white mb-2">Customer scans QR</h3>
              <p className="text-xs text-[oklch(0.70_0.03_280)] leading-relaxed">
                Customer scans the code with their phone. Your menu opens instantly.
              </p>
            </div>

            {/* Step 5 */}
            <div className="lux-glass rounded-2xl p-6 relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] text-white font-extrabold text-base mb-4 shadow-md shadow-[oklch(0.62_0.27_305/20%)]">
                05
              </div>
              <h3 className="text-base font-bold text-white mb-2">Customer places order</h3>
              <p className="text-xs text-[oklch(0.70_0.03_280)] leading-relaxed">
                Customer selects items and sends the order directly from their phone.
              </p>
            </div>

            {/* Step 6 */}
            <div className="lux-glass rounded-2xl p-6 relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] text-white font-extrabold text-base mb-4 shadow-md shadow-[oklch(0.62_0.27_305/20%)]">
                06
              </div>
              <h3 className="text-base font-bold text-white mb-2">Cafe receives the order</h3>
              <p className="text-xs text-[oklch(0.70_0.03_280)] leading-relaxed">
                The order appears instantly on your cafe dashboard with an alert sound.
              </p>
            </div>

            {/* Step 7 */}
            <div className="lux-glass rounded-2xl p-6 relative sm:col-span-2 lg:col-span-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[oklch(0.62_0.27_305)] to-[oklch(0.82_0.14_85)] text-white font-extrabold text-base mb-4 shadow-md shadow-[oklch(0.62_0.27_305/20%)]">
                07
              </div>
              <h3 className="text-base font-bold text-white mb-2">Customer tracks the order</h3>
              <p className="text-xs text-[oklch(0.70_0.03_280)] leading-relaxed">
                When you accept and prepare the food, the customer sees the status change on their screen in real time.
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
              Live Demo
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mt-2">
              Test Drive the System
            </h2>
            <p className="text-[oklch(0.70_0.03_280)] text-sm sm:text-base mt-4">
              Try the real customer ordering experience and the cafe dashboard right now.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Demo Cafe 1 */}
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
                        Link: <code className="text-purple-300 font-mono">brewhouse</code>
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400">
                    Active Cafe
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-8">
                  Specialty coffee cafe featuring pourovers, cold brews, and baked snacks. Test customer ordering and table management.
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
                  <span>Cafe Dashboard</span>
                </Link>
              </div>
            </div>

            {/* Demo Cafe 2 */}
            <div className="lux-glass rounded-3xl p-8 flex flex-col justify-between lux-glass-hover">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="h-12 w-12 rounded-2xl bg-[oklch(0.55_0.25_270/15%)] border border-[oklch(0.55_0.25_270/30%)] flex items-center justify-center text-[oklch(0.55_0.25_270)]">
                      <Coffee className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        Mocha Cafe &amp; Lounge
                      </h3>
                      <p className="text-xs text-[oklch(0.70_0.03_280)]">
                        Link: <code className="text-purple-300 font-mono">mochacafe</code>
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400">
                    Active Cafe
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-8">
                  Neighborhood cafe with teas, coffees, and snacks. Configured with table QR codes and dine-in seating.
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
                  <span>Cafe Dashboard</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Direct Custom Cafe Slug Launcher */}
          <div className="mt-10 max-w-lg mx-auto">
            <form
              onSubmit={handleLaunchCustomCafe}
              className="lux-glass rounded-2xl p-2.5 flex items-center gap-2 border border-[oklch(1_0_0/12%)] shadow-lg"
            >
              <input
                type="text"
                placeholder="Enter any cafe name (e.g. urbanbeans)"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value)}
                className="flex-1 bg-transparent px-4 py-2 text-xs text-white placeholder-[oklch(0.70_0.03_280)] focus:outline-hidden"
              />
              <Button
                type="submit"
                size="sm"
                className="bg-gradient-to-r from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] text-white font-bold text-xs px-5 h-9 rounded-xl shadow-sm"
              >
                Open Cafe
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
              Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mt-2">
              One Simple Plan
            </h2>
            <p className="text-[oklch(0.70_0.03_280)] text-sm sm:text-base mt-4">
              Everything you need to run QR ordering for your cafe.
            </p>
          </div>

          {/* Master ₹999 Plan Card */}
          <div className="max-w-4xl mx-auto lux-glass rounded-3xl p-8 sm:p-12 border-2 border-[oklch(0.62_0.27_305/45%)] shadow-2xl shadow-[oklch(0.62_0.27_305/12%)] relative overflow-hidden">
            {/* Top Metallic Gold Badge */}
            <div className="absolute top-0 right-8 -translate-y-1/2 rounded-full border border-[oklch(0.82_0.14_85/40%)] bg-[oklch(0.82_0.14_85)] text-slate-950 px-4 py-1 text-[11px] font-extrabold uppercase tracking-wider shadow-md">
              ALL-IN-ONE
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-8 border-b border-[oklch(1_0_0/10%)] gap-6">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Cafe QR
                  </h3>
                  <span className="rounded-full bg-[oklch(0.62_0.27_305/15%)] text-[oklch(0.62_0.27_305)] border border-[oklch(0.62_0.27_305/30%)] px-3 py-0.5 text-xs font-bold">
                    Full Features
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[oklch(0.70_0.03_280)] mt-2 max-w-xl">
                  Everything you need to run QR ordering for your cafe.
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
                  Flat monthly price &bull; No per-order commission
                </div>
              </div>
            </div>

            {/* Checklist of REAL Implemented Features */}
            <div className="mt-8">
              <div className="text-xs font-bold uppercase tracking-wider text-[oklch(0.62_0.27_305)] mb-6">
                Included with Cafe QR
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-8 text-xs text-slate-200">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.62_0.27_305)] shrink-0 mt-0.5" />
                  <span>QR menu for all tables</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.62_0.27_305)] shrink-0 mt-0.5" />
                  <span>Menu management</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.62_0.27_305)] shrink-0 mt-0.5" />
                  <span>Product management</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.62_0.27_305)] shrink-0 mt-0.5" />
                  <span>Product images</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.62_0.27_305)] shrink-0 mt-0.5" />
                  <span>Table management</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.62_0.27_305)] shrink-0 mt-0.5" />
                  <span>QR code generation</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.62_0.27_305)] shrink-0 mt-0.5" />
                  <span>Real-time orders</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.62_0.27_305)] shrink-0 mt-0.5" />
                  <span>Order tracking for customers</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.62_0.27_305)] shrink-0 mt-0.5" />
                  <span>Cafe admin dashboard</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.62_0.27_305)] shrink-0 mt-0.5" />
                  <span>Secure login</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.62_0.27_305)] shrink-0 mt-0.5" />
                  <span>Order history</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.62_0.27_305)] shrink-0 mt-0.5" />
                  <span>Mobile ordering</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.62_0.27_305)] shrink-0 mt-0.5" />
                  <span>Multi-cafe platform</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.62_0.27_305)] shrink-0 mt-0.5" />
                  <span>Secure QR codes for each table</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.62_0.27_305)] shrink-0 mt-0.5" />
                  <span>Cloud image storage</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.62_0.27_305)] shrink-0 mt-0.5" />
                  <span>Tenant data protection</span>
                </div>
              </div>
            </div>

            {/* Bottom Action Area */}
            <div className="mt-10 pt-8 border-t border-[oklch(1_0_0/10%)] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-[oklch(0.70_0.03_280)] text-center sm:text-left">
                Start taking digital orders today.
              </div>
              <Link href="/admin" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] hover:opacity-95 text-white font-bold text-xs px-8 h-11 rounded-xl shadow-lg shadow-[oklch(0.62_0.27_305/25%)]"
                >
                  <span>Get Started</span>
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
              FAQ
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
              Common Questions
            </h2>
            <p className="text-[oklch(0.70_0.03_280)] text-sm mt-3">
              Simple answers about how the Cafe QR platform works.
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
            Ready to Start Table Ordering?
          </h2>
          <p className="text-sm sm:text-base text-[oklch(0.70_0.03_280)] max-w-2xl mx-auto mt-4 leading-relaxed">
            Give your customers an instant, app-free digital ordering experience.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#demo" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] hover:opacity-95 text-white font-bold text-xs px-8 h-12 rounded-xl shadow-xl shadow-[oklch(0.62_0.27_305/25%)]"
              >
                <span>Try Live Demo</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </a>
            <Link href="/admin" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-[oklch(1_0_0/15%)] bg-[oklch(0.18_0.025_280)] hover:bg-[oklch(0.22_0.03_280)] text-white font-semibold text-xs px-8 h-12 rounded-xl"
              >
                <span>Platform Admin</span>
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
                <span className="font-bold text-white text-sm">Cafe QR SaaS</span>
                <span className="text-[oklch(0.70_0.03_280)] ml-2">&mdash; Single Platform, Infinite Cafes</span>
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
                Pricing
              </a>
              <Link href="/login" className="hover:text-white transition-colors">
                Cafe Login
              </Link>
              <Link href="/admin" className="text-purple-300 hover:text-purple-200 transition-colors font-semibold">
                Platform Admin
              </Link>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[oklch(0.70_0.03_280)]">
            <div>
              &copy; {new Date().getFullYear()} Cafe QR SaaS Platform. Multi-Cafe Architecture. Built with Next.js 16 &amp; FastAPI.
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
