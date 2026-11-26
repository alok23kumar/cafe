import Link from "next/link";
import { ArrowRight, Calendar, Sparkles } from "lucide-react";
import { getCatalogData } from "@/lib/catalog";
import HeroSection from "@/components/commerce/HeroSection";
import ScrollBrewSection from "@/components/3d/ScrollBrewSection";
import Product3DCard from "@/components/commerce/Product3DCard";
import MenuGrid from "@/components/commerce/MenuGrid";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { categories, products } = await getCatalogData();

  const beanProducts = products.filter(
    (p) => p.model_3d_url === "/models/coffee-bag.glb"
  );
  const featuredBean = beanProducts[0] ?? products[0];

  const menuHighlights = products.filter(
    (p) => p.model_3d_url !== "/models/coffee-bag.glb"
  );

  return (
    <>
      {/* 1. Interactive 3D Hero Cup + Instant Drink Switcher */}
      <HeroSection products={products} />

      {/* 2. Scroll-Driven 3D Pour-Over Craft Story */}
      <ScrollBrewSection />

      {/* 3. Interactive 3D Single-Origin Coffee Bean Shop */}
      {featuredBean && (
        <section className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.26em] text-cafe-accent">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Interactive 3D Roastery Shop</span>
              </p>
              <h2 className="mt-2 font-serif text-4xl font-semibold text-cafe-cream md:text-5xl">
                Inspect &amp; Order Freshly Roasted Beans
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-cafe-muted">
                Click any roast profile below to swap the 3D coffee bag label
                and accent live via Zustand, spin 360° without trapping page
                scroll, and choose your custom grind.
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-sm font-semibold text-cafe-accent hover:underline"
            >
              <span>View All Roast Bags</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <Product3DCard product={featuredBean} />
        </section>
      )}

      {/* 4. Cafe Menu Highlights */}
      <section className="border-t border-cafe-border bg-cafe-surface/30 py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-cafe-accent">
                Fresh From the Slow Bar &amp; Hearth
              </p>
              <h2 className="mt-2 font-serif text-4xl font-semibold text-cafe-cream md:text-5xl">
                Today&apos;s Cafe Highlights
              </h2>
            </div>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 rounded-full border border-cafe-border bg-cafe-surface px-5 py-2.5 text-xs font-semibold text-cafe-cream transition hover:border-cafe-accent hover:text-cafe-accent"
            >
              <span>Browse Full Menu &amp; Dietary Filters</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <MenuGrid
            categories={categories}
            initialProducts={menuHighlights}
            maxItems={6}
            showFilters={false}
          />
        </div>
      </section>

      {/* 5. Cozy Table Reservation CTA */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="cafe-glow relative overflow-hidden rounded-3xl border border-cafe-accent/30 bg-cafe-surface p-8 sm:p-12 lg:p-16">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-cafe-accent">
              Walnut Booths · Terracotta Patio · Slow Bar
            </p>
            <h2 className="mt-3 font-serif text-4xl font-semibold text-cafe-cream sm:text-5xl">
              Save Your Favorite Corner Before You Arrive
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-cafe-muted sm:text-base">
              Preview our three seating zones in 3D, pick a 90-minute slot, and
              get instant atomic table confirmation with zero wait time.
            </p>
            <div className="mt-8">
              <Link
                href="/reserve"
                className="inline-flex items-center gap-2 rounded-full bg-cafe-accent px-7 py-3.5 text-sm font-semibold text-cafe-bg transition hover:bg-cafe-accent-hover"
              >
                <Calendar className="h-4 w-4" />
                <span>Preview Zones &amp; Reserve a Table</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
