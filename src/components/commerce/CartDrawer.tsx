"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2, X, ArrowRight } from "lucide-react";
import { DietaryBadge } from "@/components/ui/DietaryBadge";
import {
  selectCartSubtotalPaise,
  useCafeStore,
} from "@/store/useCafeStore";
import { formatPaiseToINR } from "@/types/database";
import CheckoutModal from "./CheckoutModal";

export default function CartDrawer() {
  const isCartOpen = useCafeStore((s) => s.isCartOpen);
  const setCartOpen = useCafeStore((s) => s.setCartOpen);
  const cart = useCafeStore((s) => s.cart);
  const updateItemQty = useCafeStore((s) => s.updateItemQty);
  const removeFromCart = useCafeStore((s) => s.removeFromCart);
  const clearCart = useCafeStore((s) => s.clearCart);
  const subtotalPaise = useCafeStore(selectCartSubtotalPaise);

  const [checkoutOpen, setCheckoutOpen] = useState(false);

  return (
    <>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setCartOpen(false)}
          />

          {/* Slide-Over Panel */}
          <aside className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-cafe-border bg-cafe-bg shadow-2xl">
            <div className="flex items-center justify-between border-b border-cafe-border px-6 py-5">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="h-5 w-5 text-cafe-accent" />
                <h2 className="font-serif text-2xl font-semibold text-cafe-cream">
                  Your Order
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="rounded-lg border border-cafe-border p-1.5 text-cafe-muted hover:text-cafe-cream"
                aria-label="Close Cart"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cafe-border bg-cafe-surface text-cafe-accent">
                    <ShoppingBag className="h-7 w-7" />
                  </div>
                  <p className="mt-4 font-serif text-xl text-cafe-cream">
                    Your cup is empty
                  </p>
                  <p className="mt-2 max-w-xs text-xs text-cafe-muted">
                    Add freshly pulled espresso, single-origin beans, or warm
                    almond croissants to get started.
                  </p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {cart.map((item) => (
                    <li
                      key={item.lineKey}
                      className="flex gap-3.5 rounded-2xl border border-cafe-border bg-cafe-surface/80 p-3.5"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="h-18 w-18 shrink-0 rounded-xl object-cover"
                      />
                      <div className="flex flex-1 flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <DietaryBadge isVeg={item.isVeg} />
                              <p className="text-sm font-semibold text-cafe-cream">
                                {item.productName}
                              </p>
                            </div>
                            <p className="mt-0.5 text-xs text-cafe-muted">
                              {item.variantLabel}
                            </p>
                            {item.customizations &&
                              Object.keys(item.customizations).length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {Object.entries(item.customizations).map(
                                    ([k, v]) => (
                                      <span
                                        key={k}
                                        className="rounded bg-cafe-bg px-1.5 py-0.5 text-[10px] text-cafe-accent"
                                      >
                                        {k}: {v}
                                      </span>
                                    )
                                  )}
                                </div>
                              )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.lineKey)}
                            className="text-cafe-muted hover:text-cafe-nonveg"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="inline-flex items-center gap-2 rounded-full border border-cafe-border bg-cafe-bg px-2 py-0.5">
                            <button
                              type="button"
                              onClick={() =>
                                updateItemQty(item.lineKey, item.qty - 1)
                              }
                              className="p-0.5 text-cafe-muted hover:text-cafe-cream"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="min-w-4 text-center font-mono text-xs text-cafe-cream">
                              {item.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateItemQty(item.lineKey, item.qty + 1)
                              }
                              className="p-0.5 text-cafe-muted hover:text-cafe-cream"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <span className="font-mono text-sm font-semibold text-cafe-accent">
                            {formatPaiseToINR(item.pricePaise * item.qty)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer Totals & Checkout */}
            {cart.length > 0 && (
              <div className="border-t border-cafe-border bg-cafe-surface/90 px-6 py-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-cafe-muted">Estimated Subtotal</span>
                  <span className="font-mono text-xl font-bold text-cafe-cream">
                    {formatPaiseToINR(subtotalPaise)}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-cafe-muted">
                  Authoritative pricing &amp; stock are verified server-side via
                  Supabase before Razorpay UPI/Card checkout.
                </p>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => clearCart()}
                    className="rounded-full border border-cafe-border px-4 py-3 text-xs font-medium text-cafe-muted hover:text-cafe-cream"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCartOpen(false);
                      setCheckoutOpen(true);
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-cafe-accent px-5 py-3 text-sm font-semibold text-cafe-bg transition hover:bg-cafe-accent-hover"
                  >
                    <span>Checkout with Razorpay</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
      />
    </>
  );
}
