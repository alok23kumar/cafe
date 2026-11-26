"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Users,
  AlertCircle,
} from "lucide-react";
import SceneWrapper from "@/components/3d/SceneWrapper";
import { useCafeStore } from "@/store/useCafeStore";
import type { CafeTable, TableZone } from "@/types/database";

const ZONE_META: Record<
  TableZone,
  { title: string; subtitle: string; vibe: string; fallbackImg: string }
> = {
  indoor: {
    title: "Indoor Walnut Booths",
    subtitle: "Warm Brass Pendants · Quiet Acoustics",
    vibe: "Cozy sunlit banquettes ideal for long conversations or deep focus.",
    fallbackImg:
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1000&q=80",
  },
  patio: {
    title: "Terracotta Garden Patio",
    subtitle: "Open-Air Bistro · String Lights",
    vibe: "Breezy courtyard tables surrounded by jasmine vines and terracotta planters.",
    fallbackImg:
      "https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=1000&q=80",
  },
  bar: {
    title: "Espresso Slow Bar",
    subtitle: "Front-Row V60 · Roaster View",
    vibe: "Brushed brass stools directly facing our head baristas and copper drum roaster.",
    fallbackImg:
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=80",
  },
};

const TIME_SLOTS = [
  "08:30",
  "10:00",
  "11:30",
  "13:00",
  "15:00",
  "16:30",
  "18:00",
  "19:30",
  "21:00",
];

