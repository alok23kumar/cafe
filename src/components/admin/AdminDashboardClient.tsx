"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Calendar,
  CheckCircle2,
  Coffee,
  LogOut,
  Package,
  RefreshCw,
  ShoppingBag,
  Volume2,
} from "lucide-react";
import { DietaryBadge } from "@/components/ui/DietaryBadge";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import {
  formatPaiseToINR,
  type Order,
  type OrderStatus,
  type ProductWithVariants,
  type Reservation,
  type ReservationStatus,
} from "@/types/database";

const ORDER_STATUS_FLOW: OrderStatus[] = [
  "new",
  "preparing",
  "ready",
  "completed",
];

function playOrderChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.14);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.36);
  } catch {
    // Ignore autoplay restriction if user hasn't interacted yet
  }
}

interface AdminDashboardClientProps {
  initialOrders: Order[];
  initialProducts: ProductWithVariants[];
  initialReservations: Reservation[];
  isLiveDb: boolean;
  adminEmail: string | null;
}

export default function AdminDashboardClient({
  initialOrders,
  initialProducts,
  initialReservations,
  isLiveDb,
  adminEmail,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "orders" | "inventory" | "reservations"
  >("orders");
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [products, setProducts] = useState<ProductWithVariants[]>(initialProducts);
  const [reservations, setReservations] =
    useState<Reservation[]>(initialReservations);
  const [liveToast, setLiveToast] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Supabase Realtime Live Order & Reservation Stream
  useEffect(() => {
    if (!isLiveDb || !isSupabaseConfigured()) return;
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel("admin-live-ops")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newOrder = payload.new as Order;
            setOrders((prev) => [newOrder, ...prev]);
            setLiveToast(
              `New order from ${newOrder.customer_name} (${formatPaiseToINR(
                newOrder.total_paise
              )})`
            );
            if (soundEnabled) playOrderChime();
            setTimeout(() => setLiveToast(null), 5000);
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Order;
            setOrders((prev) =>
              prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
            );
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reservations" },
        (payload) => {
          const newRes = payload.new as Reservation;
          setReservations((prev) => [newRes, ...prev]);
          setLiveToast(`New table reservation: ${newRes.customer_name}`);
          if (soundEnabled) playOrderChime();
          setTimeout(() => setLiveToast(null), 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLiveDb, soundEnabled]);

  const handleToggleStock = async (product: ProductWithVariants) => {
    const nextStock = !product.in_stock;
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, in_stock: nextStock } : p))
    );

    if (isLiveDb && isSupabaseConfigured()) {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("products")
        .update({ in_stock: nextStock })
        .eq("id", product.id);
      if (error) {
        // Revert optimistic update on failure
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id ? { ...p, in_stock: product.in_stock } : p
          )
        );
      }
    }
  };

  const handleOrderStatusChange = async (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, order_status: status } : o))
    );
    if (isLiveDb && isSupabaseConfigured()) {
      const supabase = createSupabaseBrowserClient();
      await supabase
        .from("orders")
        .update({ order_status: status })
        .eq("id", orderId);
    }
  };

  const handleReservationStatusChange = async (
    reservationId: string,
    status: ReservationStatus
  ) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === reservationId ? { ...r, status } : r))
    );
    if (isLiveDb && isSupabaseConfigured()) {
      const supabase = createSupabaseBrowserClient();
      await supabase
        .from("reservations")
        .update({ status })
        .eq("id", reservationId);
    }
  };

  const handleSignOut = async () => {
    if (isSupabaseConfigured()) {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    }
    router.push("/admin/login");
    router.refresh();
  };

  const paidOrdersCount = orders.filter((o) => o.payment_status === "paid").length;
  const activeOrdersCount = orders.filter(
    (o) => o.order_status !== "completed"
  ).length;
  const outOfStockCount = products.filter((p) => !p.in_stock).length;

  return (
    <div className="min-h-screen bg-cafe-bg text-cafe-cream">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-30 border-b border-cafe-border bg-cafe-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cafe-accent/40 bg-cafe-bg text-cafe-accent">
              <Coffee className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-semibold text-cafe-cream">
                Ember &amp; Bean — Owner Operations
              </h1>
              <p className="text-xs text-cafe-muted">
                {isLiveDb
                  ? `Supabase Realtime Active · ${adminEmail ?? "Admin"}`
                  : "Preview Sandbox Mode (Connect .env.local for Live Realtime DB)"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSoundEnabled((s) => !s)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
                soundEnabled
                  ? "border-cafe-accent/50 bg-cafe-accent/15 text-cafe-accent"
                  : "border-cafe-border text-cafe-muted"
              }`}
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span>{soundEnabled ? "Ding On" : "Muted"}</span>
            </button>

            <Link
              href="/"
              className="rounded-full border border-cafe-border px-3.5 py-1.5 text-xs font-medium text-cafe-muted hover:border-cafe-accent hover:text-cafe-cream"
            >
              View Storefront
            </Link>

            {isLiveDb && (
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 rounded-full border border-cafe-border px-3.5 py-1.5 text-xs font-medium text-cafe-muted hover:border-cafe-nonveg hover:text-cafe-nonveg"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Realtime New Order Toast */}
      {liveToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-2xl border border-cafe-accent bg-cafe-surface px-5 py-3.5 text-xs font-semibold text-cafe-cream shadow-2xl">
          <Bell className="h-4 w-4 animate-bounce text-cafe-accent" />
          <span>{liveToast}</span>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-cafe-border bg-cafe-surface p-5">
            <p className="text-xs uppercase tracking-wider text-cafe-muted">
              Active Queue
            </p>
            <p className="mt-2 font-mono text-3xl font-bold text-cafe-accent">
              {activeOrdersCount}
            </p>
            <p className="mt-1 text-xs text-cafe-muted">
              {paidOrdersCount} paid via Razorpay
            </p>
          </div>
          <div className="rounded-2xl border border-cafe-border bg-cafe-surface p-5">
            <p className="text-xs uppercase tracking-wider text-cafe-muted">
              Menu Inventory
            </p>
            <p className="mt-2 font-mono text-3xl font-bold text-cafe-cream">
              {products.length - outOfStockCount} / {products.length}
            </p>
            <p className="mt-1 text-xs text-cafe-muted">
              {outOfStockCount} item(s) marked sold out
            </p>
          </div>
          <div className="rounded-2xl border border-cafe-border bg-cafe-surface p-5">
            <p className="text-xs uppercase tracking-wider text-cafe-muted">
              Upcoming Table Bookings
            </p>
            <p className="mt-2 font-mono text-3xl font-bold text-cafe-cream">
              {reservations.filter((r) => r.status !== "cancelled").length}
            </p>
            <p className="mt-1 text-xs text-cafe-muted">
              Overlap-protected 90-min slots
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-cafe-border pb-4">
          <div className="flex gap-2">
            {(
              [
                { id: "orders", label: "Live Order Queue", icon: ShoppingBag },
                { id: "inventory", label: "Live Stock Toggles", icon: Package },
                {
                  id: "reservations",
                  label: "Table Reservations",
                  icon: Calendar,
                },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                  activeTab === id
                    ? "bg-cafe-accent text-cafe-bg"
                    : "border border-cafe-border bg-cafe-surface text-cafe-muted hover:text-cafe-cream"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => router.refresh()}
            className="inline-flex items-center gap-1.5 text-xs text-cafe-muted hover:text-cafe-accent"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Sync Now</span>
          </button>
        </div>

        {/* TAB 1: LIVE ORDER QUEUE */}
        {activeTab === "orders" && (
          <div className="mt-6 space-y-4">
            {orders.length === 0 ? (
              <div className="rounded-2xl border border-cafe-border bg-cafe-surface/50 p-12 text-center">
                <p className="font-serif text-2xl text-cafe-cream">
                  No orders in the queue yet.
                </p>
                <p className="mt-2 text-xs text-cafe-muted">
                  New Razorpay orders will appear here live via Supabase Realtime
                  with an audio ding.
                </p>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-cafe-border bg-cafe-surface p-5 md:flex-row md:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cafe-accent">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          order.payment_status === "paid"
                            ? "bg-cafe-veg/15 text-cafe-veg"
                            : order.payment_status === "failed"
                            ? "bg-cafe-nonveg/15 text-cafe-nonveg"
                            : "bg-amber-400/15 text-amber-300"
                        }`}
                      >
                        {order.payment_status}
                      </span>
                      <span className="rounded-full border border-cafe-border bg-cafe-bg px-2.5 py-0.5 text-[10px] uppercase text-cafe-muted">
                        {order.fulfillment_type.replace("_", " ")}
                      </span>
                    </div>
                    <p className="mt-2 text-base font-semibold text-cafe-cream">
                      {order.customer_name} ·{" "}
                      <span className="font-mono text-sm text-cafe-muted">
                        {order.customer_phone}
                      </span>
                    </p>
                    {order.delivery_address && (
                      <p className="mt-1 text-xs text-cafe-muted">
                        Deliver to: {order.delivery_address}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-lg font-bold text-cafe-cream">
                      {formatPaiseToINR(order.total_paise)}
                    </span>

                    <div className="flex flex-wrap gap-1.5">
                      {ORDER_STATUS_FLOW.map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => handleOrderStatusChange(order.id, status)}
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold capitalize transition ${
                            order.order_status === status
                              ? "bg-cafe-accent text-cafe-bg"
                              : "border border-cafe-border bg-cafe-bg text-cafe-muted hover:text-cafe-cream"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: LIVE INVENTORY TOGGLES */}
        {activeTab === "inventory" && (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-cafe-border bg-cafe-surface p-4"
              >
                <div className="flex items-center gap-3.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className={`h-14 w-14 rounded-xl object-cover ${
                      !product.in_stock ? "opacity-45 grayscale" : ""
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <DietaryBadge isVeg={product.is_veg} />
                      <p className="font-semibold text-cafe-cream">
                        {product.name}
                      </p>
                    </div>
                    <p className="mt-0.5 text-xs text-cafe-muted">
                      {product.product_variants.length} variant(s) · From{" "}
                      {product.product_variants[0]
                        ? formatPaiseToINR(product.product_variants[0].price_paise)
                        : "—"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleStock(product)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ${
                    product.in_stock
                      ? "bg-cafe-veg/15 text-cafe-veg hover:bg-cafe-veg/25"
                      : "bg-cafe-nonveg/15 text-cafe-nonveg hover:bg-cafe-nonveg/25"
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{product.in_stock ? "In Stock" : "Sold Out"}</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: TABLE RESERVATIONS MANAGER */}
        {activeTab === "reservations" && (
          <div className="mt-6 space-y-4">
            {reservations.length === 0 ? (
              <div className="rounded-2xl border border-cafe-border bg-cafe-surface/50 p-12 text-center">
                <p className="font-serif text-2xl text-cafe-cream">
                  No table reservations yet.
                </p>
                <p className="mt-2 text-xs text-cafe-muted">
                  Guest bookings from <code>/reserve</code> appear here in real
                  time.
                </p>
              </div>
            ) : (
              reservations.map((res) => (
                <div
                  key={res.id}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-cafe-border bg-cafe-surface p-5 md:flex-row md:items-center"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-cafe-cream">
                        {res.customer_name}
                      </span>
                      <span className="font-mono text-xs text-cafe-muted">
                        ({res.customer_phone})
                      </span>
                      <span className="rounded-full bg-cafe-bg px-2.5 py-0.5 text-[10px] font-semibold text-cafe-accent">
                        {res.guest_count} Guests
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-cafe-muted">
                      {res.cafe_tables?.name ?? "Cafe Table"} ·{" "}
                      {new Date(res.slot_start).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    {res.special_requests && (
                      <p className="mt-1 text-xs text-cafe-accent">
                        Note: {res.special_requests}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {(["confirmed", "seated", "cancelled"] as const).map(
                      (status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() =>
                            handleReservationStatusChange(res.id, status)
                          }
                          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition ${
                            res.status === status
                              ? status === "cancelled"
                                ? "bg-cafe-nonveg text-white"
                                : "bg-cafe-accent text-cafe-bg"
                              : "border border-cafe-border bg-cafe-bg text-cafe-muted hover:text-cafe-cream"
                          }`}
                        >
                          {status}
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
