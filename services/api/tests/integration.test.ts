import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createHmac, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { app } from "../src/app.js";
import { db } from "../src/config/db.js";
import { env } from "../src/config/env.js";
import { gateway, validSignature } from "../src/services/gateway.js";
import { addMonths } from "../src/services/payments.js";
import * as sms from "../src/services/sms.js";
const tag = "test-" + randomUUID().slice(0, 8);
const email = tag + "@example.test";
const phone =
  "9" +
  Math.floor(Math.random() * 1e9)
    .toString()
    .padStart(9, "0");
let access = "",
  refresh = "",
  userId = "",
  adminId = "",
  adminToken = "",
  eventId = "",
  paidEventId = "",
  planId = "",
  orderId = "",
  paymentId = "";
const bookingIds: string[] = [];
let orders = 0;
const tomorrow = new Date(Date.now() + 86400000),
  later = new Date(Date.now() + 172800000);
const form = () => ({
  eventId,
  fullName: "Test Guest",
  email,
  mobile: phone,
  companyName: "Test SME",
  designation: "Founder",
  address: "Mumbai",
  attendees: 1,
  gstNumber: "",
  note: "",
});
beforeAll(async () => {
  const admin = await db.admin.create({
    data: {
      name: tag,
      email: tag + "-admin@example.test",
      passwordHash: await bcrypt.hash("TestPassword123!", 4),
      role: "SUPER_ADMIN",
    },
  });
  adminId = admin.id;
  const result = await request(app)
    .post("/api/v1/admin/auth/login")
    .send({ identifier: admin.email, password: "TestPassword123!" });
  adminToken = result.body.data.accessToken;
  vi.spyOn(gateway, "createOrder").mockImplementation(async (amount) => ({
    id: `order_${tag.replaceAll("-", "")}${++orders}`,
    amount,
    currency: "INR",
  }));
}, 30000);
afterAll(async () => {
  vi.restoreAllMocks();
  const payments = await db.payment.findMany({
    where: { OR: [{ userId }, { billingEmail: email }] },
    select: { id: true },
  });
  const memberships = await db.userMembership.findMany({
    where: { userId },
    select: { id: true },
  });
  await db.emailJob.deleteMany({
    where: { to: { in: [email, tag + "-admin@example.test"] } },
  });
  await db.notification.deleteMany({ where: { userId } });
  await db.payment.deleteMany({
    where: { id: { in: payments.map((p) => p.id) } },
  });
  await db.userMembership.deleteMany({
    where: { id: { in: memberships.map((m) => m.id) } },
  });
  await db.eventBooking.deleteMany({ where: { email } });
  await db.event.deleteMany({ where: { id: { in: [eventId, paidEventId] } } });
  await db.membershipPlan.deleteMany({ where: { id: planId } });
  await db.adminActivityLog.deleteMany({ where: { adminId } });
  await db.admin.deleteMany({ where: { id: adminId } });
  await db.user.deleteMany({ where: { id: userId } });
  await db.$disconnect();
}, 30000);
describe.sequential("SME platform integration with PostgreSQL", () => {
  it("serves liveness and database readiness", async () => {
    expect((await request(app).get("/api/v1/health")).status).toBe(200);
    expect((await request(app).get("/api/v1/ready")).status).toBe(200);
  });
  it("requires login for membership purchases and admin access", async () => {
    expect(
      (
        await request(app)
          .post("/api/v1/payments/membership/order")
          .send({ planId: "none" })
      ).status,
    ).toBe(401);
    expect((await request(app).get("/api/v1/admin/users")).status).toBe(401);
  });
  it("validates signup and hashes the password", async () => {
    const bad = await request(app).post("/api/v1/auth/signup").send({ email });
    expect(bad.status).toBe(422);
    const sent = vi.spyOn(sms, "sendSmsOTP").mockResolvedValue();
    const otpResponse = await request(app)
      .post("/api/v1/auth/send-otp")
      .send({ mobile: phone });
    expect(otpResponse.status).toBe(200);
    const otp = sent.mock.calls.at(-1)![1];
    expect(
      (await request(app).post("/api/v1/auth/send-otp").send({ mobile: phone }))
        .status,
    ).toBe(429);
    const r = await request(app).post("/api/v1/auth/signup").send({
      otp,
      name: "Test Member",
      email,
      mobile: phone,
      city: "Mumbai",
    });
    expect(r.status).toBe(201);
    ({ accessToken: access, refreshToken: refresh } = r.body.data);
    userId = r.body.data.user.id;
    expect(r.body.data.user.passwordHash).toBeUndefined();
    const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user.passwordHash).toBeTruthy();
    expect(user.mobileVerified).toBe(true);
    expect(
      await db.signupOtp.findUnique({
        where: { mobile: sms.normaliseMobile(phone) },
      }),
    ).toBeNull();
  });
  it("supports mobile login and blocks users from admin routes", async () => {
    const sent = vi.spyOn(sms, "sendSmsOTP").mockResolvedValue();
    const otpResponse = await request(app)
      .post("/api/v1/auth/send-otp")
      .send({ mobile: phone, purpose: "login" });
    expect(otpResponse.status).toBe(200);
    const otp = sent.mock.calls.at(-1)![1];
    const r = await request(app)
      .post("/api/v1/auth/login")
      .send({ mobile: phone, otp });
    expect(r.status).toBe(200);
    expect(
      (
        await request(app)
          .get("/api/v1/admin/users")
          .auth(access, { type: "bearer" })
      ).status,
    ).toBe(403);
  });
  it("rotates refresh tokens once and rejects replay", async () => {
    const r = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: refresh });
    expect(r.status).toBe(200);
    expect(
      (
        await request(app)
          .post("/api/v1/auth/refresh")
          .send({ refreshToken: refresh })
      ).status,
    ).toBe(401);
    expect(
      (
        await request(app)
          .post("/api/v1/auth/refresh")
          .send({ refreshToken: r.body.data.refreshToken })
      ).status,
    ).toBe(401);
  });
  it("creates a dynamic membership plan through the admin API", async () => {
    const r = await request(app)
      .post("/api/v1/admin/membership-plans")
      .auth(adminToken, { type: "bearer" })
      .send({
        title: tag,
        slug: tag,
        shortDescription: "A test membership programme",
        durationMonths: 6,
        price: 10000,
        gstPercentage: 18,
        benefits: ["Networking"],
        active: true,
      });
    expect(r.status).toBe(200);
    planId = r.body.data.id;
    expect(
      (await request(app).get("/api/v1/membership-plans/" + tag)).body.data
        .durationMonths,
    ).toBe(6);
  });
  it("creates a published free event and reserves seats atomically without login", async () => {
    const r = await request(app)
      .post("/api/v1/admin/events")
      .auth(adminToken, { type: "bearer" })
      .send({
        title: tag,
        slug: tag,
        shortDescription: "Test programme",
        venue: "Test venue",
        city: "Mumbai",
        startDate: later,
        endDate: new Date(later.getTime() + 3600000),
        registrationDeadline: tomorrow,
        availableSeats: 1,
        paid: false,
        price: 0,
        gstPercentage: 18,
        status: "PUBLISHED",
        published: true,
      });
    expect(r.status).toBe(200);
    eventId = r.body.data.id;
    const results = await Promise.all([
      request(app).post("/api/v1/payments/event/order").send(form()),
      request(app).post("/api/v1/payments/event/order").send(form()),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    const success = results.find((r) => r.status === 201)!;
    expect(success.body.data.status).toBe("CONFIRMED");
    bookingIds.push(success.body.data.bookingId);
    expect(
      (await db.event.findUniqueOrThrow({ where: { id: eventId } }))
        .reservedSeats,
    ).toBe(1);
    expect(await db.emailJob.count({ where: { to: email } })).toBe(1);
  });
  it("does not reveal guest bookings to an unverified matching email", async () => {
    const r = await request(app)
      .get("/api/v1/event-bookings")
      .auth(access, { type: "bearer" });
    expect(r.body.data).toHaveLength(0);
    await db.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });
    const verified = await request(app)
      .get("/api/v1/event-bookings")
      .auth(access, { type: "bearer" });
    expect(verified.body.data).toHaveLength(1);
  });
  it("prices orders on the server and keeps plan purchase snapshots", async () => {
    const r = await request(app)
      .post("/api/v1/payments/membership/order")
      .auth(access, { type: "bearer" })
      .send({ planId, amount: 1 });
    expect(r.status).toBe(200);
    expect(r.body.data.amount).toBe(11800);
    orderId = r.body.data.orderId;
    paymentId = r.body.data.paymentId;
    await db.membershipPlan.update({
      where: { id: planId },
      data: { durationMonths: 24, price: 99999 },
    });
    const p = await db.payment.findUniqueOrThrow({
      where: { id: paymentId },
      include: { membership: true },
    });
    expect(p.membership!.durationMonths).toBe(6);
  });
  it("rejects forged signatures and mismatched captured payment amounts", async () => {
    const id = "pay_testcaptured";
    const signature = createHmac("sha256", env.RAZORPAY_KEY_SECRET)
      .update(orderId + "|" + id)
      .digest("hex");
    expect(
      (
        await request(app)
          .post("/api/v1/payments/verify")
          .send({
            razorpay_order_id: orderId,
            razorpay_payment_id: id,
            razorpay_signature: "0".repeat(64),
          })
      ).status,
    ).toBe(400);
    vi.spyOn(gateway, "getPayment").mockResolvedValue({
      id,
      order_id: orderId,
      status: "captured",
      amount: 1,
      currency: "INR",
    });
    expect(
      (
        await request(app).post("/api/v1/payments/verify").send({
          razorpay_order_id: orderId,
          razorpay_payment_id: id,
          razorpay_signature: signature,
        })
      ).status,
    ).toBe(400);
  });
  it("activates membership exactly once across verify and webhook delivery", async () => {
    const id = "pay_testcaptured";
    vi.mocked(gateway.getPayment).mockResolvedValue({
      id,
      order_id: orderId,
      status: "captured",
      amount: 11800,
      currency: "INR",
    });
    const signature = createHmac("sha256", env.RAZORPAY_KEY_SECRET)
      .update(orderId + "|" + id)
      .digest("hex");
    expect(
      (
        await request(app).post("/api/v1/payments/verify").send({
          razorpay_order_id: orderId,
          razorpay_payment_id: id,
          razorpay_signature: signature,
        })
      ).status,
    ).toBe(200);
    const body = JSON.stringify({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id,
            order_id: orderId,
            status: "captured",
            amount: 11800,
            currency: "INR",
          },
        },
      },
    });
    const hmac = createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");
    expect(
      (
        await request(app)
          .post("/api/v1/payments/webhook")
          .set("Content-Type", "application/json")
          .set("x-razorpay-signature", hmac)
          .send(body)
      ).status,
    ).toBe(200);
    expect(
      await db.userMembership.count({ where: { userId, status: "ACTIVE" } }),
    ).toBe(1);
    expect(
      await db.emailJob.count({
        where: { dedupeKey: "confirmation:payment:" + paymentId },
      }),
    ).toBe(1);
  });
  it("keeps paid guest bookings pending until captured", async () => {
    const event = await db.event.create({
      data: {
        title: tag + " paid",
        slug: tag + "-paid",
        shortDescription: "Paid test",
        venue: "Test",
        city: "Mumbai",
        startDate: later,
        endDate: later,
        registrationDeadline: tomorrow,
        availableSeats: 3,
        paid: true,
        price: 5000,
        published: true,
        status: "PUBLISHED",
      },
    });
    paidEventId = event.id;
    const r = await request(app)
      .post("/api/v1/payments/event/order")
      .send({ ...form(), eventId: paidEventId, attendees: 2 });
    expect(r.status).toBe(201);
    expect(r.body.data.amount).toBe(11800);
    bookingIds.push(r.body.data.bookingId);
    expect(
      (
        await db.eventBooking.findUniqueOrThrow({
          where: { id: r.body.data.bookingId },
        })
      ).status,
    ).toBe("PAYMENT_PENDING");
    const id = "pay_testguest";
    vi.mocked(gateway.getPayment).mockResolvedValue({
      id,
      order_id: r.body.data.orderId,
      status: "captured",
      amount: 11800,
      currency: "INR",
    });
    const signature = createHmac("sha256", env.RAZORPAY_KEY_SECRET)
      .update(r.body.data.orderId + "|" + id)
      .digest("hex");
    expect(
      (
        await request(app).post("/api/v1/payments/verify").send({
          razorpay_order_id: r.body.data.orderId,
          razorpay_payment_id: id,
          razorpay_signature: signature,
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await db.eventBooking.findUniqueOrThrow({
          where: { id: r.body.data.bookingId },
        })
      ).status,
    ).toBe("CONFIRMED");
  });
  it("rejects overlong tokens and preserves calendar month-end dates", () => {
    expect(validSignature("test", "abc", "secret")).toBe(false);
    expect(addMonths(new Date("2026-01-31T12:00:00Z"), 1).toISOString()).toBe(
      "2026-02-28T12:00:00.000Z",
    );
  });
});
