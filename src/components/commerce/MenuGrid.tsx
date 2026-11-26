"use client";

import { useEffect, useMemo, useState } from "react";
import { Flame, Plus, Search, Snowflake, Sparkles } from "lucide-react";
import { DietaryBadge } from "@/components/ui/DietaryBadge";
import { useCafeStore } from "@/store/useCafeStore";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import {
  formatPaiseToINR,
  type Category,
  type ProductVariant,
  type ProductWithVariants,
} from "@/types/database";

const MILK_OPTIONS = ["Whole Milk", "Oat Milk", "Almond Milk", "Black / No Milk"];
const SUGAR_OPTIONS = ["Regular Sweet", "Less Sugar", "No Sugar", "Palm Jaggery"];

interface MenuGridProps {
  categories: Category[];
  initialProducts: ProductWithVariants[];
  /** Optional limit for Homepage Menu Highlights */
  maxItems?: number;
  showFilters?: boolean;
}

export default function MenuGrid({
  categories,
  initialProducts,
  maxItems,
  showFilters = true,
}: MenuGridProps) {
  const [products, setProducts] = useState<ProductWithVariants[]>(initialProducts);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [dietFilter, setDietFilter] = useState<"all" | "veg" | "nonveg">("all");
  const [tempFilter, setTempFilter] = useState<"all" | "hot" | "iced">("all");
  const [search, setSearch] = useState("");

  // Track per-product selected variant & customization notes
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(
    () => {
      const init: Record<string, string> = {};
      for (const p of initialProducts) {
        if (p.product_variants?.[0]) {
          init[p.id] = p.product_variants[0].id;
        }
      }
      return init;
    }
  );
  const [customOpenId, setCustomOpenId] = useState<string | null>(null);
  const [milkChoice, setMilkChoice] = useState(MILK_OPTIONS[0]);
  const [sugarChoice, setSugarChoice] = useState(SUGAR_OPTIONS[0]);

  const addToCart = useCafeStore((s) => s.addToCart);

  // Live Inventory Sync via Supabase Realtime (dims sold-out items instantly)
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let channel: ReturnType<ReturnType<typeof createSupabaseBrowserClient>["channel"]> | null =
      null;

    try {
      const supabase = createSupabaseBrowserClient();
      channel = supabase
        .channel("storefront-inventory-sync")
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "products" },
          (payload) => {
            const updated = payload.new as { id: string; in_stock: boolean };
            setProducts((prev) =>
              prev.map((item) =>
                item.id === updated.id
                  ? { ...item, in_stock: updated.in_stock }
                  : item
              )
            );
          }
        )
        .subscribe();
    } catch {
      // Gracefully continue with initial server data
    }

    return () => {
      if (channel) {
        try {
          createSupabaseBrowserClient().removeChannel(channel);
        } catch {
          // Ignore cleanup failure
        }
      }
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = products.filter((p) => {
      if (activeCategory !== "all" && p.category_id !== activeCategory) {
        return false;
      }
      if (dietFilter === "veg" && !p.is_veg) return false;
      if (dietFilter === "nonveg" && p.is_veg) return false;
      if (tempFilter === "iced" && !p.is_iced) return false;
      if (tempFilter === "hot" && p.is_iced) return false;
      if (
        q &&
        !p.name.toLowerCase().includes(q) &&
        !(p.description ?? "").toLowerCase().includes(q) &&
        !p.tasting_notes.some((n) => n.toLowerCase().includes(q))
      ) {
        return false;
      }
      return true;
    });

    return maxItems ? list.slice(0, maxItems) : list;
  }, [products, activeCategory, dietFilter, tempFilter, search, maxItems]);

  const handleAdd = (
    product: ProductWithVariants,
    variant: ProductVariant,
    withNotes: boolean
  ) => {
    if (!product.in_stock) return;
    addToCart({
      productId: product.id,
      variantId: variant.id,
      productName: product.name,
      variantLabel: variant.label,
      imageUrl: product.image_url,
      isVeg: product.is_veg,
      pricePaise: variant.price_paise,
      qty: 1,
      customizations: withNotes
        ? { Milk: milkChoice, Sweetness: sugarChoice }
        : undefined,
    });
    setCustomOpenId(null);
  };

  return (
    <div>
      {showFilters && (
        <div className="mb-8 space-y-4 rounded-2xl border border-cafe-border bg-cafe-surface/70 p-4 sm:p-5">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                activeCategory === "all"
                  ? "bg-cafe-accent text-cafe-bg"
                  : "border border-cafe-border bg-cafe-bg text-cafe-muted hover:text-cafe-cream"
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  activeCategory === cat.id
                    ? "bg-cafe-accent text-cafe-bg"
                    : "border border-cafe-border bg-cafe-bg text-cafe-muted hover:text-cafe-cream"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Dietary, Temp & Search Row */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {/* Veg / Non-Veg Filters */}
              <div className="inline-flex rounded-full border border-cafe-border bg-cafe-bg p-1 text-xs">
                {(["all", "veg", "nonveg"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setDietFilter(mode)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium transition ${
                      dietFilter === mode
                        ? "bg-cafe-surface-2 text-cafe-cream"
                        : "text-cafe-muted hover:text-cafe-cream"
                    }`}
                  >
                    {mode === "veg" && (
                      <span className="h-2 w-2 rounded-full bg-cafe-veg" />
                    )}
                    {mode === "nonveg" && (
                      <span className="h-2 w-2 rounded-full bg-cafe-nonveg" />
                    )}
                    <span>
                      {mode === "all"
                        ? "All"
                        : mode === "veg"
                        ? "Veg Only"
                        : "Non-Veg"}
                    </span>
                  </button>
                ))}
              </div>

              {/* Hot / Iced Filters */}
              <div className="inline-flex rounded-full border border-cafe-border bg-cafe-bg p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setTempFilter("all")}
                  className={`rounded-full px-3 py-1 font-medium transition ${
                    tempFilter === "all"
                      ? "bg-cafe-surface-2 text-cafe-cream"
                      : "text-cafe-muted"
                  }`}
                >
                  Any Temp
                </button>
                <button
                  type="button"
                  onClick={() => setTempFilter("hot")}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-medium transition ${
                    tempFilter === "hot"
                      ? "bg-cafe-surface-2 text-cafe-accent"
                      : "text-cafe-muted"
                  }`}
                >
                  <Flame className="h-3 w-3" />
                  <span>Hot</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTempFilter("iced")}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-medium transition ${
                    tempFilter === "iced"
                      ? "bg-cafe-surface-2 text-sky-400"
                      : "text-cafe-muted"
                  }`}
                >
                  <Snowflake className="h-3 w-3" />
                  <span>Iced</span>
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-72">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cafe-muted" />
              <input
                id="menu-search"
                name="menuSearch"
                aria-label="Search menu items"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search espresso, matcha, sourdough..."
                className="w-full rounded-full border border-cafe-border bg-cafe-bg py-2 pl-10 pr-4 text-xs text-cafe-cream placeholder:text-cafe-muted focus:border-cafe-accent focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-cafe-border bg-cafe-surface/40 p-12 text-center">
          <p className="font-serif text-2xl text-cafe-cream">
            No menu items match those filters.
          </p>
          <p className="mt-2 text-sm text-cafe-muted">
            Try clearing your dietary or temperature filters to explore our full
            roastery menu.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => {
            const variants = product.product_variants ?? [];
            const activeVariant =
              variants.find((v) => v.id === selectedVariants[product.id]) ??
              variants[0];
            const isCustomizing = customOpenId === product.id;

            return (
              <article
                key={product.id}
                className={`group flex flex-col overflow-hidden rounded-2xl border border-cafe-border bg-cafe-surface/80 transition hover:border-cafe-accent/50 ${
                  !product.in_stock ? "opacity-55 grayscale-[45%]" : ""
                }`}
              >
                {/* Image Header */}
                <div className="relative h-52 overflow-hidden bg-cafe-bg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-cafe-bg/85 via-transparent to-transparent" />

                  <div className="absolute left-3 top-3 flex items-center gap-2">
                    <span className="rounded-md bg-cafe-bg/85 p-1 backdrop-blur">
                      <DietaryBadge isVeg={product.is_veg} />
                    </span>
                    {product.is_iced && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-cafe-bg/85 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-300 backdrop-blur">
                        <Snowflake className="h-3 w-3" />
                        Iced
                      </span>
                    )}
                    {product.is_featured_3d && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-cafe-accent/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cafe-accent backdrop-blur">
                        <Sparkles className="h-3 w-3" />
                        Signature
                      </span>
                    )}
                  </div>

                  {!product.in_stock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-cafe-bg/65 backdrop-blur-[2px]">
                      <span className="rounded-full border border-cafe-nonveg/60 bg-cafe-bg px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-cafe-nonveg">
                        Sold Out Today
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-cafe-cream">
                      {product.name}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-cafe-muted">
                      {product.description}
                    </p>

                    {/* Tasting Notes & Allergens */}
                    {product.tasting_notes.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {product.tasting_notes.slice(0, 3).map((note) => (
                          <span
                            key={note}
                            className="rounded-full bg-cafe-bg px-2.5 py-0.5 text-[10px] text-cafe-muted"
                          >
                            {note}
                          </span>
                        ))}
                      </div>
                    )}
                    {product.allergens.length > 0 && (
                      <p className="mt-2 text-[10px] text-cafe-muted/80">
                        Contains: {product.allergens.join(", ")}
                      </p>
                    )}

                    {/* Variant Selector */}
                    {variants.length > 1 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {variants.map((v) => {
                          const active = activeVariant?.id === v.id;
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() =>
                                setSelectedVariants((prev) => ({
                                  ...prev,
                                  [product.id]: v.id,
                                }))
                              }
                              className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
                                active
                                  ? "border-cafe-accent bg-cafe-accent/15 text-cafe-accent"
                                  : "border-cafe-border bg-cafe-bg text-cafe-muted hover:text-cafe-cream"
                              }`}
                            >
                              {v.label}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Optional Drink Customization Drawer */}
                    {isCustomizing && activeVariant && (
                      <div className="mt-4 space-y-2.5 rounded-xl border border-cafe-border bg-cafe-bg p-3 text-xs">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-cafe-muted">
                            Milk Preference
                          </span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {MILK_OPTIONS.map((m) => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => setMilkChoice(m)}
                                className={`rounded-md px-2 py-1 text-[10px] ${
                                  milkChoice === m
                                    ? "bg-cafe-accent text-cafe-bg font-semibold"
                                    : "bg-cafe-surface text-cafe-muted"
                                }`}
                              >
                                {m}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-cafe-muted">
                            Sweetness
                          </span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {SUGAR_OPTIONS.map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setSugarChoice(s)}
                                className={`rounded-md px-2 py-1 text-[10px] ${
                                  sugarChoice === s
                                    ? "bg-cafe-accent text-cafe-bg font-semibold"
                                    : "bg-cafe-surface text-cafe-muted"
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAdd(product, activeVariant, true)}
                          className="w-full rounded-lg bg-cafe-accent py-2 text-xs font-semibold text-cafe-bg hover:bg-cafe-accent-hover"
                        >
                          Confirm &amp; Add · {formatPaiseToINR(activeVariant.price_paise)}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Price & Add Controls */}
                  <div className="mt-5 flex items-center justify-between border-t border-cafe-border/70 pt-4">
                    <div>
                      <span className="font-mono text-lg font-bold text-cafe-cream">
                        {activeVariant
                          ? formatPaiseToINR(activeVariant.price_paise)
                          : "—"}
                      </span>
                      {activeVariant && variants.length === 1 && (
                        <span className="ml-2 text-[11px] text-cafe-muted">
                          {activeVariant.label}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {product.in_stock && activeVariant && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setCustomOpenId(isCustomizing ? null : product.id)
                            }
                            className="rounded-full border border-cafe-border px-2.5 py-1.5 text-[11px] font-medium text-cafe-muted transition hover:border-cafe-accent/60 hover:text-cafe-cream"
                          >
                            {isCustomizing ? "Close" : "Customize"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdd(product, activeVariant, false)}
                            className="inline-flex items-center gap-1 rounded-full bg-cafe-accent px-3.5 py-1.5 text-xs font-semibold text-cafe-bg transition hover:bg-cafe-accent-hover"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
