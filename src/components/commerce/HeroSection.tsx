"use client";

import Link from "next/link";
import { ArrowRight, Calendar, Coffee, ShoppingBag, Sparkles } from "lucide-react";
import SceneWrapper from "@/components/3d/SceneWrapper";
import { useCafeStore } from "@/store/useCafeStore";
import {
  formatPaiseToINR,
  type HeroDrinkId,
  type ProductWithVariants,
} from "@/types/database";

const HERO_DRINKS: Array<{
  id: HeroDrinkId;
  label: string;
  tagline: string;
  productSlug: string;
  fallbackPricePaise: number;
  fallbackImg: string;
}> = [
  {
    id: "espresso",
    label: "Velvet Cortado",
    tagline: "Double Ristretto · Chikmagalur Estate",
    productSlug: "velvet-cortado",
    fallbackPricePaise: 24000,
    fallbackImg:
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "iced-latte",
    label: "Iced Salted Caramel",
    tagline: "Burnt Caramel · Double Espresso · Ice",
    productSlug: "iced-salted-caramel-latte",
    fallbackPricePaise: 29500,
    fallbackImg:
      "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "matcha",
    label: "Uji Iced Matcha",
    tagline: "First-Harvest Ceremonial · Oat Milk",
    productSlug: "ceremonial-iced-matcha",
    fallbackPricePaise: 34000,
    fallbackImg:
      "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=1000&q=80",
  },
];

export default function HeroSection({
  products,
}: {
  products: ProductWithVariants[];
}) {
  const activeHeroDrink = useCafeStore((s) => s.activeHeroDrink);
  const setActiveHeroDrink = useCafeStore((s) => s.setActiveHeroDrink);
  const addToCart = useCafeStore((s) => s.addToCart);

  const currentDrinkMeta =
    HERO_DRINKS.find((d) => d.id === activeHeroDrink) ?? HERO_DRINKS[0];
  const matchedProduct = products.find(
    (p) => p.slug === currentDrinkMeta.productSlug
  );
  const defaultVariant = matchedProduct?.product_variants?.[0];

  const handleQuickAddHeroDrink = () => {
    if (!matchedProduct || !defaultVariant || !matchedProduct.in_stock) return;
    addToCart({
      productId: matchedProduct.id,
      variantId: defaultVariant.id,
      productName: matchedProduct.name,
      variantLabel: defaultVariant.label,
      imageUrl: matchedProduct.image_url,
      isVeg: matchedProduct.is_veg,
      pricePaise: defaultVariant.price_paise,
      qty: 1,
    });
  };

  return (
    <section className="relative overflow-hidden border-b border-cafe-border/80 pt-10 pb-16 lg:pt-16 lg:pb-24">
      {/* Subtle Ambient Pendant Glow */}
      <div className="cafe-glow pointer-events-none absolute inset-0" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-12">
        {/* Left Copy & Commercial CTAs */}
        <div className="lg:col-span-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-cafe-accent/35 bg-cafe-surface/90 px-4 py-1.5 text-xs font-medium text-cafe-accent">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Indiranagar Roastery · Fresh Tuesday Batches</span>
          </div>

          <h1 className="mt-6 font-serif text-5xl font-semibold leading-[1.06] text-cafe-cream sm:text-6xl lg:text-[4.25rem]">
            Small-Batch Roast,{" "}
            <span className="text-cafe-accent">Poured Slow</span> in Warm Brass.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-cafe-muted">
            Step inside Ember &amp; Bean — walnut booths, terracotta arches, and
            single-origin Indian Arabica crafted to order. Preview our signature
            pours in interactive 3D, customize your cup, or book your favorite
            table.
          </p>

          {/* Primary CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 rounded-full bg-cafe-accent px-7 py-3.5 text-sm font-semibold text-cafe-bg transition hover:bg-cafe-accent-hover"
            >
              <span>Order Now</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/reserve"
              className="inline-flex items-center gap-2 rounded-full border border-cafe-border bg-cafe-surface px-6 py-3.5 text-sm font-semibold text-cafe-cream transition hover:border-cafe-accent/70 hover:text-cafe-accent"
            >
              <Calendar className="h-4 w-4 text-cafe-accent" />
              <span>Reserve a Table</span>
            </Link>
          </div>

          {/* Interactive 3D Drink Switcher */}
          <div className="mt-10 rounded-2xl border border-cafe-border bg-cafe-surface/75 p-4">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-cafe-muted">
              <span className="inline-flex items-center gap-1.5">
                <Coffee className="h-3.5 w-3.5 text-cafe-accent" />
                <span>Switch 3D Signature Cup</span>
              </span>
              <span className="font-mono text-cafe-accent">
                {formatPaiseToINR(
                  defaultVariant?.price_paise ?? currentDrinkMeta.fallbackPricePaise
                )}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {HERO_DRINKS.map((drink) => {
                const active = activeHeroDrink === drink.id;
                return (
                  <button
                    key={drink.id}
                    type="button"
                    onClick={() => setActiveHeroDrink(drink.id)}
                    className={`rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition ${
                      active
                        ? "border-cafe-accent bg-cafe-accent/15 text-cafe-cream"
                        : "border-cafe-border bg-cafe-bg/70 text-cafe-muted hover:text-cafe-cream"
                    }`}
                  >
                    {drink.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
              <span className="text-cafe-muted">{currentDrinkMeta.tagline}</span>
              {matchedProduct && defaultVariant && (
                <button
                  type="button"
                  onClick={handleQuickAddHeroDrink}
                  className="inline-flex items-center gap-1.5 font-semibold text-cafe-accent hover:underline"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Quick-Add to Cart</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Interactive 3D Hero Cup Canvas */}
        <div className="lg:col-span-6">
          <div className="relative rounded-[2rem] border border-cafe-border/90 bg-cafe-surface/50 p-3 shadow-2xl shadow-black/50">
            <div className="pointer-events-none absolute left-6 top-6 z-10 rounded-full border border-cafe-border bg-cafe-bg/80 px-3.5 py-1 text-[11px] font-medium text-cafe-muted backdrop-blur">
              Move cursor to tilt · Live PBR Lighting
            </div>

            <SceneWrapper
              scene="hero-cup"
              fallbackImg={currentDrinkMeta.fallbackImg}
              alt={currentDrinkMeta.label}
              className="h-[420px] w-full sm:h-[510px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
