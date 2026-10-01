import { Router } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { bookingSchema } from "@sme/shared";
import { authenticate, userOnly } from "../middleware/auth.js";
import { env } from "../config/env.js";
import { db } from "../config/db.js";
import { ok, HttpError } from "../utils/http.js";
import { bookEvent, membershipOrder, finalize } from "../services/payments.js";
import { gateway, validSignature } from "../services/gateway.js";
import { escapeHtml } from "../emails/templates.js";
export const payments = Router();
payments.get("/status", async (req, res) => {
  let id: string;
  try {
    const payload = jwt.verify(
      String(req.query.ticket),
      env.JWT_ACCESS_SECRET,
      { algorithms: ["HS256"], issuer: "sme-api", audience: "sme-checkout" },
    ) as jwt.JwtPayload;
    id = payload.paymentId;
  } catch {
    throw new HttpError(401, "Checkout session expired");
  }
  const p = await db.payment.findUnique({
    where: { id },
    select: {
      status: true,
      membershipId: true,
      booking: { select: { reference: true } },
    },
  });
  if (!p) throw new HttpError(404, "Payment not found");
  ok(res, {
    status: p.status,
    reference: p.booking?.reference ?? p.membershipId,
  });
});

payments.post("/membership/order", authenticate, userOnly, async (req, res) =>
  ok(
    res,
    await membershipOrder(
      req.auth!.id,
      z.object({ planId: z.string() }).parse(req.body).planId,
    ),
  ),
);
payments.post("/event/order", async (req, res) =>
  ok(
    res,
    await bookEvent(bookingSchema.parse(req.body)),
    "Booking created",
    201,
  ),
);
payments.post("/verify", async (req, res) => {
  const data = z
    .object({
      razorpay_order_id: z.string().regex(/^order_[A-Za-z0-9]+$/),
      razorpay_payment_id: z.string().regex(/^pay_[A-Za-z0-9]+$/),
      razorpay_signature: z.string(),
    })
    .parse(req.body);
  const payment = await db.payment.findUnique({
    where: { razorpayOrderId: data.razorpay_order_id },
  });
  if (
    !payment ||
    !validSignature(
      `${payment.razorpayOrderId}|${data.razorpay_payment_id}`,
      data.razorpay_signature,
      env.RAZORPAY_KEY_SECRET,
    )
  )
    throw new HttpError(400, "Invalid payment signature");
  const captured = await gateway.getPayment(data.razorpay_payment_id);
  if (captured.order_id !== payment.razorpayOrderId)
    throw new HttpError(400, "Payment belongs to a different order");
  ok(res, await finalize(captured, data.razorpay_signature));
});
export const webhook = Router();
webhook.post("/", async (req, res) => {
  if (
    !validSignature(
      req.body as Buffer,
      String(req.headers["x-razorpay-signature"] ?? ""),
      env.RAZORPAY_WEBHOOK_SECRET,
    )
  )
    throw new HttpError(400, "Invalid webhook signature");
  const event = z
    .object({
      event: z.string(),
      payload: z.object({
        payment: z
          .object({
            entity: z.object({
              id: z.string(),
              order_id: z.string(),
              status: z.string(),
              amount: z.number(),
              currency: z.string(),
            }),
          })
          .optional(),
      }),
    })
    .parse(JSON.parse((req.body as Buffer).toString("utf8")));
  if (event.event === "payment.captured" && event.payload.payment)
    await finalize(await gateway.getPayment(event.payload.payment.entity.id));
  ok(res, null, "Webhook accepted");
});
export const checkout = Router();
checkout.get("/", async (req, res) => {
  let paymentId: string;
  try {
    const data = jwt.verify(String(req.query.ticket), env.JWT_ACCESS_SECRET, {
      algorithms: ["HS256"],
      issuer: "sme-api",
      audience: "sme-checkout",
    }) as jwt.JwtPayload;
    paymentId = data.paymentId;
  } catch {
    throw new HttpError(401, "Checkout link expired. Create a new order.");
  }
  const p = await db.payment.findUniqueOrThrow({ where: { id: paymentId } });
  const options = JSON.stringify({
    key: env.RAZORPAY_KEY_ID,
    order_id: p.razorpayOrderId,
    amount: p.totalAmount,
    currency: p.currency,
    name: "SME Chamber of India",
    description:
      p.type === "EVENT" ? "Event registration" : "Membership subscription",
    prefill: {
      name: p.billingName,
      email: p.billingEmail,
      contact: p.billingMobile,
    },
    theme: { color: "#123667" },
  }).replace(/</g, "\\u003c");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.razorpay.com; frame-src https://api.razorpay.com https://*.razorpay.com; connect-src 'self' https://*.razorpay.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;",
  );
  res
    .type("html")
    .send(
      `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>SME secure checkout</title><style>body{font:16px Arial;background:#f4f7fb;color:#123667;max-width:540px;margin:60px auto;padding:24px}button{background:#123667;color:white;padding:16px 24px;border:0;cursor:pointer}img{width:90px}</style></head><body><img src="/assets/logo.png" alt="SME Chamber"><h1>Secure checkout</h1><p>${escapeHtml(p.billingName)}</p><p id="status">Complete your payment. Keep this window open until verification finishes.</p><button id="pay">Pay securely</button><script src="https://checkout.razorpay.com/v1/checkout.js"></script><script>const b=document.getElementById('pay'),s=document.getElementById('status');b.onclick=()=>{b.disabled=true;const o=${options};o.modal={ondismiss:()=>{b.disabled=false;s.textContent='Payment cancelled. You may retry while this order is valid.'}};o.handler=async result=>{try{const r=await fetch('/api/v1/payments/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(result)});const j=await r.json();if(!r.ok)throw new Error(j.message);s.textContent='Payment verified. Your confirmation has been queued for email. You can close this window and return to the app.';b.hidden=true;}catch(e){s.textContent=e.message;}};new Razorpay(o).open();};</script></body></html>`,
    );
});