function getTodayDateISO(): string {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

export default function ReservationForm({ tables }: { tables: CafeTable[] }) {
  const activeZone = useCafeStore((s) => s.activeReservationZone);
  const setActiveZone = useCafeStore((s) => s.setActiveReservationZone);

  const tablesInZone = useMemo(
    () => tables.filter((t) => t.zone === activeZone),
    [tables, activeZone]
  );

  const [selectedTableId, setSelectedTableId] = useState<string>(
    tablesInZone[0]?.id ?? tables[0]?.id ?? ""
  );
  const [date, setDate] = useState(getTodayDateISO());
  const [timeSlot, setTimeSlot] = useState("19:30");
  const [guestCount, setGuestCount] = useState(2);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{
    id: string;
    tableName: string;
    slotStart: string;
    guestCount: number;
    demoMode?: boolean;
  } | null>(null);

  const selectedTable =
    tables.find((t) => t.id === selectedTableId) ?? tablesInZone[0] ?? null;

  const handleZoneChange = (zone: TableZone) => {
    setActiveZone(zone);
    const first = tables.find((t) => t.zone === zone);
    if (first) setSelectedTableId(first.id);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedTable) {
      setError("Please choose a table.");
      return;
    }

    if (guestCount > selectedTable.capacity) {
      setError(
        `${selectedTable.name} seats up to ${selectedTable.capacity} guests. Please pick a larger table.`
      );
      return;
    }

    // Build 90-minute ISO slot in IST (+05:30)
    const slotStartDate = new Date(`${date}T${timeSlot}:00+05:30`);
    const slotEndDate = new Date(slotStartDate.getTime() + 90 * 60 * 1000);

    setSubmitting(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId: selectedTable.id,
          tableName: selectedTable.name,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          guestCount,
          slotStart: slotStartDate.toISOString(),
          slotEnd: slotEndDate.toISOString(),
          specialRequests: specialRequests.trim() || null,
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setError(
          data.error ||
          "That table is already reserved during this 90-minute slot. Please select another time or table."
        );
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Could not complete reservation.");
      }

      setConfirmed({
        id: data.reservation.id,
        tableName: selectedTable.name,
        slotStart: `${date} · ${timeSlot} IST (90 mins)`,
        guestCount,
        demoMode: data.demoMode,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reserve table."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const zoneInfo = ZONE_META[activeZone];

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* Left: 3D Mini-Preview of Selected Cafe Zone */}
      <div className="space-y-4 lg:col-span-6">
        <div className="flex flex-wrap gap-2">
          {(["indoor", "patio", "bar"] as const).map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => handleZoneChange(z)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${activeZone === z
                  ? "bg-cafe-accent text-cafe-bg"
                  : "border border-cafe-border bg-cafe-surface text-cafe-muted hover:text-cafe-cream"
                }`}
            >
              {ZONE_META[z].title}
            </button>
          ))}
        </div>

        <div className="cafe-glow rounded-3xl border border-cafe-border bg-cafe-surface/70 p-3">
          <SceneWrapper
            scene="zone-preview"
            zone={activeZone}
            fallbackImg={zoneInfo.fallbackImg}
            alt={zoneInfo.title}
            className="h-[340px] w-full sm:h-[400px]"
          />
          <div className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cafe-accent">
              {zoneInfo.subtitle}
            </p>
            <h3 className="mt-1 font-serif text-2xl font-semibold text-cafe-cream">
              {zoneInfo.title}
            </h3>
            <p className="mt-1.5 text-sm text-cafe-muted">{zoneInfo.vibe}</p>
          </div>
        </div>

        {/* Tables inside active zone */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {tablesInZone.map((table) => {
            const isSelected = selectedTable?.id === table.id;
            return (
              <button
                key={table.id}
                type="button"
                onClick={() => setSelectedTableId(table.id)}
                className={`rounded-2xl border p-4 text-left transition ${isSelected
                    ? "border-cafe-accent bg-cafe-accent/15"
                    : "border-cafe-border bg-cafe-surface/60 hover:border-cafe-accent/50"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-cafe-cream">
                    {table.name}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-cafe-bg px-2.5 py-0.5 font-mono text-[11px] text-cafe-accent">
                    <Users className="h-3 w-3" />
                    Up to {table.capacity}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-cafe-muted">
                  {table.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Booking Form or Confirmation Pass */}
      <div className="lg:col-span-6">
        <div className="rounded-3xl border border-cafe-border bg-cafe-surface/80 p-6 sm:p-8">
          {confirmed ? (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cafe-veg/15 text-cafe-veg">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-cafe-accent">
                Reservation Pass
              </p>
              <h3 className="mt-1 font-serif text-3xl font-semibold text-cafe-cream">
                Table Confirmed
              </h3>
              <p className="mt-2 text-xs text-cafe-muted">
                Show this pass at the Ember &amp; Bean host desk when you arrive.
                {confirmed.demoMode &&
                  " (Preview mode — connect Supabase to persist live table locks.)"}
              </p>

              <div className="mt-6 space-y-2 rounded-2xl border border-cafe-border bg-cafe-bg p-5 text-left font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-cafe-muted">Booking ID</span>
                  <span className="text-cafe-accent">
                    {confirmed.id.slice(0, 10).toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cafe-muted">Table</span>
                  <span className="text-cafe-cream">{confirmed.tableName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cafe-muted">Slot</span>
                  <span className="text-cafe-cream">{confirmed.slotStart}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cafe-muted">Guests</span>
                  <span className="text-cafe-cream">
                    {confirmed.guestCount} Guests
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setConfirmed(null)}
                className="mt-6 rounded-full border border-cafe-border px-6 py-2.5 text-xs font-semibold text-cafe-cream hover:border-cafe-accent"
              >
                Book Another Table
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cafe-accent">
                  Atomic Slot Lock · 90-Minute Seating
                </p>
                <h3 className="mt-1 font-serif text-3xl font-semibold text-cafe-cream">
                  Reserve {selectedTable?.name ?? "Your Table"}
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="reserve-date"
                    className="flex items-center gap-1.5 text-xs font-medium text-cafe-muted"
                  >
                    <Calendar className="h-3.5 w-3.5 text-cafe-accent" />
                    <span>Date</span>
                  </label>
                  <input
                    id="reserve-date"
                    name="date"
                    required
                    type="date"
                    min={getTodayDateISO()}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-cafe-border bg-cafe-bg px-3.5 py-2.5 text-sm text-cafe-cream focus:border-cafe-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="reserve-guests"
                    className="flex items-center gap-1.5 text-xs font-medium text-cafe-muted"
                  >
                    <Users className="h-3.5 w-3.5 text-cafe-accent" />
                    <span>Guests (Max {selectedTable?.capacity ?? 6})</span>
                  </label>
                  <input
                    id="reserve-guests"
                    name="guestCount"
                    required
                    type="number"
                    min={1}
                    max={selectedTable?.capacity ?? 6}
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-cafe-border bg-cafe-bg px-3.5 py-2.5 text-sm text-cafe-cream focus:border-cafe-accent focus:outline-none"
                  />
                </div>
              </div>

              {/* Time Slot Pills */}
              <div>
                <p className="flex items-center gap-1.5 text-xs font-medium text-cafe-muted">
                  <Clock className="h-3.5 w-3.5 text-cafe-accent" />
                  <span>Select Seating Time (IST)</span>
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTimeSlot(slot)}
                      className={`rounded-xl border py-2 font-mono text-xs transition ${
                        timeSlot === slot
                          ? "border-cafe-accent bg-cafe-accent text-cafe-bg font-bold"
                          : "border-cafe-border bg-cafe-bg text-cafe-muted hover:border-cafe-accent/60 hover:text-cafe-cream"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="reserve-name"
                    className="block text-xs font-medium text-cafe-muted"
                  >
                    Your Name *
                  </label>
                  <input
                    id="reserve-name"
                    name="customerName"
                    autoComplete="name"
                    required
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ananya Rao"
                    className="mt-1.5 w-full rounded-xl border border-cafe-border bg-cafe-bg px-3.5 py-2.5 text-sm text-cafe-cream focus:border-cafe-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="reserve-phone"
                    className="block text-xs font-medium text-cafe-muted"
                  >
                    Phone Number *
                  </label>
                  <input
                    id="reserve-phone"
                    name="customerPhone"
                    autoComplete="tel"
                    required
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="mt-1.5 w-full rounded-xl border border-cafe-border bg-cafe-bg px-3.5 py-2.5 text-sm text-cafe-cream focus:border-cafe-accent focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reserve-requests"
                  className="block text-xs font-medium text-cafe-muted"
                >
                  Special Requests (Optional)
                </label>
                <input
                  id="reserve-requests"
                  name="specialRequests"
                  type="text"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Power outlet needed, birthday pastry, high chair..."
                  className="mt-1.5 w-full rounded-xl border border-cafe-border bg-cafe-bg px-3.5 py-2.5 text-sm text-cafe-cream focus:border-cafe-accent focus:outline-none"
                />
              </div>

              {error && (
            <div className="flex items-start gap-2 rounded-xl border border-cafe-nonveg/40 bg-cafe-nonveg/10 p-3 text-xs text-cafe-nonveg">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
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
                <span>Checking Availability...</span>
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4" />
                <span>Confirm Table Reservation</span>
              </>
            )}
          </button>
        </form>
          )}
      </div>
    </div>
    </div >
  );
}
