"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Coffee,
  ShoppingBag,
  Menu as MenuIcon,
  X,
  Sparkles,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { selectCartCount, useCafeStore } from "@/store/useCafeStore";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/shop", label: "3D Bean Shop" },
  { href: "/reserve", label: "Reserve a Table" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const cartCount = useCafeStore(selectCartCount);
  const setCartOpen = useCafeStore((s) => s.setCartOpen);
  const isLiteMode = useCafeStore((s) => s.isLiteMode);
  const toggleLiteMode = useCafeStore((s) => s.toggleLiteMode);

  return (
    <header className="sticky top-0 z-40 border-b border-cafe-border/80 bg-cafe-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cafe-accent/40 bg-cafe-surface text-cafe-accent transition group-hover:border-cafe-accent group-hover:bg-cafe-accent/10">
            <Coffee className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <span className="block font-serif text-lg font-semibold tracking-wide text-cafe-cream">
              Ember &amp; Bean
            </span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.26em] text-cafe-accent">
              Roastery &amp; Slow Bar
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-cafe-accent/15 text-cafe-accent"
                    : "text-cafe-muted hover:bg-cafe-surface hover:text-cafe-cream"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          {/* 3D / Fast Mode Toggle */}
          <button
            type="button"
            onClick={() => toggleLiteMode()}
            className="hidden items-center gap-1.5 rounded-full border border-cafe-border bg-cafe-surface px-3 py-1.5 text-xs font-medium text-cafe-muted transition hover:border-cafe-accent/60 hover:text-cafe-cream sm:inline-flex"
            title="Toggle 3D WebGL scenes vs Fast 2D Mode"
          >
            {isLiteMode ? (
              <>
                <Zap className="h-3.5 w-3.5 text-cafe-accent" />
                <span>Lite 2D</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-cafe-accent" />
                <span>3D Active</span>
              </>
            )}
          </button>

          {/* Owner Admin Link */}
          <Link
            href="/admin"
            className="hidden items-center gap-1 rounded-full border border-cafe-border/80 px-3 py-1.5 text-xs font-medium text-cafe-muted transition hover:border-cafe-accent/50 hover:text-cafe-cream lg:inline-flex"
            title="Cafe Owner Admin Dashboard"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-cafe-accent" />
            <span>Admin</span>
          </Link>

          {/* Cart Button */}
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative inline-flex items-center gap-2 rounded-full bg-cafe-accent px-4 py-2 text-sm font-semibold text-cafe-bg transition hover:bg-cafe-accent-hover"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Order</span>
            {cartCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-cafe-bg px-1.5 font-mono text-[11px] font-bold text-cafe-accent">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile Hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cafe-border bg-cafe-surface text-cafe-cream md:hidden"
            aria-label="Toggle Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="border-t border-cafe-border bg-cafe-surface px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-cafe-cream hover:bg-cafe-surface-2"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-cafe-muted hover:bg-cafe-surface-2 hover:text-cafe-cream"
            >
              Owner Admin Dashboard
            </Link>
            <button
              type="button"
              onClick={() => toggleLiteMode()}
              className="mt-2 flex items-center justify-between rounded-xl border border-cafe-border px-4 py-2.5 text-xs font-medium text-cafe-muted"
            >
              <span>Visual Mode</span>
              <span className="text-cafe-accent">
                {isLiteMode ? "Fast 2D Lite Mode" : "Interactive 3D Active"}
              </span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
