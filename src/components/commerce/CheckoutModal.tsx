"use client";

import { useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  Loader2,
  MapPin,
  ShieldCheck,
  Store,
  UtensilsCrossed,
  X,
} from "lucide-react";
import {
  selectCartSubtotalPaise,
  useCafeStore,
} from "@/store/useCafeStore";
import { formatPaiseToINR, type FulfillmentType } from "@/types/database";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

function loadRazorpayCheckoutScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CheckoutModal({ open, onClose }: CheckoutModalProps) {
  const cart = useCafeStore((s) => s.cart);
  const clearCart = useCafeStore((s) => s.clearCart);
  const subtotalPaise = useCafeStore(selectCartSubtotalPaise);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [fulfillmentType, setFulfillmentType] =
    useState<FulfillmentType>("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderId: string;
    totalPaise: number;
    paymentId?: string;
    mode: "live" | "demo";
  } | null>(null);

  if (!open) return null;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setSubmitting(true);
    try {
      // ZERO CLIENT TRUST: Never send prices from browser; send only variantId, quantity, customizations
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          fulfillmentType,
          deliveryAddress:
            fulfillmentType === "delivery" ? deliveryAddress.trim() : null,
          items: cart.map((item) => ({
            variantId: item.variantId,
            quantity: item.qty,
            customizations: item.customizations ?? null,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to initiate checkout.");
      }

      // If Razorpay keys are not configured yet, API returns demo mode confirmation
      if (data.demoMode) {
        clearCart();
        setConfirmedOrder({
          orderId: data.orderId,
          totalPaise: data.amountPaise,
          mode: "demo",
        });
        return;
      }

      const scriptLoaded = await loadRazorpayCheckoutScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error(
          "Could not load Razorpay Checkout SDK. Please check your connection."
        );
      }

      const rzp = new window.Razorpay({
        key: data.razorpayKeyId,
        amount: data.amountPaise,
        currency: "INR",
        name: "Ember & Bean Roastery",
        description: "Specialty Coffee & Bakery Order",
        order_id: data.razorpayOrderId,
        prefill: {
          name: customerName,
          contact: customerPhone,
        },
        theme: {
          color: "#d98a4e",
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch("/api/orders/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: data.orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            if (!verifyRes.ok) {
              const errBody = await verifyRes.json();
              throw new Error(errBody.error || "Payment verification pending.");
            }

            clearCart();
            setConfirmedOrder({
              orderId: data.orderId,
              totalPaise: data.amountPaise,
              paymentId: response.razorpay_payment_id,
              mode: "live",
            });
          } catch (verifyErr) {
            setError(
              verifyErr instanceof Error
                ? verifyErr.message
                : "Payment verification failed; webhook will finalize your order."
            );
          }
        },
      });

      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-cafe-border bg-cafe-bg shadow-2xl">
        <div className="flex items-center justify-between border-b border-cafe-border px-6 py-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-cafe-accent" />
            <h2 className="font-serif text-2xl font-semibold text-cafe-cream">
              {confirmedOrder ? "Order Confirmed" : "Secure Cafe Checkout"}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setConfirmedOrder(null);
              onClose();
            }}
            className="rounded-lg border border-cafe-border p-1.5 text-cafe-muted hover:text-cafe-cream"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {confirmedOrder ? (
          <div className="p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cafe-veg/15 text-cafe-veg">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="mt-4 font-serif text-2xl font-semibold text-cafe-cream">
              We&apos;re brewing your order!
            </h3>
            <p className="mt-2 text-xs text-cafe-muted">
              {confirmedOrder.mode === "demo"
                ? "Simulated checkout succeeded (configure Supabase & Razorpay env keys for live UPI/Card billing)."
                : "Payment verified via Razorpay HMAC SHA256. Our baristas have received your ticket in real time."}
            </p>
            <div className="mt-5 rounded-2xl border border-cafe-border bg-cafe-surface p-4 text-left font-mono text-xs">
              <div className="flex justify-between py-1">
                <span className="text-cafe-muted">Order Ref</span>
                <span className="text-cafe-cream">
                  {confirmedOrder.orderId.slice(0, 12).toUpperCase()}
                </span>
              </div>
              {confirmedOrder.paymentId && (
                <div className="flex justify-between py-1">
                  <span className="text-cafe-muted">Razorpay ID</span>
                  <span className="text-cafe-accent">
                    {confirmedOrder.paymentId}
                  </span>
                </div>
              )}
              <div className="mt-1 flex justify-between border-t border-cafe-border pt-2">
                <span className="text-cafe-muted">Total Paid</span>
                <span className="font-bold text-cafe-cream">
                  {formatPaiseToINR(confirmedOrder.totalPaise)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setConfirmedOrder(null);
                onClose();
              }}
              className="mt-6 w-full rounded-full bg-cafe-accent py-3 text-sm font-semibold text-cafe-bg hover:bg-cafe-accent-hover"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleCheckout} className="space-y-4 p-6">
            {/* Fulfillment Mode */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-cafe-muted">
                Fulfillment Method
              </label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "pickup", label: "Pickup", icon: Store },
                    { id: "dine_in", label: "Dine-In", icon: UtensilsCrossed },
                    { id: "delivery", label: "Delivery", icon: MapPin },
                  ] as const
                ).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFulfillmentType(id)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-medium transition ${
                      fulfillmentType === id
                        ? "border-cafe-accent bg-cafe-accent/15 text-cafe-accent"
                        : "border-cafe-border bg-cafe-surface text-cafe-muted hover:text-cafe-cream"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-cafe-muted">
                  Full Name *
                </label>
                <input
                  required
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Aarav Mehta"
                  className="mt-1.5 w-full rounded-xl border border-cafe-border bg-cafe-surface px-3.5 py-2.5 text-sm text-cafe-cream focus:border-cafe-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-cafe-muted">
                  Phone (WhatsApp / UPI) *
                </label>
                <input
                  required
                  type="tel"
                  pattern="[0-9+\-\s]{10,15}"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="mt-1.5 w-full rounded-xl border border-cafe-border bg-cafe-surface px-3.5 py-2.5 text-sm text-cafe-cream focus:border-cafe-accent focus:outline-none"
                />
              </div>
            </div>

            {fulfillmentType === "delivery" && (
              <div>
                <label className="block text-xs font-medium text-cafe-muted">
                  Delivery Address *
                </label>
                <textarea
                  required
                  rows={2}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Flat 402, Palm Grove Apartments, Indiranagar..."
                  className="mt-1.5 w-full rounded-xl border border-cafe-border bg-cafe-surface px-3.5 py-2.5 text-sm text-cafe-cream focus:border-cafe-accent focus:outline-none"
                />
              </div>
            )}

            {/* Order Summary Bar */}
            <div className="flex items-center justify-between rounded-2xl border border-cafe-border bg-cafe-surface px-4 py-3">
              <div>
                <p className="text-xs text-cafe-muted">
                  {cart.reduce((sum, i) => sum + i.qty, 0)} item(s) · Verified
                  on Server
                </p>
                <p className="inline-flex items-center gap-1 text-[11px] text-cafe-accent">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>UPI QR · GPay · PhonePe · Cards</span>
                </p>
              </div>
              <span className="font-mono text-xl font-bold text-cafe-cream">
                {formatPaiseToINR(subtotalPaise)}
              </span>
            </div>

            {error && (
              <div className="rounded-xl border border-cafe-nonveg/40 bg-cafe-nonveg/10 px-3.5 py-2.5 text-xs text-cafe-nonveg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-cafe-accent py-3.5 text-sm font-semibold text-cafe-bg transition hover:bg-cafe-accent-hover disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying Stock &amp; Opening Razorpay...</span>
                </>
              ) : (
                <span>Pay {formatPaiseToINR(subtotalPaise)} Securely</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
