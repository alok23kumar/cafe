import crypto from "crypto";
import Razorpay from "razorpay";

let razorpayInstance: Razorpay | null = null;

/**
 * Lazy-initialized Razorpay Node SDK client (server-only).
 */
export function getRazorpayClient(): Razorpay {
  if (razorpayInstance) return razorpayInstance;

  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Missing NEXT_PUBLIC_RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET environment variables."
    );
  }

  razorpayInstance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  return razorpayInstance;
}

/**
 * Timing-safe HMAC SHA256 verification for incoming Razorpay webhook payloads.
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  receivedSignature: string
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !receivedSignature) return false;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const expectedBuf = Buffer.from(expectedSignature, "utf8");
  const receivedBuf = Buffer.from(receivedSignature, "utf8");

  if (expectedBuf.length !== receivedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

/**
 * Timing-safe HMAC SHA256 verification for Razorpay Checkout client callback
 * (order_id + "|" + payment_id signed with RAZORPAY_KEY_SECRET).
 */
export function verifyRazorpayPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  receivedSignature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !receivedSignature) return false;

  const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  const expectedBuf = Buffer.from(expectedSignature, "utf8");
  const receivedBuf = Buffer.from(receivedSignature, "utf8");

  if (expectedBuf.length !== receivedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}
