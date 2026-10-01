import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http.js";
export function validSignature(
  body: string | Buffer,
  signature: string,
  secret: string,
) {
  if (!secret || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(body).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}
export type GatewayPayment = {
  id: string;
  order_id: string;
  status: string;
  amount: number;
  currency: string;
};
export interface PaymentGateway {
  createOrder(
    amount: number,
    receipt: string,
  ): Promise<{ id: string; amount: number; currency: string }>;
  getPayment(id: string): Promise<GatewayPayment>;
}
async function request<T>(path: string, body?: unknown): Promise<T> {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET)
    throw new HttpError(503, "Payment gateway not configured");
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    console.error("[API] Razorpay request failed", response.status);
    throw new HttpError(502, "Payment provider unavailable. Please try again.");
  }
  return response.json() as Promise<T>;
}
export const gateway: PaymentGateway = {
  createOrder: (amount, receipt) =>
    request("orders", { amount, currency: "INR", receipt }),
  getPayment: (id) => request(`payments/${encodeURIComponent(id)}`),
};
