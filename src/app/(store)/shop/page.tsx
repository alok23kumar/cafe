import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { getCatalogData } from "@/lib/catalog";
import Product3DCard from "@/components/commerce/Product3DCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "3D Coffee Bean Shop",
  description:
    "Spin and inspect our single-origin Indian coffee bags in 3D, swap roast profiles live, and order whole bean or custom ground packs.",
};

export default async function ShopPage() {
  const { products } = await getCatalogData();
  const beanProducts = products.filter(
    (p) => p.model_3d_url === "/models/coffee-bag.glb"
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
      <div className="mb-10 max-w-2xl">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.26em] text-cafe-accent">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Interactive 3D Roastery Store</span>
        </p>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-cafe-cream sm:text-5xl">
          Single-Origin Coffee Beans
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-cafe-muted">
          Roasted every Tuesday in Indiranagar and sealed with one-way brass
          degassing valves. Click any roast variant to inspect its 3D packaging
          and select your brewing grind.
        </p>
      </div>

      <div className="space-y-8">
        {beanProducts.map((product) => (
          <Product3DCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
