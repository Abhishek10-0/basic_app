import { createHash, randomBytes, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { db } from "../config/db.js";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http.js";
export const hash = (s: string) => createHash("sha256").update(s).digest("hex");
export const opaque = () => randomBytes(32).toString("hex");
export function access(id: string, kind: "user" | "admin") {
  return jwt.sign({ kind }, env.JWT_ACCESS_SECRET, {
    subject: id,
    issuer: "sme-api",
    audience: "sme-app",
    algorithm: "HS256",
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
  });
}
export async function issue(
  id: string,
  kind: "user" | "admin",
  family: string = randomUUID(),
) {
  const refreshToken = jwt.sign(
    { kind, jti: opaque() },
    env.JWT_REFRESH_SECRET,
    {
      subject: id,
      issuer: "sme-api",
      audience: "sme-refresh",
      algorithm: "HS256",
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
    },
  );
  const decoded = jwt.decode(refreshToken) as jwt.JwtPayload;
  await db.refreshToken.create({
    data: {
      tokenHash: hash(refreshToken),
      family,
      [kind === "user" ? "userId" : "adminId"]: id,
      expiresAt: new Date(decoded.exp! * 1000),
    },
  });
  return { accessToken: access(id, kind), refreshToken };
}
export async function rotate(token: string, kind: "user" | "admin") {
  try {
    jwt.verify(token, env.JWT_REFRESH_SECRET, {
      algorithms: ["HS256"],
      issuer: "sme-api",
      audience: "sme-refresh",
    });
  } catch {
    throw new HttpError(401, "Refresh session expired");
  }
  const old = await db.refreshToken.findUnique({
    where: { tokenHash: hash(token) },
  });
  if (!old) throw new HttpError(401, "Session unavailable");
  if (old.revokedAt) {
    await db.refreshToken.updateMany({
      where: { family: old.family, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new HttpError(401, "Session already used. Log in again");
  }
  const id = kind === "user" ? old.userId : old.adminId;
  if (!id || old.expiresAt < new Date())
    throw new HttpError(401, "Session expired");
  const principal =
    kind === "user"
      ? await db.user.findUnique({ where: { id } })
      : await db.admin.findUnique({ where: { id } });
  if (!principal || principal.disabled)
    throw new HttpError(401, "Account unavailable");
  const used = await db.refreshToken.updateMany({
    where: { id: old.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (used.count !== 1) throw new HttpError(401, "Session already refreshed");
  return issue(id, kind, old.family);
}
