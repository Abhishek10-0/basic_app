import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { loginSchema, signupSchema, password, phone } from "@sme/shared";
import { createHmac, randomInt } from "node:crypto";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import {
  normaliseMobile,
  sendSmsOTP,
  SmsGatewayError,
} from "../services/sms.js";
import { db } from "../config/db.js";
import { env } from "../config/env.js";
import { ok, HttpError } from "../utils/http.js";
import { issue, rotate, opaque, hash } from "../services/tokens.js";
import { authenticate, userOnly } from "../middleware/auth.js";
import { template } from "../emails/templates.js";
export const publicUser = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  mobile: true,
  companyName: true,
  designation: true,
  address: true,
  photo: true,
  emailVerified: true,
  mobileVerified: true,
  businessActivities: true,
  city: true,
} as const;
export const auth = Router();
const otpHash = (mobile: string, code: string, purpose: string) =>
  createHmac("sha256", env.JWT_ACCESS_SECRET)
    .update(`${purpose}:${mobile}:${code}`)
    .digest("hex");
const mobileVariants = (mobile: string) => {
  const normalised = normaliseMobile(mobile);
  return [
    ...new Set([
      normalised,
      "+" + normalised,
      ...(normalised.startsWith("91") && normalised.length === 12
        ? [normalised.slice(2), "+" + normalised.slice(2)]
        : []),
    ]),
  ];
};
const otpSchema = z.object({
  mobile: phone,
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit OTP"),
});
async function countOtpAttempt(mobile: string, purpose: string) {
  const attempted = await db.signupOtp.updateMany({
    where: {
      mobile,
      purpose,
      expiresAt: { gt: new Date() },
      attempts: { lt: 5 },
    },
    data: { attempts: { increment: 1 } },
  });
  if (!attempted.count)
    throw new HttpError(
      400,
      "OTP expired or attempt limit reached. Request a new OTP.",
    );
}
auth.post(
  "/send-otp",
  rateLimit({
    windowMs: 15 * 60000,
    limit: 5,
    skipFailedRequests: true,
    keyGenerator: (req) => {
      const mobile = String(req.body?.mobile ?? "");
      return mobile ? normaliseMobile(mobile) : ipKeyGenerator(req.ip ?? "");
    },
    message: {
      success: false,
      message: "Too many OTP requests. Please try again later.",
    },
  }),
  async (req, res) => {
    const input = z
      .object({
        mobile: phone,
        purpose: z.enum(["signup", "login"]).default("signup"),
      })
      .parse(req.body);
    const mobile = normaliseMobile(input.mobile);
    const users = await db.user.findMany({
      where: { mobile: { in: mobileVariants(mobile) } },
      select: { id: true, disabled: true },
    });
    if (input.purpose === "login" && (users.length !== 1 || users[0].disabled))
      throw new HttpError(
        400,
        "Unable to log in with this mobile number. Create an account if you have not registered.",
      );
    if (input.purpose === "signup" && users.length)
      throw new HttpError(
        409,
        "This mobile number is already registered. Please log in.",
      );
    await db.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${mobile}))`;
        const previous = await tx.signupOtp.findUnique({ where: { mobile } });
        if (previous && Date.now() - previous.sentAt.getTime() < 60000)
          throw new HttpError(
            429,
            "Wait 60 seconds before requesting another OTP",
          );
        const code = randomInt(100000, 1000000).toString();
        try {
          await sendSmsOTP(mobile, code);
        } catch (error) {
          console.error(
            "[API] SMS delivery failed",
            error instanceof SmsGatewayError
              ? error.reason
              : "unexpected_error",
          );
          throw new HttpError(502, "Unable to send OTP. Please try again.");
        }
        const data = {
          tokenHash: otpHash(mobile, code, input.purpose),
          purpose: input.purpose,
          attempts: 0,
          sentAt: new Date(),
          expiresAt: new Date(Date.now() + 5 * 60000),
        };
        await tx.signupOtp.upsert({
          where: { mobile },
          create: { mobile, ...data },
          update: data,
        });
      },
      { timeout: 15000 },
    );
    ok(res, null, "OTP sent. It expires in 5 minutes.");
  },
);
auth.post("/signup", async (req, res) => {
  const data = signupSchema.parse(req.body);
  const { otp } = z
    .object({ otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit OTP") })
    .parse(req.body);
  const mobile = normaliseMobile(data.mobile);
  await countOtpAttempt(mobile, "signup");
  const { name, ...fields } = data;
  const [firstName, ...rest] = name.split(/\s+/);
  const lastName = rest.join(" ");
  const passwordHash = await bcrypt.hash(opaque(), 12);
  const user = await db.$transaction(async (tx) => {
    const used = await tx.signupOtp.deleteMany({
      where: {
        mobile,
        tokenHash: otpHash(mobile, otp, "signup"),
        purpose: "signup",
        attempts: { lte: 5 },
        expiresAt: { gt: new Date() },
      },
    });
    if (!used.count) throw new HttpError(400, "Invalid or expired OTP");
    return tx.user.create({
      data: {
        ...fields,
        mobile,
        firstName,
        lastName,
        passwordHash,
        mobileVerified: true,
      },
      select: publicUser,
    });
  });
  const session = await issue(user.id, "user");
  ok(res, { ...session, user }, "Account created", 201);
});
auth.post("/login", async (req, res) => {
  const input = otpSchema.parse(req.body);
  const mobile = normaliseMobile(input.mobile);
  await countOtpAttempt(mobile, "login");
  const user = await db.$transaction(async (tx) => {
    const used = await tx.signupOtp.deleteMany({
      where: {
        mobile,
        purpose: "login",
        tokenHash: otpHash(mobile, input.otp, "login"),
        expiresAt: { gt: new Date() },
        attempts: { lte: 5 },
      },
    });
    if (!used.count) throw new HttpError(400, "Invalid or expired OTP");
    const users = await tx.user.findMany({
      where: { mobile: { in: mobileVariants(mobile) } },
      select: { id: true, disabled: true },
    });
    if (users.length !== 1 || users[0].disabled)
      throw new HttpError(401, "Unable to log in with this mobile number");
    return tx.user.update({
      where: { id: users[0].id },
      data: { mobileVerified: true },
      select: publicUser,
    });
  });
  ok(res, { ...(await issue(user.id, "user")), user });
});
auth.post("/refresh", async (req, res) =>
  ok(
    res,
    await rotate(
      z.object({ refreshToken: z.string() }).parse(req.body).refreshToken,
      "user",
    ),
  ),
);
auth.post("/logout", async (req, res) => {
  const { refreshToken } = z
    .object({ refreshToken: z.string() })
    .parse(req.body);
  await db.refreshToken.updateMany({
    where: { tokenHash: hash(refreshToken) },
    data: { revokedAt: new Date() },
  });
  ok(res, null, "Logged out");
});
auth.post("/forgot-password", async (req, res) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (user) {
    const token = opaque();
    await db.verificationToken.create({
      data: {
        userId: user.id,
        purpose: "reset",
        tokenHash: hash(token),
        expiresAt: new Date(Date.now() + 1800000),
      },
    });
    await db.emailJob.create({
      data: {
        dedupeKey: `reset:${hash(token)}`,
        to: user.email,
        subject: "Reset your password",
        html: template(
          "Reset password",
          {
            "Reset link": `${env.USER_APP_WEB_ORIGIN}/auth/reset-password?token=${token}`,
            Expires: "30 minutes",
          },
          `${env.API_PUBLIC_URL}/assets/logo.png`,
        ),
      },
    });
  }
  ok(res, null, "If this account exists, a reset link will be emailed.");
});
auth.post("/reset-password", async (req, res) => {
  const data = z.object({ token: z.string(), password }).parse(req.body);
  const token = await db.verificationToken.findUnique({
    where: { tokenHash: hash(data.token) },
  });
  if (!token || token.purpose !== "reset" || token.expiresAt < new Date())
    throw new HttpError(400, "Invalid or expired reset link");
  const passwordHash = await bcrypt.hash(data.password, 12);
  await db.$transaction(async (tx) => {
    const used = await tx.verificationToken.deleteMany({
      where: { id: token.id },
    });
    if (!used.count) throw new HttpError(400, "Link already used");
    await tx.user.update({
      where: { id: token.userId },
      data: { passwordHash },
    });
    await tx.refreshToken.updateMany({
      where: { userId: token.userId },
      data: { revokedAt: new Date() },
    });
  });
  ok(res, null, "Password reset. Please log in.");
});
auth.post("/send-verification", authenticate, userOnly, async (req, res) => {
  const user = await db.user.findUniqueOrThrow({ where: { id: req.auth!.id } });
  const token = opaque();
  await db.verificationToken.create({
    data: {
      userId: user.id,
      purpose: "email",
      tokenHash: hash(token),
      expiresAt: new Date(Date.now() + 86400000),
    },
  });
  await db.emailJob.create({
    data: {
      dedupeKey: `verify:${hash(token)}`,
      to: user.email,
      subject: "Verify your email",
      html: template(
        "Verify email",
        {
          "Verification link": `${env.USER_APP_WEB_ORIGIN}/auth/verify-email?token=${token}`,
        },
        `${env.API_PUBLIC_URL}/assets/logo.png`,
      ),
    },
  });
  ok(res, null, "Verification link queued");
});
auth.post("/verify-email", async (req, res) => {
  const { token: raw } = z.object({ token: z.string() }).parse(req.body);
  const token = await db.verificationToken.findUnique({
    where: { tokenHash: hash(raw) },
  });
  if (!token || token.purpose !== "email" || token.expiresAt < new Date())
    throw new HttpError(400, "Invalid verification link");
  await db.$transaction([
    db.user.update({
      where: { id: token.userId },
      data: { emailVerified: true },
    }),
    db.verificationToken.delete({ where: { id: token.id } }),
  ]);
  ok(res, null, "Email verified");
});
export const adminAuth = Router();
adminAuth.use((req, _res, next) => {
  if (
    req.headers.origin &&
    !env.CORS_ORIGINS.split(",").includes(req.headers.origin)
  )
    return next(new HttpError(403, "Origin not allowed"));
  next();
});
const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/api/v1/admin/auth",
  maxAge: 30 * 86400000,
};
adminAuth.post("/login", async (req, res) => {
  const { identifier, password: pw } = loginSchema.parse(req.body);
  const admin = await db.admin.findFirst({
    where: {
      OR: [{ email: identifier.toLowerCase() }, { mobile: identifier }],
    },
  });
  if (
    !admin ||
    admin.disabled ||
    !(await bcrypt.compare(pw, admin.passwordHash))
  )
    throw new HttpError(401, "Invalid administrator credentials");
  const session = await issue(admin.id, "admin");
  res.cookie("sme_admin_refresh", session.refreshToken, cookieOptions);
  ok(res, {
    accessToken: session.accessToken,
    admin: { id: admin.id, name: admin.name, role: admin.role },
  });
});
adminAuth.post("/refresh", async (req, res) => {
  const token = z.string().parse(req.cookies.sme_admin_refresh);
  const session = await rotate(token, "admin");
  res.cookie("sme_admin_refresh", session.refreshToken, cookieOptions);
  ok(res, { accessToken: session.accessToken });
});
adminAuth.post("/logout", async (req, res) => {
  if (req.cookies.sme_admin_refresh)
    await db.refreshToken.updateMany({
      where: { tokenHash: hash(req.cookies.sme_admin_refresh) },
      data: { revokedAt: new Date() },
    });
  res.clearCookie("sme_admin_refresh", cookieOptions);
  ok(res, null);
});
