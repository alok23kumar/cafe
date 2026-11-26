"use client";

import { useState } from "react";
import { Check, Rotate3d, ShoppingBag, Sparkles } from "lucide-react";
import SceneWrapper from "@/components/3d/SceneWrapper";
import { DietaryBadge } from "@/components/ui/DietaryBadge";
import { useCafeStore } from "@/store/useCafeStore";
import {
  formatPaiseToINR,
  type ProductVariant,
  type ProductWithVariants,
} from "@/types/database";

const GRIND_OPTIONS = [
  "Whole Bean",
  "Espresso Fine",
  "Pour-Over V60",
  "French Press Coarse",
];

interface Product3DCardProps {
  product: ProductWithVariants;
  /** Syncs selection globally to Zustand `beanPreview` state */
  syncToGlobalStore?: boolean;
}

export default function Product3DCard({
  product,
  syncToGlobalStore = true,
}: Product3DCardProps) {
  const variants = product.product_variants ?? [];
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    variants[0] ?? null
  );
  const [grind, setGrind] = useState(GRIND_OPTIONS[0]);
  const [justAdded, setJustAdded] = useState(false);

  const setBeanPreview = useCafeStore((s) => s.setBeanPreview);
  const addToCart = useCafeStore((s) => s.addToCart);

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    if (syncToGlobalStore) {
      setBeanPreview({
        productId: product.id,
        variantId: variant.id,
        variantLabel: variant.label,
        textureUrl: variant.texture_override_url ?? "/textures/roast-house.webp",
        accentColorHex: variant.color_hex ?? "#d98a4e",
      });
    }
  };

  const handleAdd = () => {
    if (!selectedVariant || !product.in_stock) return;
    addToCart({
      productId: product.id,
      variantId: selectedVariant.id,
      productName: product.name,
      variantLabel: selectedVariant.label,
      imageUrl: product.image_url,
      isVeg: product.is_veg,
      pricePaise: selectedVariant.price_paise,
      qty: 1,
      customizations: { Grind: grind },
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1600);
  };

  const activeColor = selectedVariant?.color_hex ?? "#d98a4e";
  const activeLabel = selectedVariant?.label ?? product.name;

  return (
    <div
      className={`grid grid-cols-1 gap-6 rounded-3xl border border-cafe-border bg-cafe-surface/80 p-5 transition lg:grid-cols-12 lg:p-7 ${
        !product.in_stock ? "opacity-60" : ""
      }`}
    >
      {/* Interactive 360° 3D Bean Bag Stage */}
      <div className="relative lg:col-span-6">
        <div className="cafe-glow relative rounded-2xl border border-cafe-border/80 bg-cafe-bg/90 p-2">
          <div className="pointer-events-none absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-cafe-accent/30 bg-cafe-bg/80 px-3 py-1 text-[11px] font-medium text-cafe-accent backdrop-blur">
            <Rotate3d className="h-3.5 w-3.5" />
            <span>Drag to Spin 360°</span>
          </div>

          <SceneWrapper
            scene="bean-bag"
            variantLabel={activeLabel}
            accentColorHex={activeColor}
            textureUrl={selectedVariant?.texture_override_url}
            fallbackImg={product.image_url}
            alt={product.name}
            className="h-[340px] w-full sm:h-[400px]"
          />
        </div>
      </div>

      {/* Live 2D Commerce Controls */}
      <div className="flex flex-col justify-between lg:col-span-6">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-cafe-accent">
              <Sparkles className="h-3.5 w-3.5" />
              Interactive 3D Roast
            </span>
            <DietaryBadge isVeg={product.is_veg} showLabel />
          </div>

          <h3 className="mt-3 font-serif text-3xl font-semibold text-cafe-cream">
            {product.name}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-cafe-muted">
            {product.description}
          </p>

          {product.tasting_notes.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {product.tasting_notes.map((note) => (
                <span
                  key={note}
                  className="rounded-full border border-cafe-border bg-cafe-bg px-3 py-1 text-xs text-cafe-muted"
                >
                  {note}
                </span>
              ))}
            </div>
          )}

          {/* Roast / Weight Variant Picker (Live Swaps 3D Bag Label & Accent!) */}
          <div className="mt-6">
            <label className="text-xs font-semibold uppercase tracking-wider text-cafe-muted">
              Select Roast Profile &amp; Pack Size (Updates 3D Bag Live)
            </label>
            <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {variants.map((variant) => {
                const isSelected = selectedVariant?.id === variant.id;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => handleVariantSelect(variant)}
                    className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-xs transition ${
                      isSelected
                        ? "border-cafe-accent bg-cafe-accent/15 text-cafe-cream"
                        : "border-cafe-border bg-cafe-bg/60 text-cafe-muted hover:border-cafe-accent/50 hover:text-cafe-cream"
                    }`}
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full border border-white/20"
                        style={{ backgroundColor: variant.color_hex ?? "#d98a4e" }}
                      />
                      <span>{variant.label}</span>
                    </span>
                    <span className="ml-2 shrink-0 font-mono font-semibold text-cafe-accent">
                      {formatPaiseToINR(variant.price_paise)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grind Type Selector */}
          <div className="mt-5">
            <label className="text-xs font-semibold uppercase tracking-wider text-cafe-muted">
              Grind Preparation
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {GRIND_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setGrind(option)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    grind === option
                      ? "border-cafe-accent bg-cafe-accent text-cafe-bg"
                      : "border-cafe-border bg-cafe-bg text-cafe-muted hover:border-cafe-accent/50"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Price + Add to Cart CTA */}
        <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-cafe-border pt-5">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-cafe-muted">
              Roasted This Week
            </p>
            <p className="font-mono text-2xl font-bold text-cafe-cream">
              {selectedVariant
                ? formatPaiseToINR(selectedVariant.price_paise)
                : "—"}
            </p>
          </div>

          <button
            type="button"
            disabled={!product.in_stock || !selectedVariant}
            onClick={handleAdd}
            className="inline-flex items-center gap-2 rounded-full bg-cafe-accent px-6 py-3 text-sm font-semibold text-cafe-bg transition hover:bg-cafe-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {justAdded ? (
              <>
                <Check className="h-4 w-4" />
                <span>Added to Order</span>
              </>
            ) : !product.in_stock ? (
              <span>Sold Out</span>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
