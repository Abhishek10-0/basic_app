import { z } from "zod";
const text = z.string().trim().max(20000);
const amount = z.coerce.number().int().min(0).max(100000000);
const url = z.union([
  z
    .string()
    .url()
    .refine((v) => /^https?:\/\//.test(v), "Use an HTTP URL"),
  z.literal(""),
]);
export const planSchema = z.object({
  title: text.min(3),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  shortDescription: text.min(5),
  fullDescription: text.default(""),
  durationMonths: z.coerce.number().int().min(1).max(120),
  originalPrice: amount.nullable().optional(),
  price: amount.min(1),
  gstPercentage: z.coerce.number().min(0).max(100),
  benefits: z.array(z.string().min(1).max(300)).min(1),
  eligibility: text.default(""),
  termsAndConditions: text.default(""),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
});
export const eventSchema = z
  .object({
    title: text.min(3),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    shortDescription: text.min(5),
    description: text.default(""),
    bannerImage: url.default(""),
    eventUrl: url.default(""),
    venue: text.min(2),
    address: text.default(""),
    city: text.default(""),
    state: text.default(""),
    country: text.default("India"),
    googleMapsUrl: url.default(""),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    startTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .default("09:00"),
    endTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .default("17:00"),
    eventType: text.default("Conference"),
    paid: z.boolean(),
    price: amount,
    gstPercentage: z.coerce.number().min(0).max(100),
    availableSeats: z.coerce.number().int().min(1).max(100000),
    registrationDeadline: z.coerce.date(),
    organizerName: text.default("SME Chamber of India"),
    organizerEmail: z.union([z.string().email(), z.literal("")]).default(""),
    organizerPhone: text.default(""),
    contactPerson: text.default(""),
    agenda: text.default(""),
    terms: text.default(""),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
    published: z.boolean(),
    featured: z.boolean().default(false),
    speakers: z
      .array(
        z.object({
          name: text.min(1),
          designation: text.default(""),
          photo: url.default(""),
        }),
      )
      .default([]),
    gallery: z.array(z.object({ url })).default([]),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: "End date must follow start date",
    path: ["endDate"],
  })
  .refine((v) => v.registrationDeadline <= v.startDate, {
    message: "Deadline must precede event",
    path: ["registrationDeadline"],
  })
  .refine((v) => !v.paid || v.price > 0, {
    message: "Paid events need a positive price",
    path: ["price"],
  });
export const newsSchema = z.object({
  title: text.min(3),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  excerpt: text.min(5),
  content: text.min(10),
  featuredImage: url.default(""),
  category: text.default("News"),
  publishedAt: z.coerce.date(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});
export const settingsSchema = z.object({
  organizationName: text.min(3),
  logo: url.default(""),
  favicon: url.default(""),
  email: z.string().email(),
  phone: text,
  whatsapp: text.default(""),
  address: text,
  website: url.default(""),
  socialLinks: text.default(""),
  copyright: text.default(""),
  senderName: text.default("SME Chamber of India"),
  supportEmail: z.string().email(),
  heroTitle: text,
  heroSubtitle: text,
  banner: url.default(""),
  welcomeContent: text,
  aboutContent: text,
  servicesContent: text,
  activitiesContent: text,
});
