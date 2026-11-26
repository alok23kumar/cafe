import type { Metadata } from "next";
import { getCatalogData } from "@/lib/catalog";
import MenuGrid from "@/components/commerce/MenuGrid";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cafe Menu",
  description:
    "Explore Ember & Bean Roastery's full espresso, pour-over, iced matcha, and sourdough bakery menu with Veg/Non-Veg and dietary filters.",
};

export default async function MenuPage() {
  const { categories, products } = await getCatalogData();

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
      <div className="mb-10 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-cafe-accent">
          Ember &amp; Bean Kitchen &amp; Slow Bar
        </p>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-cafe-cream sm:text-5xl">
          Cafe Menu
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-cafe-muted">
          Filter by Vegetarian / Non-Vegetarian, Hot or Iced craft, and customize
          milk or sweetness on every pour. Live stock status syncs in real time
          from our barista counter.
        </p>
      </div>

      <MenuGrid categories={categories} initialProducts={products} />
    </div>
  );
}
