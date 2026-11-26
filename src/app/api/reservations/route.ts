import crypto from "crypto";
import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { FALLBACK_TABLES } from "@/lib/catalog";

interface ReservationInput {
  tableId?: string;
  tableName?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string | null;
  guestCount?: number;
  slotStart?: string;
  slotEnd?: string;
  specialRequests?: string | null;
}

function hasLiveSupabaseServiceEnv(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url && serviceKey && !url.includes("your-project-ref"));
}

// In-memory overlap tracker strictly for local preview mode before Supabase env vars are set
const previewReservations: Array<{
  id: string;
  tableId: string;
  slotStart: number;
  slotEnd: number;
}> = [];

/**
 * GET /api/reservations?tableId=...&date=YYYY-MM-DD
 * Returns ONLY booked time intervals (no customer PII) for slot availability UI.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tableId = searchParams.get("tableId");
  const date = searchParams.get("date");

  if (!tableId || !date) {
    return NextResponse.json(
      { error: "tableId and date query parameters are required." },
      { status: 400 }
    );
  }

  if (!hasLiveSupabaseServiceEnv()) {
    const slots = previewReservations
      .filter((r) => r.tableId === tableId)
      .map((r) => ({
        slot_start: new Date(r.slotStart).toISOString(),
        slot_end: new Date(r.slotEnd).toISOString(),
      }));
    return NextResponse.json({ bookedSlots: slots });
  }

  const dayStart = new Date(`${date}T00:00:00+05:30`).toISOString();
  const dayEnd = new Date(`${date}T23:59:59+05:30`).toISOString();

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("reservations")
    .select("slot_start, slot_end")
    .eq("table_id", tableId)
    .in("status", ["confirmed", "seated"])
    .gte("slot_end", dayStart)
    .lte("slot_start", dayEnd);

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch table availability." },
      { status: 500 }
    );
  }

  return NextResponse.json({ bookedSlots: data ?? [] });
}

/**
 * POST /api/reservations
 * Checks for overlapping active slots for the selected `table_id` and returns
 * `409 Conflict` if already booked (backed by PostgreSQL `btree_gist` exclusion constraint).
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ReservationInput;

    const tableId = body.tableId?.trim();
    const customerName = body.customerName?.trim();
    const customerPhone = body.customerPhone?.trim();
    const guestCount = Number(body.guestCount);
    const slotStart = body.slotStart ? new Date(body.slotStart) : null;
    const slotEnd = body.slotEnd ? new Date(body.slotEnd) : null;

    if (!tableId || !customerName || !customerPhone) {
      return NextResponse.json(
        { error: "Table, guest name, and phone number are required." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 20) {
      return NextResponse.json(
        { error: "Guest count must be a valid positive number." },
        { status: 400 }
      );
    }

    if (
      !slotStart ||
      !slotEnd ||
      Number.isNaN(slotStart.getTime()) ||
      Number.isNaN(slotEnd.getTime()) ||
      slotEnd <= slotStart
    ) {
      return NextResponse.json(
        { error: "Invalid reservation time slot." },
        { status: 400 }
      );
    }

    // Preview fallback with real overlap enforcement in memory
    if (!hasLiveSupabaseServiceEnv()) {
      const table = FALLBACK_TABLES.find((t) => t.id === tableId);
      if (!table) {
        return NextResponse.json(
          { error: "Selected table does not exist." },
          { status: 404 }
        );
      }
      if (guestCount > table.capacity) {
        return NextResponse.json(
          {
            error: `${table.name} seats up to ${table.capacity} guests.`,
          },
          { status: 400 }
        );
      }

      const startMs = slotStart.getTime();
      const endMs = slotEnd.getTime();
      const overlap = previewReservations.some(
        (r) => r.tableId === tableId && r.slotStart < endMs && r.slotEnd > startMs
      );

      if (overlap) {
        return NextResponse.json(
          {
            error: `${table.name} is already booked during this time slot. Please pick another time or table.`,
          },
          { status: 409 }
        );
      }

      const id = `res_${crypto.randomUUID()}`;
      previewReservations.push({ id, tableId, slotStart: startMs, slotEnd: endMs });
      return NextResponse.json(
        {
          demoMode: true,
          reservation: {
            id,
            table_id: tableId,
            customer_name: customerName,
            guest_count: guestCount,
            slot_start: slotStart.toISOString(),
            slot_end: slotEnd.toISOString(),
            status: "confirmed",
          },
        },
        { status: 201 }
      );
    }

    // --- LIVE PRODUCTION PATH: Supabase Overlap Check + Atomic GIST Constraint ---
    const supabase = createSupabaseServiceClient();

    // 1. Validate table & capacity
    const { data: table, error: tableErr } = await supabase
      .from("cafe_tables")
      .select("id, name, capacity")
      .eq("id", tableId)
      .single();

    if (tableErr || !table) {
      return NextResponse.json(
        { error: "Selected cafe table not found." },
        { status: 404 }
      );
    }

    if (guestCount > table.capacity) {
      return NextResponse.json(
        {
          error: `${table.name} seats up to ${table.capacity} guests.`,
        },
        { status: 400 }
      );
    }

    // 2. Explicit overlap query before insert (slot_start < reqEnd AND slot_end > reqStart)
    const { data: overlapping, error: overlapErr } = await supabase
      .from("reservations")
      .select("id")
      .eq("table_id", tableId)
      .in("status", ["confirmed", "seated"])
      .lt("slot_start", slotEnd.toISOString())
      .gt("slot_end", slotStart.toISOString())
      .limit(1);

    if (overlapErr) {
      return NextResponse.json(
        { error: "Could not verify table availability." },
        { status: 500 }
      );
    }

    if (overlapping && overlapping.length > 0) {
      return NextResponse.json(
        {
          error: `${table.name} is already booked for this time slot. Please choose another time or table.`,
        },
        { status: 409 }
      );
    }

    // 3. Atomic insert (also protected by PostgreSQL exclusion constraint `23P01`)
    const { data: created, error: insertErr } = await supabase
      .from("reservations")
      .insert({
        table_id: tableId,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: body.customerEmail?.trim() || null,
        guest_count: guestCount,
        slot_start: slotStart.toISOString(),
        slot_end: slotEnd.toISOString(),
        special_requests: body.specialRequests?.trim() || null,
        status: "confirmed",
      })
      .select("*")
      .single();

    if (insertErr) {
      // PostgreSQL exclusion_violation (23P01) catches simultaneous double-booking race
      if (insertErr.code === "23P01") {
        return NextResponse.json(
          {
            error: `${table.name} was just reserved by another guest. Please select another slot.`,
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Failed to save reservation." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { demoMode: false, reservation: created },
      { status: 201 }
    );
  } catch (err) {
    console.error("Reservations API error:", err);
    return NextResponse.json(
      { error: "Unexpected error creating reservation." },
      { status: 500 }
    );
  }
}
