import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { db } from "../config/db.js";
import { HttpError } from "../utils/http.js";
export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const token = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : undefined;
    if (!token) throw new HttpError(401, "Please log in");
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ["HS256"],
      issuer: "sme-api",
      audience: "sme-app",
    });
    if (
      typeof payload === "string" ||
      !payload.sub ||
      !["user", "admin"].includes(payload.kind)
    )
      throw new HttpError(401, "Invalid session");
    const kind = payload.kind as "user" | "admin";
    const principal =
      kind === "admin"
        ? await db.admin.findUnique({ where: { id: payload.sub } })
        : await db.user.findUnique({ where: { id: payload.sub } });
    if (!principal || principal.disabled)
      throw new HttpError(401, "Account unavailable");
    req.auth = {
      id: principal.id,
      kind,
      role: "role" in principal ? principal.role : undefined,
    };
    next();
  } catch (error) {
    next(
      error instanceof HttpError
        ? error
        : new HttpError(401, "Session expired"),
    );
  }
};
export const userOnly: RequestHandler = (req, _res, next) =>
  next(
    req.auth?.kind === "user"
      ? undefined
      : new HttpError(403, "User login required"),
  );
export const roles =
  (...allowed: string[]): RequestHandler =>
  (req, _res, next) =>
    next(
      req.auth?.kind === "admin" && allowed.includes(req.auth.role ?? "")
        ? undefined
        : new HttpError(403, "Administrator permission required"),
    );
