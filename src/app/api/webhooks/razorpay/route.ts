import { NextResponse } from "next/server";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

interface RazorpayWebhookEvent {
  event: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        status?: string;
      };
    };
    order?: {
      entity?: {
        id?: string;
      };
    };
  };
}

/**
 * POST /api/webhooks/razorpay
 * Authoritative Razorpay Webhook Handler.
 * 1. Reads raw request body text before parsing.
 * 2. Verifies `x-razorpay-signature` via timing-safe HMAC SHA256.
 * 3. Idempotently updates `orders.payment_status` to `paid` or `failed`.
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") ?? "";

    if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
      return NextResponse.json(
        { error: "Invalid Razorpay webhook signature." },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody) as RazorpayWebhookEvent;
    const paymentEntity = event.payload?.payment?.entity;
    const razorpayOrderId =
      paymentEntity?.order_id ?? event.payload?.order?.entity?.id;
    const razorpayPaymentId = paymentEntity?.id ?? null;

    if (!razorpayOrderId) {
      return NextResponse.json({ received: true, ignored: true });
    }

    const supabase = createSupabaseServiceClient();

    if (event.event === "payment.captured" || event.event === "order.paid") {
      const { error } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          ...(razorpayPaymentId
            ? { razorpay_payment_id: razorpayPaymentId }
            : {}),
        })
        .eq("razorpay_order_id", razorpayOrderId);

      if (error) {
        console.error("Webhook DB update error (paid):", error);
        return NextResponse.json(
          { error: "Failed to persist paid order status." },
          { status: 500 }
        );
      }
    } else if (event.event === "payment.failed") {
      await supabase
        .from("orders")
        .update({
          payment_status: "failed",
          ...(razorpayPaymentId
            ? { razorpay_payment_id: razorpayPaymentId }
            : {}),
        })
        .eq("razorpay_order_id", razorpayOrderId)
        .neq("payment_status", "paid");
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Razorpay webhook handler error:", err);
    return NextResponse.json(
      { error: "Malformed webhook payload." },
      { status: 400 }
    );
  }
}
