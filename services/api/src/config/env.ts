import dotenv from "dotenv";
import { z } from "zod";
dotenv.config({ quiet: true });
if (process.env.NODE_ENV === "test")
  dotenv.config({ path: ".env.test", override: true, quiet: true });
const boolean = z
  .enum(["true", "false"])
  .default("false")
  .transform((v) => v === "true");
export const env = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().default(4000),
    SMS_GATEWAY_URL: z
      .string()
      .url()
      .default("http://103.211.202.40/sendsms/bulksms_v2.php"),
    SMS_API_KEY: z.string().default(""),
    SMS_ENTITY_ID: z.string().default(""),
    SMS_SENDER_ID: z.string().default(""),
    SMS_SENDER_ID_MARATHI_BUSINESS_FORUM: z.string().default(""),
    DATABASE_URL: z.string().min(1),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
    RAZORPAY_KEY_ID: z.string().default(""),
    RAZORPAY_KEY_SECRET: z.string().default(""),
    RAZORPAY_WEBHOOK_SECRET: z.string().default(""),
    SMTP_HOST: z.string().default(""),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_SECURE: boolean,
    SMTP_USER: z.string().default(""),
    SMTP_PASS: z.string().default(""),
    SMTP_FROM_NAME: z.string().default("SME Chamber of India"),
    SMTP_FROM_EMAIL: z.string().default(""),
    ADMIN_CC: z.string().default(""),
    MAIL_DELIVERY_ENABLED: boolean,
    ADMIN_WEB_URL: z.string().url(),
    API_PUBLIC_URL: z.string().url(),
    USER_APP_WEB_ORIGIN: z.string().url(),
    CORS_ORIGINS: z.string(),
    MEDIA_SERVER_URL: z.string().url(),
    MEDIA_SERVER_SECRET: z.string(),
    MEDIA_UPLOAD_PATH: z.string().default("/api/upload"),
    MEDIA_MODE: z.enum(["local", "remote"]).default("local"),
    PUSH_DELIVERY_ENABLED: boolean.default("true"),
    ADMIN_PHONE: z.string().default(""),
    ADMIN_PASSWORD: z.string().min(6),
    SEED_ADMIN_NAME: z.string(),
    SEED_ADMIN_EMAIL: z.string().email(),
    SEED_ADMIN_PASSWORD: z.string().min(6),
  })
  .parse(process.env);
if (env.NODE_ENV === "production" && env.ADMIN_PASSWORD.length < 6) {
  throw new Error("Production ADMIN_PASSWORD must have at least 6 characters");
}
