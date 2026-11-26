import type { Metadata } from "next";
import { getCafeTables } from "@/lib/catalog";
import ReservationForm from "@/components/commerce/ReservationForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reserve a Table",
  description:
    "Preview our Walnut Booths, Terracotta Garden Patio, and Espresso Slow Bar in 3D and lock your 90-minute cafe table reservation.",
};

export default async function ReservePage() {
  const { tables } = await getCafeTables();

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
      <div className="mb-10 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-cafe-accent">
          Table Reservations · Indiranagar Flagship
        </p>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-cafe-cream sm:text-5xl">
          Choose Your Zone &amp; Table
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-cafe-muted">
          Explore our three physical seating atmospheres in interactive 3D and
          book a 90-minute slot with real-time overlap protection.
        </p>
      </div>

      <ReservationForm tables={tables} />
    </div>
  );
}
