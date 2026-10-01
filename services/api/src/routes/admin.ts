import { Router } from "express";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "../config/db.js";
import { env } from "../config/env.js";
import { authenticate, roles } from "../middleware/auth.js";
import { ok, HttpError } from "../utils/http.js";
import { publicUser } from "./auth.js";
import {
  planSchema,
  eventSchema,
  newsSchema,
  settingsSchema,
} from "../validators/admin.js";
import { addMonths, expireHolds, serial } from "../services/payments.js";
import { dispatchCampaign } from "../services/push.js";
export const admin = Router();
admin.use(authenticate, roles("SUPER_ADMIN", "ADMIN", "EDITOR"));
const manager = roles("SUPER_ADMIN", "ADMIN");
const audit = (
  adminId: string,
  action: string,
  resource: string,
  resourceId: string,
) =>
  db.adminActivityLog.create({
    data: { adminId, action, resource, resourceId },
  });
admin.get("/me", async (req, res) =>
  ok(
    res,
    await db.admin.findUnique({
      where: { id: req.auth!.id },
      select: { id: true, name: true, email: true, role: true },
    }),
  ),
);
admin.get("/dashboard", manager, async (_req, res) => {
  await expireHolds();
  const [
    users,
    activeMemberships,
    expiredMemberships,
    events,
    bookings,
    pendingEnquiries,
    membershipRevenue,
    eventRevenue,
    latestPayments,
  ] = await Promise.all([
    db.user.count(),
    db.userMembership.count({ where: { status: "ACTIVE" } }),
    db.userMembership.count({ where: { status: "EXPIRED" } }),
    db.event.count(),
    db.eventBooking.count(),
    db.enquiry.count({ where: { status: "NEW" } }),
    db.payment.aggregate({
      where: { status: "PAID", type: "MEMBERSHIP" },
      _sum: { totalAmount: true },
    }),
    db.payment.aggregate({
      where: { status: "PAID", type: "EVENT" },
      _sum: { totalAmount: true },
    }),
    db.payment.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        billingName: true,
        type: true,
        totalAmount: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);
  ok(res, {
    users,
    activeMemberships,
    expiredMemberships,
    events,
    bookings,
    pendingEnquiries,
    membershipRevenue: membershipRevenue._sum.totalAmount ?? 0,
    eventRevenue: eventRevenue._sum.totalAmount ?? 0,
    latestPayments,
  });
});
const resources = [
  "users",
  "membership-plans",
  "memberships",
  "events",
  "event-bookings",
  "payments",
  "news",
  "notifications",
  "enquiries",
  "media",
  "admins",
  "logs",
] as const;
type Resource = (typeof resources)[number];
const content = new Set(["events", "news", "media"]);
admin.get("/:resource", async (req, res, next) => {
  const resource = String(req.params.resource) as Resource;
  if (!resources.includes(resource)) return next();
  if (req.auth!.role === "EDITOR" && !content.has(resource))
    throw new HttpError(403, "Manager access required");
  const page = Math.max(1, Number(req.query.page) || 1),
    pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 15));
  const q = String(req.query.q ?? "").slice(0, 100);
  const status = String(req.query.status ?? "");
  const contains = { contains: q, mode: "insensitive" as const };
  const orderBy = {
    createdAt: req.query.sort === "asc" ? ("asc" as const) : ("desc" as const),
  };
  const args = { skip: (page - 1) * pageSize, take: pageSize, orderBy };
  let items: unknown[] = [];
  let total = 0;
  const dateFilter =
    req.query.from || req.query.to
      ? {
          createdAt: {
            ...(req.query.from
              ? { gte: z.coerce.date().parse(req.query.from) }
              : {}),
            ...(req.query.to
              ? { lte: z.coerce.date().parse(req.query.to) }
              : {}),
          },
        }
      : {};
  switch (resource) {
    case "users": {
      const where: Prisma.UserWhereInput = {
        ...dateFilter,
        OR: [
          { firstName: contains },
          { lastName: contains },
          { email: contains },
          { mobile: contains },
          { companyName: contains },
        ],
      };
      [items, total] = await Promise.all([
        db.user.findMany({
          ...args,
          where,
          select: { ...publicUser, disabled: true, createdAt: true },
        }),
        db.user.count({ where }),
      ]);
      break;
    }
    case "membership-plans": {
      const where = { title: contains };
      [items, total] = await Promise.all([
        db.membershipPlan.findMany({ ...args, where }),
        db.membershipPlan.count({ where }),
      ]);
      break;
    }
    case "events": {
      const where: Prisma.EventWhereInput = {
        ...dateFilter,
        title: contains,
        ...(status
          ? { status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).parse(status) }
          : { status: { not: "ARCHIVED" } }),
      };
      [items, total] = await Promise.all([
        db.event.findMany({ ...args, where }),
        db.event.count({ where }),
      ]);
      break;
    }
    case "news": {
      const where: Prisma.NewsWhereInput = {
        title: contains,
        ...(status
          ? { status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).parse(status) }
          : {}),
      };
      [items, total] = await Promise.all([
        db.news.findMany({ ...args, where }),
        db.news.count({ where }),
      ]);
      break;
    }
    case "memberships": {
      const where: Prisma.UserMembershipWhereInput = {
        ...dateFilter,
        ...(status
          ? {
              status: z
                .enum(["PENDING", "ACTIVE", "EXPIRED", "CANCELLED", "FAILED"])
                .parse(status),
            }
          : {}),
        ...(req.query.planId ? { planId: String(req.query.planId) } : {}),
        user: { OR: [{ email: contains }, { firstName: contains }] },
      };
      [items, total] = await Promise.all([
        db.userMembership.findMany({
          ...args,
          where,
          include: { user: { select: publicUser }, plan: true, payment: true },
        }),
        db.userMembership.count({ where }),
      ]);
      break;
    }
    case "event-bookings": {
      const where: Prisma.EventBookingWhereInput = {
        ...dateFilter,
        OR: [
          { fullName: contains },
          { email: contains },
          { reference: contains },
        ],
        ...(status
          ? {
              status: z
                .enum([
                  "PAYMENT_PENDING",
                  "CONFIRMED",
                  "CANCELLED",
                  "FAILED",
                  "ATTENDED",
                ])
                .parse(status),
            }
          : {}),
        ...(req.query.eventId ? { eventId: String(req.query.eventId) } : {}),
      };
      [items, total] = await Promise.all([
        db.eventBooking.findMany({
          ...args,
          where,
          include: { event: true, payment: true },
        }),
        db.eventBooking.count({ where }),
      ]);
      break;
    }
    case "payments": {
      const where: Prisma.PaymentWhereInput = {
        ...dateFilter,
        billingName: contains,
        ...(status
          ? {
              status: z
                .enum(["CREATED", "PENDING", "PAID", "FAILED", "REFUNDED"])
                .parse(status),
            }
          : {}),
        ...(req.query.type
          ? { type: z.enum(["MEMBERSHIP", "EVENT"]).parse(req.query.type) }
          : {}),
      };
      [items, total] = await Promise.all([
        db.payment.findMany({
          ...args,
          where,
          omit: { razorpaySignature: true, gatewayResponse: true },
        }),
        db.payment.count({ where }),
      ]);
      break;
    }
    case "enquiries": {
      const where: Prisma.EnquiryWhereInput = {
        name: contains,
        ...(status
          ? { status: z.enum(["NEW", "CONTACTED", "CLOSED"]).parse(status) }
          : {}),
      };
      [items, total] = await Promise.all([
        db.enquiry.findMany({ ...args, where }),
        db.enquiry.count({ where }),
      ]);
      break;
    }
    case "notifications":
      [items, total] = await Promise.all([
        db.pushCampaign.findMany({ ...args, where: { title: contains } }),
        db.pushCampaign.count({ where: { title: contains } }),
      ]);
      break;
    case "media":
      [items, total] = await Promise.all([
        db.media.findMany({ ...args, where: { filename: contains } }),
        db.media.count({ where: { filename: contains } }),
      ]);
      break;
    case "admins":
      if (req.auth!.role !== "SUPER_ADMIN")
        throw new HttpError(403, "Super admin required");
      [items, total] = await Promise.all([
        db.admin.findMany({
          ...args,
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            role: true,
            disabled: true,
            createdAt: true,
          },
        }),
        db.admin.count(),
      ]);
      break;
    case "logs":
      [items, total] = await Promise.all([
        db.adminActivityLog.findMany({
          ...args,
          include: { admin: { select: { name: true } } },
        }),
        db.adminActivityLog.count(),
      ]);
      break;
  }
  ok(res, { items, total, page, pageSize });
});
admin.get("/settings", manager, async (_req, res) =>
  ok(res, {
    ...(((await db.appSetting.findUnique({ where: { key: "organization" } }))
      ?.value as object) ?? {}),
    paymentEnabled: !!env.RAZORPAY_KEY_ID,
    emailEnabled: env.MAIL_DELIVERY_ENABLED,
    mediaMode: env.MEDIA_MODE,
  }),
);
admin.put("/settings", manager, async (req, res) => {
  const value = settingsSchema.parse(req.body);
  await db.appSetting.upsert({
    where: { key: "organization" },
    update: { value },
    create: { key: "organization", value },
  });
  await audit(req.auth!.id, "UPDATE", "settings", "organization");
  ok(res, value);
});
for (const resource of ["membership-plans", "events", "news"] as const) {
  admin.get(`/${resource}/:id`, async (req, res) => {
    if (resource === "membership-plans" && req.auth!.role === "EDITOR")
      throw new HttpError(403, "Manager access required");
    const id = String(req.params.id);
    const row =
      resource === "events"
        ? await db.event.findUnique({
            where: { id },
            include: { speakers: true, gallery: true },
          })
        : resource === "news"
          ? await db.news.findUnique({ where: { id } })
          : await db.membershipPlan.findUnique({ where: { id } });
    if (!row) throw new HttpError(404, "Record not found");
    ok(res, row);
  });
  for (const method of ["post", "put"] as const) {
    admin[method](
      `/${resource}${method === "put" ? "/:id" : ""}`,
      async (req, res) => {
        if (resource === "membership-plans" && req.auth!.role === "EDITOR")
          throw new HttpError(403, "Manager access required");
        const id = String(
          ("id" in req.params ? req.params.id : undefined) ?? "",
        );
        let row: { id: string };
        if (resource === "membership-plans") {
          const data = planSchema.parse(req.body);
          row =
            method === "post"
              ? await db.membershipPlan.create({ data })
              : await db.membershipPlan.update({ where: { id }, data });
        } else if (resource === "news") {
          const data = newsSchema.parse(req.body);
          row =
            method === "post"
              ? await db.news.create({ data })
              : await db.news.update({ where: { id }, data });
        } else {
          const { speakers, gallery, ...data } = eventSchema.parse(req.body);
          if (!data.paid) data.price = 0;
          data.published = data.status === "PUBLISHED" && data.published;
          row = await serial(async (tx) => {
            if (method === "put") {
              const existing = await tx.event.findUniqueOrThrow({
                where: { id },
              });
              if (data.availableSeats < existing.reservedSeats)
                throw new HttpError(
                  409,
                  "Capacity cannot be below reserved seats",
                );
              return tx.event.update({
                where: { id },
                data: {
                  ...data,
                  speakers: { deleteMany: {}, create: speakers },
                  gallery: { deleteMany: {}, create: gallery },
                },
              });
            }
            return tx.event.create({
              data: {
                ...data,
                speakers: { create: speakers },
                gallery: { create: gallery },
              },
            });
          });
        }
        await audit(
          req.auth!.id,
          method === "post" ? "CREATE" : "UPDATE",
          resource,
          row.id,
        );
        ok(res, row);
      },
    );
  }
  admin.delete(`/${resource}/:id`, manager, async (req, res) => {
    const id = String(req.params.id);
    if (resource === "events") {
      const bookings = await db.eventBooking.count({ where: { eventId: id } });
      if (bookings)
        await db.event.update({
          where: { id },
          data: { published: false, status: "ARCHIVED" },
        });
      else await db.event.delete({ where: { id } });
    } else if (resource === "membership-plans")
      await db.membershipPlan.update({
        where: { id },
        data: { active: false },
      });
    else await db.news.update({ where: { id }, data: { status: "ARCHIVED" } });
    await audit(
      req.auth!.id,
      resource === "events" ? "DELETE" : "ARCHIVE",
      resource,
      id,
    );
    ok(res, null, resource === "events" ? "Deleted" : "Archived");
  });
}
admin.post("/memberships/manual", manager, async (req, res) => {
  const { userId, planId } = z
    .object({ userId: z.string(), planId: z.string() })
    .parse(req.body);
  const plan = await db.membershipPlan.findUniqueOrThrow({
    where: { id: planId },
  });
  const startDate = new Date();
  const row = await db.userMembership.create({
    data: {
      userId,
      planId,
      planTitle: plan.title,
      durationMonths: plan.durationMonths,
      status: "ACTIVE",
      startDate,
      endDate: addMonths(startDate, plan.durationMonths),
    },
  });
  await audit(req.auth!.id, "MANUAL_ACTIVATION", "memberships", row.id);
  ok(res, row);
});
admin.patch("/memberships/:id", manager, async (req, res) => {
  const data = z
    .object({
      action: z.enum(["cancel", "extend"]),
      months: z.coerce.number().int().min(1).max(120).optional(),
    })
    .parse(req.body);
  const id = String(req.params.id);
  const member = await db.userMembership.findUniqueOrThrow({ where: { id } });
  if (data.action === "extend" && !member.endDate)
    throw new HttpError(409, "Only activated memberships can be extended");
  const row = await db.userMembership.update({
    where: { id },
    data:
      data.action === "cancel"
        ? { status: "CANCELLED" }
        : {
            status: "ACTIVE",
            endDate: addMonths(
              member.endDate! > new Date() ? member.endDate! : new Date(),
              data.months ?? 1,
            ),
          },
  });
  await audit(req.auth!.id, data.action, "memberships", id);
  ok(res, row);
});
admin.patch("/event-bookings/:id", manager, async (req, res) => {
  const id = String(req.params.id);
  const { status } = z
    .object({ status: z.enum(["ATTENDED", "CANCELLED"]) })
    .parse(req.body);
  await serial(async (tx) => {
    const b = await tx.eventBooking.findUniqueOrThrow({ where: { id } });
    if (status === "ATTENDED" && b.status !== "CONFIRMED")
      throw new HttpError(
        409,
        "Only confirmed bookings can be marked attended",
      );
    if (
      status === "CANCELLED" &&
      ["CONFIRMED", "PAYMENT_PENDING", "ATTENDED"].includes(b.status)
    )
      await tx.event.update({
        where: { id: b.eventId },
        data: { reservedSeats: { decrement: b.attendees } },
      });
    await tx.eventBooking.update({ where: { id }, data: { status } });
  });
  await audit(req.auth!.id, status, "event-bookings", id);
  ok(res, null);
});
admin.patch("/enquiries/:id", manager, async (req, res) => {
  const { status } = z
    .object({ status: z.enum(["NEW", "CONTACTED", "CLOSED"]) })
    .parse(req.body);
  const id = String(req.params.id);
  ok(res, await db.enquiry.update({ where: { id }, data: { status } }));
  await audit(req.auth!.id, status, "enquiries", id);
});
admin.patch("/users/:id", manager, async (req, res) => {
  const { disabled } = z.object({ disabled: z.boolean() }).parse(req.body);
  const id = String(req.params.id);
  ok(
    res,
    await db.user.update({
      where: { id },
      data: { disabled },
      select: publicUser,
    }),
  );
  await audit(req.auth!.id, disabled ? "DISABLE" : "ENABLE", "users", id);
});
admin.post("/notifications", manager, async (req, res) => {
  const data = z
    .object({
      title: z.string().trim().min(3).max(200),
      message: z.string().trim().min(5).max(2000),
      deepLink: z
        .string()
        .trim()
        .regex(
          /^\/(?!\/)[a-zA-Z0-9_./?=&%#-]*$/,
          "Use an in-app path beginning with /",
        )
        .or(z.literal(""))
        .default(""),
      imageUrl: z
        .string()
        .url()
        .refine(
          (v) => v.startsWith("https://"),
          "Image must use a public HTTPS URL",
        )
        .or(z.literal(""))
        .default(""),
      scheduledFor: z.string().datetime().or(z.literal("")).default(""),
    })
    .parse(req.body);
  const scheduledFor = data.scheduledFor ? new Date(data.scheduledFor) : null;
  const campaign = await db.$transaction(async (tx) => {
    const row = await tx.pushCampaign.create({
      data: {
        title: data.title,
        message: data.message,
        deepLink: data.deepLink,
        imageUrl: data.imageUrl,
        scheduledFor,
      },
    });
    const users = await tx.user.findMany({
      where: { disabled: false },
      select: { id: true },
    });
    for (let offset = 0; offset < users.length; offset += 1000) {
      await tx.notification.createMany({
        data: users.slice(offset, offset + 1000).map((user) => ({
          userId: user.id,
          title: data.title,
          message: data.message,
          deepLink: data.deepLink,
          imageUrl: data.imageUrl,
          campaignId: row.id,
        })),
      });
    }
    return row;
  });
  await audit(req.auth!.id, "BROADCAST", "notifications", "all");
  if (!scheduledFor || scheduledFor <= new Date())
    void dispatchCampaign(campaign.id).catch(() =>
      console.error("[API] Push dispatch failed", campaign.id),
    );
  ok(
    res,
    { id: campaign.id, scheduledFor },
    scheduledFor ? "Broadcast scheduled" : "Broadcast queued",
  );
});
admin.post("/admins", roles("SUPER_ADMIN"), async (req, res) => {
  const { password, ...data } = z
    .object({
      name: z.string().min(2),
      email: z.string().email(),
      mobile: z.string().regex(/^\+?\d{10,15}$/),
      password: z.string().min(12).max(72),
      role: z.enum(["ADMIN", "EDITOR", "SUPER_ADMIN"]),
    })
    .parse(req.body);
  const row = await db.admin.create({
    data: { ...data, passwordHash: await bcrypt.hash(password, 12) },
    select: { id: true, name: true, email: true, role: true },
  });
  await audit(req.auth!.id, "CREATE", "admins", row.id);
  ok(res, row);
});
admin.get("/event-bookings/export/csv", manager, async (req, res) => {
  const rows = await db.eventBooking.findMany({
    where: req.query.eventId ? { eventId: String(req.query.eventId) } : {},
    include: { event: true, payment: true },
    take: 10000,
    orderBy: { createdAt: "desc" },
  });
  const csv = (v: unknown) =>
    '"' +
    String(v ?? "")
      .replace(/^[=+@\-\t\r]/, "'$&")
      .replace(/"/g, '""') +
    '"';
  res
    .type("text/csv")
    .attachment("event-bookings.csv")
    .send(
      [
        [
          "Reference",
          "Event",
          "Name",
          "Email",
          "Mobile",
          "Company",
          "Attendees",
          "Booking status",
          "Payment status",
          "Amount paise",
          "Date",
        ],
        ...rows.map((r) => [
          r.reference,
          r.event.title,
          r.fullName,
          r.email,
          r.mobile,
          r.companyName,
          r.attendees,
          r.status,
          r.payment?.status,
          r.payment?.totalAmount ?? 0,
          r.createdAt.toISOString(),
        ]),
      ]
        .map((r) => r.map(csv).join(","))
        .join("\r\n"),
    );
});

admin.get("/:resource/:id", manager, async (req, res) => {
  const id = String(req.params.id);
  let row: unknown;
  switch (String(req.params.resource)) {
    case "users":
      row = await db.user.findUnique({
        where: { id },
        select: { ...publicUser, disabled: true, createdAt: true },
      });
      break;
    case "memberships":
      row = await db.userMembership.findUnique({
        where: { id },
        include: {
          user: { select: publicUser },
          plan: true,
          payment: { omit: { razorpaySignature: true, gatewayResponse: true } },
        },
      });
      break;
    case "event-bookings":
      row = await db.eventBooking.findUnique({
        where: { id },
        include: {
          event: true,
          payment: { omit: { razorpaySignature: true, gatewayResponse: true } },
        },
      });
      break;
    case "enquiries":
      row = await db.enquiry.findUnique({ where: { id } });
      break;
    case "payments":
      row = await db.payment.findUnique({
        where: { id },
        omit: { razorpaySignature: true, gatewayResponse: true },
      });
      break;
    default:
      throw new HttpError(404, "Resource not found");
  }
  if (!row) throw new HttpError(404, "Record not found");
  ok(res, row);
});
