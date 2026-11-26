import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCatalogData } from "@/lib/catalog";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";
import type { Order, Reservation } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Owner Admin Dashboard",
};

const DEMO_ORDERS: Order[] = [
  {
    id: "eb84f920-demo-order-1",
    customer_name: "Rohan Kapoor",
    customer_phone: "+91 98450 11223",
    fulfillment_type: "pickup",
    delivery_address: null,
    total_paise: 87500,
    razorpay_order_id: "order_demo_1",
    razorpay_payment_id: "pay_demo_1",
    payment_status: "paid",
    order_status: "preparing",
    created_at: new Date().toISOString(),
  },
  {
    id: "eb91a311-demo-order-2",
    customer_name: "Meera Nair",
    customer_phone: "+91 99001 44556",
    fulfillment_type: "dine_in",
    delivery_address: null,
    total_paise: 54000,
    razorpay_order_id: "order_demo_2",
    razorpay_payment_id: "pay_demo_2",
    payment_status: "paid",
    order_status: "new",
    created_at: new Date().toISOString(),
  },
];

const DEMO_RESERVATIONS: Reservation[] = [
  {
    id: "res-demo-1",
    table_id: "table-window-1",
    customer_name: "Vikramaditya Sen",
    customer_phone: "+91 98802 77889",
    customer_email: null,
    guest_count: 3,
    slot_start: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    slot_end: new Date(Date.now() + 150 * 60 * 1000).toISOString(),
    special_requests: "Corner window booth preferred",
    status: "confirmed",
    created_at: new Date().toISOString(),
    cafe_tables: {
      id: "table-window-1",
      name: "Window Booth 1",
      zone: "indoor",
      capacity: 4,
      description: null,
      preview_3d_camera_pos: null,
    },
  },
];

export default async function AdminPage() {
  const { products, isLiveDb } = await getCatalogData();

  if (!isLiveDb) {
    return (
      <AdminDashboardClient
        initialOrders={DEMO_ORDERS}
        initialProducts={products}
        initialReservations={DEMO_RESERVATIONS}
        isLiveDb={false}
        adminEmail={null}
      />
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const [{ data: userData }, { data: orders }, { data: reservations }] =
      await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("reservations")
          .select("*, cafe_tables(*)")
          .order("slot_start", { ascending: true })
          .limit(50),
      ]);

    return (
      <AdminDashboardClient
        initialOrders={(orders ?? []) as Order[]}
        initialProducts={products}
        initialReservations={(reservations ?? []) as Reservation[]}
        isLiveDb={true}
        adminEmail={userData.user?.email ?? null}
      />
    );
  } catch {
    return (
      <AdminDashboardClient
        initialOrders={DEMO_ORDERS}
        initialProducts={products}
        initialReservations={DEMO_RESERVATIONS}
        isLiveDb={false}
        adminEmail={null}
      />
    );
  }
}
