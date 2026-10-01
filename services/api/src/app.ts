import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { env } from "./config/env.js";
import { db } from "./config/db.js";
import { auth, adminAuth } from "./routes/auth.js";
import { publicRoutes, account } from "./routes/public.js";
import { admin } from "./routes/admin.js";
import { payments, webhook, checkout } from "./routes/payments.js";
import { media } from "./routes/media.js";
import { HttpError } from "./utils/http.js";
export const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: (origin, cb) =>
      cb(null, !origin || env.CORS_ORIGINS.split(",").includes(origin)),
    credentials: true,
  }),
);
app.use((req, res, next) => {
  const start = Date.now();
  const requestPath = req.path;
  res.on("finish", () =>
    console.log(
      `[API] ${req.method} ${requestPath} ${res.statusCode} ${Date.now() - start}ms`,
    ),
  );
  next();
});
const limited = {
  success: false,
  message: "Too many requests. Please try again later.",
};
app.use("/api", rateLimit({ windowMs: 60000, limit: 200, message: limited }));
app.use(
  "/api/v1/payments/webhook",
  express.raw({ type: "application/json", limit: "256kb" }),
  webhook,
);
app.use(express.json({ limit: "1mb" }), cookieParser());
app.use("/assets", express.static("public"));
app.use("/uploads", express.static(".local/uploads"));
app.get("/api/v1/health", (_req, res) =>
  res.json({
    success: true,
    service: "api",
    status: "healthy",
    timestamp: new Date().toISOString(),
  }),
);
app.get("/api/v1/ready", async (_req, res) => {
  await db.$queryRaw`SELECT 1`;
  res.json({ success: true, status: "ready" });
});
const authLimit = () =>
  rateLimit({ windowMs: 15 * 60000, limit: 50, message: limited });
app.use("/api/v1/auth", authLimit(), auth);
app.use("/api/v1/admin/auth", authLimit(), adminAuth);
app.use("/api/v1/admin", admin);
app.use("/api/v1/media", media);
app.use("/api/v1/payments", payments);
app.use("/checkout", checkout);
app.use("/api/v1", publicRoutes, account);
app.use((_req, _res, next) => next(new HttpError(404, "Route not found")));
const errorHandler: express.ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(422).json({
      success: false,
      message: error.issues[0]?.message ?? "Validation failed",
      errors: error.issues,
    });
    return;
  }
  let status = error instanceof HttpError ? error.status : 500;
  let message =
    error instanceof HttpError
      ? error.message
      : "Server error. Please try again.";
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      status = 409;
      message = "A record with these details already exists";
    }
    if (error.code === "P2025") {
      status = 404;
      message = "Record not found";
    }
    if (error.code === "P2003") {
      status = 409;
      message = "Related record does not exist or is still in use";
    }
    if (error.code === "P2022" || error.code === "P2032") {
      status = 503;
      message = "Database update pending. Please redeploy the API.";
    }
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    status = 503;
    message = "Database unavailable. Check the API database configuration.";
  }
  if (error instanceof SyntaxError) {
    status = 400;
    message = "Invalid JSON request";
  }
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "LIMIT_FILE_SIZE"
  ) {
    status = 413;
    message = "Media file must be smaller than 50 MB";
  }
  if (status === 500)
    console.error(
      "[API] Request failed",
      error instanceof Error ? error.name : "Unknown error",
    );
  if (env.NODE_ENV === "test" && status === 500) console.error(error);
  res.status(status).json({ success: false, message, errors: [] });
};
app.use(errorHandler);
