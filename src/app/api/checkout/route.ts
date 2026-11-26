import crypto from "crypto";
import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getRazorpayClient } from "@/lib/razorpay";
import { FALLBACK_PRODUCTS } from "@/lib/catalog";
import type { FulfillmentType } from "@/types/database";

interface CheckoutItemInput {
  variantId: string;
  quantity: number;
  customizations?: Record<string, string> | null;
}

interface CheckoutRequestBody {
  customerName?: string;
  customerPhone?: string;
  fulfillmentType?: FulfillmentType;
  deliveryAddress?: string | null;
  items?: CheckoutItemInput[];
}

interface VariantRowWithProduct {
  id: string;
  label: string;
  price_paise: number;
  products: {
    id: string;
    name: string;
    in_stock: boolean;
  } | null;
}

function hasLiveCheckoutEnv(): boolean {
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supaService = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const rzpSecret = process.env.RAZORPAY_KEY_SECRET;
  return Boolean(
    supaUrl &&
      supaService &&
      rzpKey &&
      rzpSecret &&
      !supaUrl.includes("your-project-ref") &&
      !rzpKey.includes("xxxxxxxx")
  );
}

/**
 * POST /api/checkout
 * ZERO CLIENT TRUST:
 * Receives ONLY { variantId, quantity, customizations } + customer fulfillment info.
 * Fetches authoritative `price_paise` and `in_stock` strictly from Supabase,
 * computes total on the server, creates a Razorpay Order, and stores a pending order.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckoutRequestBody;

    const customerName = body.customerName?.trim();
    const customerPhone = body.customerPhone?.trim();
    const fulfillmentType = body.fulfillmentType;
    const deliveryAddress = body.deliveryAddress?.trim() || null;
    const items = Array.isArray(body.items) ? body.items : [];

    if (!customerName || !customerPhone) {
      return NextResponse.json(
        { error: "Customer name and phone number are required." },
        { status: 400 }
      );
    }

    if (
      !fulfillmentType ||
      !["pickup", "delivery", "dine_in"].includes(fulfillmentType)
    ) {
      return NextResponse.json(
        { error: "Invalid fulfillment type." },
        { status: 400 }
      );
    }

    if (fulfillmentType === "delivery" && !deliveryAddress) {
      return NextResponse.json(
        { error: "Delivery address is required for delivery orders." },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: "Cart must contain at least one item." },
        { status: 400 }
      );
    }

    for (const item of items) {
      if (
        !item.variantId ||
        typeof item.quantity !== "number" ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 50
      ) {
        return NextResponse.json(
          { error: "Invalid variant ID or quantity in cart." },
          { status: 400 }
        );
      }
    }

    // Preview fallback when live Supabase/Razorpay credentials are not yet set
    if (!hasLiveCheckoutEnv()) {
      const variantLookup = new Map<
        string,
        { pricePaise: number; inStock: boolean; productName: string }
      >();
      for (const prod of FALLBACK_PRODUCTS) {
        for (const v of prod.product_variants) {
          variantLookup.set(v.id, {
            pricePaise: v.price_paise,
            inStock: prod.in_stock,
            productName: prod.name,
          });
        }
      }

      let demoTotalPaise = 0;
      for (const item of items) {
        const record = variantLookup.get(item.variantId);
        if (!record) {
          return NextResponse.json(
            { error: `Unknown product variant: ${item.variantId}` },
            { status: 400 }
          );
        }
        if (!record.inStock) {
          return NextResponse.json(
            { error: `${record.productName} is currently sold out.` },
            { status: 409 }
          );
        }
        demoTotalPaise += record.pricePaise * item.quantity;
      }

      return NextResponse.json({
        demoMode: true,
        orderId: `demo_${crypto.randomUUID()}`,
        amountPaise: demoTotalPaise,
      });
    }

    // --- LIVE PRODUCTION PATH: Supabase Authoritative Pricing + Razorpay Order ---
    const supabase = createSupabaseServiceClient();
    const uniqueVariantIds = Array.from(new Set(items.map((i) => i.variantId)));

    const { data: variantRows, error: fetchError } = await supabase
      .from("product_variants")
      .select("id, label, price_paise, products(id, name, in_stock)")
      .in("id", uniqueVariantIds);

    if (fetchError || !variantRows) {
      return NextResponse.json(
        { error: "Failed to validate menu items against database." },
        { status: 500 }
      );
    }

    const variantMap = new Map<string, VariantRowWithProduct>();
    for (const row of variantRows as unknown as VariantRowWithProduct[]) {
      variantMap.set(row.id, row);
    }

    let totalPaise = 0;
    const verifiedOrderItems: Array<{
      variant_id: string;
      quantity: number;
      unit_price_paise: number;
      customizations: Record<string, string> | null;
    }> = [];

    for (const item of items) {
      const dbVariant = variantMap.get(item.variantId);
      if (!dbVariant || !dbVariant.products) {
        return NextResponse.json(
          { error: `Item variant "${item.variantId}" is no longer available.` },
          { status: 400 }
        );
      }

      if (!dbVariant.products.in_stock) {
        return NextResponse.json(
          {
            error: `"${dbVariant.products.name}" just sold out. Please remove it from your cart.`,
          },
          { status: 409 }
        );
      }

      totalPaise += dbVariant.price_paise * item.quantity;
      verifiedOrderItems.push({
        variant_id: dbVariant.id,
        quantity: item.quantity,
        unit_price_paise: dbVariant.price_paise,
        customizations: item.customizations ?? null,
      });
    }

    if (totalPaise <= 0) {
      return NextResponse.json(
        { error: "Calculated order total must be greater than zero." },
        { status: 400 }
      );
    }

    // Create Razorpay Order in INR paise
    const razorpay = getRazorpayClient();
    const receiptId = `eb_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const rzpOrder = await razorpay.orders.create({
      amount: totalPaise,
      currency: "INR",
      receipt: receiptId,
      notes: {
        customer_name: customerName,
        customer_phone: customerPhone,
        fulfillment_type: fulfillmentType,
      },
    });

    // Persist pending order in Supabase
    const { data: createdOrder, error: orderInsertError } = await supabase
      .from("orders")
      .insert({
        customer_name: customerName,
        customer_phone: customerPhone,
        fulfillment_type: fulfillmentType,
        delivery_address: deliveryAddress,
        total_paise: totalPaise,
        razorpay_order_id: rzpOrder.id,
        payment_status: "pending",
        order_status: "new",
      })
      .select("id")
      .single();

    if (orderInsertError || !createdOrder) {
      return NextResponse.json(
        { error: "Failed to record order in database." },
        { status: 500 }
      );
    }

    const { error: itemsInsertError } = await supabase
      .from("order_items")
      .insert(
        verifiedOrderItems.map((oi) => ({
          order_id: createdOrder.id,
          ...oi,
        }))
      );

    if (itemsInsertError) {
      return NextResponse.json(
        { error: "Failed to store order line items." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      demoMode: false,
      orderId: createdOrder.id,
      razorpayOrderId: rzpOrder.id,
      razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amountPaise: totalPaise,
    });
  } catch (err) {
    console.error("Checkout API error:", err);
    return NextResponse.json(
      { error: "Unexpected error during checkout initialization." },
      { status: 500 }
    );
  }
}
