import { NextResponse } from "next/server";
import { verifyRazorpayPaymentSignature } from "@/lib/razorpay";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

interface VerifyPaymentBody {
  orderId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}

/**
 * POST /api/orders/verify
 * Verifies the Razorpay Checkout JS callback signature via HMAC SHA256
 * so the customer gets immediate UI confirmation alongside the async webhook.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VerifyPaymentBody;
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
      body;

    if (
      !orderId ||
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return NextResponse.json(
        { error: "Missing required Razorpay verification fields." },
        { status: 400 }
      );
    }

    const isValid = verifyRazorpayPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid Razorpay payment signature." },
        { status: 401 }
      );
    }

    const supabase = createSupabaseServiceClient();
    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        razorpay_payment_id: razorpayPaymentId,
      })
      .eq("id", orderId)
      .eq("razorpay_order_id", razorpayOrderId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to update order status." },
        { status: 500 }
      );
    }

    return NextResponse.json({ verified: true, orderId });
  } catch (err) {
    console.error("Order verify error:", err);
    return NextResponse.json(
      { error: "Payment verification failed." },
      { status: 500 }
    );
  }
}
