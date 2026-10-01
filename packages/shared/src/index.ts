import { z } from "zod";
import { joinInterests } from "./chamber-content";
export { chamberContent, chamberSettings, joinInterests } from "./chamber-content";
export const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9]{10,15}$/, "Enter a valid mobile number");
export const password = z.string().min(8, "Use at least 8 characters").max(72);
export const loginSchema = z.object({
  identifier: z.string().trim().min(3),
  password: z.string().min(1).max(72),
});
export const signupSchema = z.object({
    name: z.string().trim().min(1).max(160),
    email: z
      .string()
      .email()
      .transform((v) => v.toLowerCase()),
    mobile: phone,
    companyName: z.string().max(160).default(""),
    designation: z.string().max(120).default(""),
    businessActivities: z.string().trim().max(1000).default(""),
    city: z.string().trim().min(1).max(120),
  });
export const bookingSchema = z.object({
  eventId: z.string().min(1),
  fullName: z.string().trim().min(2).max(160),
  email: z
    .string()
    .email()
    .transform((v) => v.toLowerCase()),
  mobile: phone,
  companyName: z.string().min(1).max(160),
  designation: z.string().max(120).default(""),
  address: z.string().max(500).default(""),
  attendees: z.coerce.number().int().min(1).max(20),
  gstNumber: z.string().max(30).default(""),
  note: z.string().max(1000).default(""),
});
export const enquirySchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  email: z.string().email(),
  mobile: phone,
  company: z.string().max(160).default(""),
  designation: z.string().max(120).default(""),
  city: z.string().min(2).max(120),
  state: z.string().max(120).default(""),
  subject: z.string().min(3).max(200),
  message: z.string().min(10).max(5000),
  businessActivities: z.string().max(1000).default(""),
  industrialSectors: z.string().max(500).default(""),
  specificInterest: z.string().max(1000).default(""),
  yearOfRegistration: z.string().regex(/^(\d{4})?$/, "Enter a four-digit year").refine((year) => !year || (Number(year) >= 1800 && Number(year) <= new Date().getFullYear()), "Enter a valid registration year").default(""),
  interests: z.array(z.enum(joinInterests)).max(joinInterests.length).default([]),
});
export function money(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(paise / 100);
}
export function totals(amount: number, gstPercentage: number) {
  const gstAmount = Math.round((amount * gstPercentage) / 100);
  return { amount, gstAmount, totalAmount: amount + gstAmount };
}
export function date(value: string | Date) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
