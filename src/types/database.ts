// =============================================================================
// Database & Domain Types — Ember & Bean Roastery
// Currency values are stored strictly as integer INR paise (₹250 = 25000).
// =============================================================================

export type HeroDrinkId = "espresso" | "iced-latte" | "matcha";

export type TableZone = "indoor" | "patio" | "bar";

export type ReservationStatus = "confirmed" | "cancelled" | "seated";

export type FulfillmentType = "pickup" | "delivery" | "dine_in";

export type PaymentStatus = "pending" | "paid" | "failed";

export type OrderStatus = "new" | "preparing" | "ready" | "completed";

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon_3d_model: string | null;
  sort_order: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  label: string;
  price_paise: number;
  texture_override_url: string | null;
  color_hex: string | null;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string;
  model_3d_url: string | null;
  is_featured_3d: boolean;
  in_stock: boolean;
  is_veg: boolean;
  is_iced: boolean;
  allergens: string[];
  tasting_notes: string[];
  created_at: string;
}

export interface ProductWithVariants extends Product {
  category?: Category | null;
  product_variants: ProductVariant[];
}

export interface CameraPosition3D {
  position: [number, number, number];
  target: [number, number, number];
}

export interface CafeTable {
  id: string;
  name: string;
  zone: TableZone;
  capacity: number;
  description: string | null;
  preview_3d_camera_pos: CameraPosition3D | null;
}

export interface Reservation {
  id: string;
  table_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  guest_count: number;
  slot_start: string;
  slot_end: string;
  special_requests: string | null;
  status: ReservationStatus;
  created_at: string;
  cafe_tables?: CafeTable | null;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  fulfillment_type: FulfillmentType;
  delivery_address: string | null;
  total_paise: number;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  created_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  variant_id: string;
  quantity: number;
  unit_price_paise: number;
  customizations: Record<string, string> | null;
}

export interface CartItem {
  /** Deterministic line key combining variantId + sorted customizations */
  lineKey: string;
  productId: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  imageUrl: string;
  isVeg: boolean;
  /** Display-only price in paise; server re-fetches authoritative DB price at checkout */
  pricePaise: number;
  qty: number;
  customizations?: Record<string, string>;
}

/**
 * Formats an integer INR paise amount into a clean ₹ currency string.
 * Example: 28000 -> "₹280", 24950 -> "₹249.50"
 */
export function formatPaiseToINR(paise: number): string {
  const rupees = paise / 100;
  const hasDecimals = paise % 100 !== 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  }).format(rupees);
}

/**
 * Generates a stable cart line key for a variant + optional customization map.
 */
export function buildCartLineKey(
  variantId: string,
  customizations?: Record<string, string>
): string {
  if (!customizations || Object.keys(customizations).length === 0) {
    return variantId;
  }
  const normalized = Object.entries(customizations)
    .filter(([, value]) => value.trim().length > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v.trim()}`)
    .join("|");
  return normalized ? `${variantId}__${normalized}` : variantId;
}
