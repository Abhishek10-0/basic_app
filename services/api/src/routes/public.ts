import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { enquirySchema, password } from "@sme/shared";
import { db } from "../config/db.js";
import { ok, HttpError } from "../utils/http.js";
import { authenticate, userOnly } from "../middleware/auth.js";
import { publicUser } from "./auth.js";
import { expireHolds } from "../services/payments.js";
export const publicRoutes = Router();
publicRoutes.get("/membership-plans", async (_req, res) =>
  ok(
    res,
    await db.membershipPlan.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
    }),
  ),
);
publicRoutes.get("/membership-plans/:slug", async (req, res) => {
  const p = await db.membershipPlan.findFirst({
    where: { slug: String(req.params.slug), active: true },
  });
  if (!p) throw new HttpError(404, "Plan not found");
  ok(res, p);
});
publicRoutes.get("/events", async (req, res) => {
  const q = String(req.query.q ?? "").slice(0, 100);
  ok(
    res,
    await db.event.findMany({
      where: {
        published: true,
        status: "PUBLISHED",
        endDate:
          req.query.period === "past"
            ? { lt: new Date() }
            : { gte: new Date() },
        ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
      },
      orderBy: { startDate: "asc" },
      take: 100,
    }),
  );
});
publicRoutes.get("/events/:slug", async (req, res) => {
  const e = await db.event.findFirst({
    where: {
      slug: String(req.params.slug),
      published: true,
      status: "PUBLISHED",
    },
    include: { gallery: true, speakers: true },
  });
  if (!e) throw new HttpError(404, "Event not found");
  ok(res, e);
});
publicRoutes.get("/news", async (_req, res) =>
  ok(
    res,
    await db.news.findMany({
      where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
      orderBy: { publishedAt: "desc" },
      take: 100,
    }),
  ),
);
publicRoutes.get("/news/:slug", async (req, res) => {
  const n = await db.news.findFirst({
    where: {
      slug: String(req.params.slug),
      status: "PUBLISHED",
      publishedAt: { lte: new Date() },
    },
  });
  if (!n) throw new HttpError(404, "Article not found");
  ok(res, n);
});
publicRoutes.get("/settings", async (_req, res) =>
  ok(
    res,
    (await db.appSetting.findUnique({ where: { key: "organization" } }))
      ?.value ?? {},
  ),
);
publicRoutes.post("/enquiries", async (req, res) => {
  const { firstName, lastName, ...data } = enquirySchema.parse(req.body);
  const enquiry = await db.enquiry.create({
    data: {
      ...data,
      name: `${firstName} ${lastName}`,
    },
  });
  ok(
    res,
    { id: enquiry.id },
    "Enquiry submitted. Our team will contact you.",
    201,
  );
});
publicRoutes.get("/gallery", async (_req, res) => {
  const images = await db.eventGallery.findMany({
    where: { event: { published: true, status: "PUBLISHED" } },
    include: { event: { select: { title: true } } },
    take: 100,
  });
  ok(
    res,
    images.map((g) => ({ url: g.url, title: g.event.title })),
  );
});
export const account = Router();
account.use(authenticate, userOnly);
account.get("/users/me", async (req, res) =>
  ok(
    res,
    await db.user.findUnique({
      where: { id: req.auth!.id },
      select: publicUser,
    }),
  ),
);
account.patch("/users/me", async (req, res) => {
  const data = z
    .object({
      firstName: z.string().min(1).max(80),
      lastName: z.string().min(1).max(80),
      companyName: z.string().max(160),
      designation: z.string().max(120),
      address: z.string().max(500),
      photo: z.union([z.string().url(), z.literal("")]).optional(),
    })
    .parse(req.body);
  ok(
    res,
    await db.user.update({
      where: { id: req.auth!.id },
      data,
      select: publicUser,
    }),
  );
});
account.post("/users/change-password", async (req, res) => {
  const data = z
    .object({ currentPassword: z.string(), password })
    .parse(req.body);
  const user = await db.user.findUniqueOrThrow({ where: { id: req.auth!.id } });
  if (!(await bcrypt.compare(data.currentPassword, user.passwordHash)))
    throw new HttpError(400, "Current password is incorrect");
  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(data.password, 12) },
    }),
    db.refreshToken.updateMany({
      where: { userId: user.id },
      data: { revokedAt: new Date() },
    }),
  ]);
  ok(res, null, "Password changed. Log in again.");
});
account.get("/memberships", async (req, res) => {
  await expireHolds();
  ok(
    res,
    await db.userMembership.findMany({
      where: { userId: req.auth!.id },
      include: {
        plan: true,
        payment: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            invoiceNumber: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  );
});
account.get("/event-bookings", async (req, res) => {
  const user = await db.user.findUniqueOrThrow({ where: { id: req.auth!.id } });
  ok(
    res,
    await db.eventBooking.findMany({
      where: {
        OR: [
          { userId: user.id },
          ...(user.emailVerified ? [{ email: user.email }] : []),
        ],
      },
      include: { event: true },
      orderBy: { createdAt: "desc" },
    }),
  );
});
account.get("/payments", async (req, res) =>
  ok(
    res,
    await db.payment.findMany({
      where: { userId: req.auth!.id },
      select: {
        id: true,
        type: true,
        totalAmount: true,
        gstAmount: true,
        amount: true,
        status: true,
        invoiceNumber: true,
        razorpayPaymentId: true,
        createdAt: true,
        billingName: true,
        billingCompany: true,
        gstNumber: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ),
);
account.get("/notifications", async (req, res) =>
  ok(
    res,
    await db.notification.findMany({
      where: { userId: req.auth!.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ),
);
account.patch("/notifications/:id/read", async (req, res) => {
  await db.notification.updateMany({
    where: { id: String(req.params.id), userId: req.auth!.id },
    data: { readAt: new Date() },
  });
  ok(res, null);
});
account.post("/notifications/push-token", async (req, res) => {
  const { token } = z
    .object({
      token: z.string().regex(/^(ExponentPushToken|ExpoPushToken)\[.+\]$/),
    })
    .parse(req.body);
  await db.pushToken.upsert({
    where: { token },
    update: { userId: req.auth!.id },
    create: { token, userId: req.auth!.id },
  });
  ok(res, null);
});
