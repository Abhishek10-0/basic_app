import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { z } from "zod";
import { bookingSchema, totals, money, date } from "@sme/shared";
import { db } from "../config/db.js";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http.js";
import { gateway, type GatewayPayment } from "./gateway.js";
import { template } from "../emails/templates.js";
import jwt from "jsonwebtoken";
export async function serial<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let i = 0; i < 4; i++) {
    try {
      return await db.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10000,
        timeout: 15000,
      });
    } catch (e) {
      if (
        !(e instanceof Prisma.PrismaClientKnownRequestError) ||
        !["P2034", "P2028"].includes(e.code) ||
        i === 3
      )
        throw e;
    }
  }
  throw new Error("Transaction retry exhausted");
}
export async function expireHolds() {
  await serial(async (tx) => {
    const expired = await tx.eventBooking.findMany({
      where: { status: "PAYMENT_PENDING", expiresAt: { lt: new Date() } },
    });
    for (const b of expired) {
      await tx.eventBooking.update({
        where: { id: b.id },
        data: { status: "CANCELLED" },
      });
      await tx.event.update({
        where: { id: b.eventId },
        data: { reservedSeats: { decrement: b.attendees } },
      });
    }
  });
  await db.userMembership.updateMany({
    where: { status: "ACTIVE", endDate: { lt: new Date() } },
    data: { status: "EXPIRED" },
  });
}
export async function bookEvent(data: z.infer<typeof bookingSchema>) {
  await expireHolds();
  const booking = await serial(async (tx) => {
    const event = await tx.event.findUnique({ where: { id: data.eventId } });
    if (!event || !event.published || event.status !== "PUBLISHED")
      throw new HttpError(404, "Event is not available");
    if (event.registrationDeadline < new Date() || event.startDate < new Date())
      throw new HttpError(409, "Registration has closed");
    const reserved = await tx.event.updateMany({
      where: {
        id: event.id,
        reservedSeats: { lte: event.availableSeats - data.attendees },
      },
      data: { reservedSeats: { increment: data.attendees } },
    });
    if (!reserved.count) throw new HttpError(409, "Not enough seats available");
    const booking = await tx.eventBooking.create({
      data: {
        ...data,
        reference: `SME-${randomUUID().slice(0, 8).toUpperCase()}`,
        status: event.paid ? "PAYMENT_PENDING" : "CONFIRMED",
        expiresAt: event.paid ? new Date(Date.now() + 30 * 60000) : null,
      },
    });
    if (event.paid) {
      await tx.payment.create({
        data: {
          type: "EVENT",
          eventBookingId: booking.id,
          ...totals(event.price * data.attendees, event.gstPercentage),
          billingName: data.fullName,
          billingEmail: data.email,
          billingMobile: data.mobile,
          billingCompany: data.companyName,
          gstNumber: data.gstNumber,
        },
      });
    } else
      await tx.emailJob.create({
        data: {
          dedupeKey: `confirmation:booking:${booking.id}`,
          to: data.email,
          subject: `Booking confirmed: ${event.title}`,
          html: template(
            "Event booking confirmed",
            {
              Event: event.title,
              "Booking ID": booking.reference,
              Name: data.fullName,
              Company: data.companyName,
              Date: date(event.startDate),
              Time: event.startTime,
              Venue: event.venue,
              Attendees: data.attendees,
              Amount: "Free",
              Contact: event.organizerEmail || env.SMTP_FROM_EMAIL,
            },
            `${env.API_PUBLIC_URL}/assets/logo.png`,
          ),
        },
      });
    return booking;
  });
  if (booking.status === "CONFIRMED")
    return {
      status: "CONFIRMED",
      reference: booking.reference,
      bookingId: booking.id,
    };
  const payment = await db.payment.findUniqueOrThrow({
    where: { eventBookingId: booking.id },
  });
  try {
    return {
      ...(await orderFor(payment.id)),
      reference: booking.reference,
      bookingId: booking.id,
    };
  } catch (e) {
    await serial(async (tx) => {
      const changed = await tx.eventBooking.updateMany({
        where: { id: booking.id, status: "PAYMENT_PENDING" },
        data: { status: "FAILED" },
      });
      if (changed.count)
        await tx.event.update({
          where: { id: booking.eventId },
          data: { reservedSeats: { decrement: booking.attendees } },
        });
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });
    });
    throw e;
  }
}
export async function membershipOrder(userId: string, planId: string) {
  const plan = await db.membershipPlan.findUnique({ where: { id: planId } });
  if (!plan || !plan.active)
    throw new HttpError(404, "Membership plan unavailable");
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const member = await db.userMembership.create({
    data: {
      userId,
      planId,
      planTitle: plan.title,
      durationMonths: plan.durationMonths,
      payment: {
        create: {
          type: "MEMBERSHIP",
          userId,
          ...totals(plan.price, plan.gstPercentage),
          billingName: `${user.firstName} ${user.lastName}`,
          billingEmail: user.email,
          billingMobile: user.mobile,
          billingCompany: user.companyName ?? "",
        },
      },
    },
    include: { payment: true },
  });
  try {
    return await orderFor(member.payment!.id);
  } catch (e) {
    await db.$transaction([
      db.payment.update({
        where: { id: member.payment!.id },
        data: { status: "FAILED" },
      }),
      db.userMembership.update({
        where: { id: member.id },
        data: { status: "FAILED" },
      }),
    ]);
    throw e;
  }
}
async function orderFor(paymentId: string) {
  const payment = await db.payment.findUniqueOrThrow({
    where: { id: paymentId },
  });
  const order = await gateway.createOrder(payment.totalAmount, payment.id);
  await db.payment.update({
    where: { id: payment.id },
    data: { razorpayOrderId: order.id, status: "PENDING" },
  });
  const ticket = jwt.sign({ paymentId }, env.JWT_ACCESS_SECRET, {
    expiresIn: "30m",
    audience: "sme-checkout",
    issuer: "sme-api",
  });
  return {
    paymentId,
    orderId: order.id,
    keyId: env.RAZORPAY_KEY_ID,
    amount: order.amount,
    currency: order.currency,
    checkoutUrl: `${env.API_PUBLIC_URL}/checkout?ticket=${encodeURIComponent(ticket)}`,
    statusUrl: `/payments/status?ticket=${encodeURIComponent(ticket)}`,
  };
}
export async function finalize(captured: GatewayPayment, signature?: string) {
  if (captured.status !== "captured")
    throw new HttpError(
      409,
      "Payment is awaiting capture. Confirmation will follow after capture.",
    );
  return serial(async (tx) => {
    const p = await tx.payment.findUnique({
      where: { razorpayOrderId: captured.order_id },
      include: { booking: { include: { event: true } }, membership: true },
    });
    if (
      !p ||
      p.totalAmount !== captured.amount ||
      p.currency !== captured.currency
    )
      throw new HttpError(400, "Payment amount or order does not match");
    if (p.status === "PAID")
      return {
        status: "PAID",
        paymentId: p.id,
        reference: p.booking?.reference ?? p.membershipId,
      };
    if (p.status === "REFUNDED")
      throw new HttpError(409, "Payment has been refunded");
    if (p.booking) {
      if (p.booking.status === "CANCELLED" || p.booking.status === "FAILED") {
        const reserved = await tx.event.updateMany({
          where: {
            id: p.booking.eventId,
            reservedSeats: {
              lte: p.booking.event.availableSeats - p.booking.attendees,
            },
          },
          data: { reservedSeats: { increment: p.booking.attendees } },
        });
        if (!reserved.count)
          throw new HttpError(
            409,
            "Late payment requires administrator reconciliation: seats are no longer available",
          );
      }
      await tx.eventBooking.update({
        where: { id: p.booking.id },
        data: { status: "CONFIRMED", expiresAt: null },
      });
    }
    let membershipDates: Record<string, string> = {};
    if (p.membership) {
      const previous = await tx.userMembership.findFirst({
        where: {
          userId: p.membership.userId,
          status: "ACTIVE",
          endDate: { gt: new Date() },
        },
        orderBy: { endDate: "desc" },
      });
      const start = previous?.endDate ?? new Date();
      const end = addMonths(start, p.membership.durationMonths);
      await tx.userMembership.update({
        where: { id: p.membership.id },
        data: { status: "ACTIVE", startDate: start, endDate: end },
      });
      membershipDates = {
        Plan: p.membership.planTitle,
        "Membership ID": p.membership.id,
        "Start date": date(start),
        "Expiry date": date(end),
      };
      await tx.notification.create({
        data: {
          userId: p.membership.userId,
          title: "Membership activated",
          message: `Your ${p.membership.planTitle} is confirmed.`,
          deepLink: "/my-membership",
        },
      });
    }
    await tx.payment.update({
      where: { id: p.id },
      data: {
        status: "PAID",
        razorpayPaymentId: captured.id,
        razorpaySignature: signature,
        invoiceNumber: `SME-${new Date().getFullYear()}-${p.id.toUpperCase()}`,
      },
    });
    await tx.emailJob.upsert({
      where: { dedupeKey: `confirmation:payment:${p.id}` },
      update: {},
      create: {
        dedupeKey: `confirmation:payment:${p.id}`,
        to: p.billingEmail,
        subject:
          p.type === "EVENT"
            ? "Event booking confirmed"
            : "Membership activated",
        html: template(
          "Payment confirmed",
          {
            Name: p.billingName,
            Company: p.billingCompany,
            ...membershipDates,
            ...(p.booking
              ? {
                  Event: p.booking.event.title,
                  "Booking ID": p.booking.reference,
                  Date: date(p.booking.event.startDate),
                  Time: p.booking.event.startTime,
                  Venue: p.booking.event.venue,
                }
              : {}),
            Amount: money(p.totalAmount),
            "Payment ID": captured.id,
            Contact: env.SMTP_FROM_EMAIL,
          },
          `${env.API_PUBLIC_URL}/assets/logo.png`,
        ),
      },
    });
    return {
      status: "PAID",
      paymentId: p.id,
      reference: p.booking?.reference ?? p.membershipId,
    };
  });
}
export function addMonths(start: Date, months: number) {
  const end = new Date(start);
  const day = end.getUTCDate();
  end.setUTCDate(1);
  end.setUTCMonth(end.getUTCMonth() + months);
  const last = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0),
  ).getUTCDate();
  end.setUTCDate(Math.min(day, last));
  return end;
}
