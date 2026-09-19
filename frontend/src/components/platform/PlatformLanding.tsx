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
} from "lucide-react";

import { Button } from "@/components/ui/Button";

export function PlatformLanding() {
  const router = useRouter();
  const [customSlug, setCustomSlug] = React.useState("");

  const handleLaunchCustomCafe = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSlug.trim()) {
      router.push(`/?cafe=${encodeURIComponent(customSlug.trim().toLowerCase())}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      {/* Platform Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20">
              <Coffee className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white">
                Café QR SaaS
              </span>
              <span className="hidden text-[10px] font-semibold tracking-wider text-amber-400 uppercase sm:inline-block sm:ml-2 border border-amber-500/30 px-1.5 py-0.5 rounded-full bg-amber-500/10">
                Multi-Tenant
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
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
          </nav>

          <div className="flex items-center gap-2.5">
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white hover:bg-slate-800 text-xs"
              >
                Café Login
              </Button>
            </Link>
            <Link href="/admin">
              <Button
                variant="primary"
                size="sm"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs shadow-md shadow-amber-500/20"
              >
                Platform Admin
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_35%_at_50%_20%,rgba(245,158,11,0.15),transparent)]" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300 backdrop-blur-xs mb-6">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>The Modern QR Ordering Engine for Cafés & Roasteries</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
            Turn Every Table Into an{" "}
            <span className="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
              Instant Ordering Experience
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
            A high-performance, web-first digital menu and ordering platform.
            Customers scan table QR codes, browse your menu, and place orders directly
            from their browser. No apps, no downloads, zero friction.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <a href="#demo">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold shadow-lg shadow-amber-500/25 px-7"
              >
                <span>Test Live Café Demo</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </a>
            <Link href="/admin">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-200 font-semibold px-6"
              >
                <span>Manage Cafés (Platform Admin)</span>
              </Button>
            </Link>
          </div>

          {/* Platform Architecture Highlights */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xs">
              <div className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                Zero App Downloads
              </div>
              <div className="text-white font-semibold text-sm">
                Instant Mobile Web
              </div>
              <div className="text-slate-400 text-xs mt-1">
                Works instantly on Safari and Chrome via QR scan.
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xs">
              <div className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                Multi-Tenant
              </div>
              <div className="text-white font-semibold text-sm">
                One Platform, Many Cafés
              </div>
              <div className="text-slate-400 text-xs mt-1">
                Strict data isolation per café subdomain.
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xs">
              <div className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                Server Integrity
              </div>
              <div className="text-white font-semibold text-sm">
                Authoritative Pricing
              </div>
              <div className="text-slate-400 text-xs mt-1">
                Backend validates prices, tax, and availability.
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xs">
              <div className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                Table QR Codes
              </div>
              <div className="text-white font-semibold text-sm">
                Cryptographic Tokens
              </div>
              <div className="text-slate-400 text-xs mt-1">
                Unguessable secure tokens protect table routing.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="py-16 bg-slate-950 border-t border-slate-800/80">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Interactive Test Drive
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-2">
              Experience the Café Customer Website
            </h2>
            <p className="text-slate-400 text-sm mt-3">
              In production, each café gets their own branded subdomain (e.g.{" "}
              <code className="text-amber-300 font-mono">brewhouse.yourdomain.com</code>).
              Select a demo café below or enter any café slug to preview the customer ordering experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Demo Cafe 1: Brew House */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 flex flex-col justify-between hover:border-amber-500/40 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Coffee className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                        Brew House Roastery
                      </h3>
                      <p className="text-xs text-slate-400">
                        Subdomain: <code className="text-amber-300">brewhouse</code>
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                    Active Tenant
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-6">
                  Artisanal roastery offering single-origin pourovers, espresso beverages, and pastries.
                  Table QR ordering and takeaway enabled.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-4 border-t border-slate-800">
                <Link
                  href="/?cafe=brewhouse"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2.5 transition-colors shadow-sm"
                >
                  <span>Open Customer Menu</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/dashboard?cafe=brewhouse"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs py-2.5 transition-colors border border-slate-700"
                >
                  <span>Café Dashboard</span>
                </Link>
              </div>
            </div>

            {/* Demo Cafe 2: Mocha Cafe */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 flex flex-col justify-between hover:border-amber-500/40 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Coffee className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                        Mocha Café & Lounge
                      </h3>
                      <p className="text-xs text-slate-400">
                        Subdomain: <code className="text-amber-300">mochacafe</code>
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                    Active Tenant
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-6">
                  Cozy neighborhood cafe featuring teas, cold brews, artisanal snacks, and dine-in seating.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-4 border-t border-slate-800">
                <Link
                  href="/?cafe=mochacafe"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2.5 transition-colors shadow-sm"
                >
                  <span>Open Customer Menu</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/dashboard?cafe=mochacafe"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs py-2.5 transition-colors border border-slate-700"
                >
                  <span>Café Dashboard</span>
                </Link>
              </div>

            </div>
          </div>

          {/* Launch Custom Slug Form */}
          <div className="mt-8 max-w-md mx-auto">
            <form
              onSubmit={handleLaunchCustomCafe}
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 p-2"
            >
              <input
                type="text"
                placeholder="Enter café slug (e.g. urbanbeans)"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value)}
                className="flex-1 bg-transparent px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden"
              />
              <Button
                type="submit"
                size="sm"
                className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs border border-slate-700"
              >
                Go
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Core Platform Features */}
      <section id="features" className="py-20 border-t border-slate-800/80">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Built for Scale & Simplicity
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-2">
              Everything Your Café Needs, Nothing It Doesn&apos;t
            </h2>

            <p className="text-slate-400 text-sm mt-3">
              Designed strictly for cafés and roasteries without the bloated complexity of traditional restaurant POS/ERP systems.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
                <QrCode className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Dynamic QR Generation
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate high-resolution printable QR codes per table with secure, unguessable tokens. Download instantly or share.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
                <Smartphone className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Mobile-First Customer Experience
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                App-like speed on mobile browsers with category pills, responsive product cards, slide-up cart drawer, and live timeline tracking.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Real-Time Order Lifecycle
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Café managers easily advance orders from Placed → Accepted → Preparing → Ready → Completed with strict state machine validation.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Server-Side Price Validation
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Customer clients can never alter prices. The backend looks up live database rates, calculates subtotals, tax, and order totals.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Strict Multi-Tenancy
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                A single production codebase and database safely serving multiple cafés with guaranteed tenant isolation across all endpoints.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Custom Brand Styling
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dynamic theme tokens inject café primary colors, custom logos, and banners into the customer website automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-slate-950 border-t border-slate-800/80">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Simple 3-Step Setup
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-2">
              From Signup to First Order in Minutes
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-extrabold text-xl mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Onboard Your Café
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Get your branded café subdomain and owner account. Upload your menu categories and products.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-extrabold text-xl mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Place Table QR Codes
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate and print table QR tokens. Place them on tables or counters for contactless guest scanning.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-extrabold text-xl mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Manage Live Orders
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Orders appear on your private manager dashboard. Accept, prepare, and notify customers when ready.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Plan Overview */}
      <section id="pricing" className="py-20 border-t border-slate-800/80">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Transparent Pricing
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-2">
              Flexible Plans for Every Café
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Starter</h3>
                <p className="text-xs text-slate-400 mt-1">For boutique cafés & pop-ups</p>
                <div className="mt-4 text-3xl font-extrabold text-white">
                  ₹999<span className="text-xs font-normal text-slate-400"> / month</span>
                </div>
                <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-400" />
                    <span>Up to 15 Tables</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-400" />
                    <span>Branded Subdomain</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-400" />
                    <span>Real-Time Order Dashboard</span>
                  </li>
                </ul>
              </div>
              <Link href="/admin" className="mt-8">
                <Button variant="outline" className="w-full border-slate-700 text-xs">
                  Get Started
                </Button>
              </Link>
            </div>

            <div className="rounded-2xl border-2 border-amber-500 bg-slate-900 p-6 flex flex-col justify-between relative shadow-xl shadow-amber-500/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-950">
                Most Popular
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Roastery Pro</h3>
                <p className="text-xs text-slate-400 mt-1">For busy cafés and multi-table roasteries</p>
                <div className="mt-4 text-3xl font-extrabold text-white">
                  ₹2,499<span className="text-xs font-normal text-slate-400"> / month</span>
                </div>
                <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-400" />
                    <span>Unlimited Tables & QR Codes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-400" />
                    <span>Custom Brand Color & Logo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-400" />
                    <span>Tax & Takeaway Configuration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-400" />
                    <span>Daily Sales & Order Analytics</span>
                  </li>
                </ul>
              </div>
              <Link href="/admin" className="mt-8">
                <Button className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs">
                  Get Started
                </Button>
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Enterprise</h3>
                <p className="text-xs text-slate-400 mt-1">For multi-location café groups</p>
                <div className="mt-4 text-3xl font-extrabold text-white">
                  Custom
                </div>
                <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-400" />
                    <span>Dedicated Domain Integration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-400" />
                    <span>Custom Payment Gateway</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-400" />
                    <span>Priority 24/7 SLA Support</span>
                  </li>
                </ul>
              </div>
              <Link href="/admin" className="mt-8">
                <Button variant="outline" className="w-full border-slate-700 text-xs">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 bg-slate-950 text-xs text-slate-500">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Coffee className="h-4 w-4 text-amber-400" />
            <span className="font-semibold text-slate-300">Café QR Ordering SaaS</span>
            <span>— Single Platform, Infinite Cafés</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-slate-300">
              Café Login
            </Link>
            <Link href="/admin" className="hover:text-slate-300">
              Platform Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
