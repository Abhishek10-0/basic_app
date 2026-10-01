import { Router } from "express";
import multer from "multer";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { z } from "zod";
import { db } from "../config/db.js";
import { env } from "../config/env.js";
import { authenticate, roles } from "../middleware/auth.js";
import { ok, HttpError } from "../utils/http.js";
export const media = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 1 },
});
media.post(
  "/",
  authenticate,
  roles("SUPER_ADMIN", "ADMIN", "EDITOR"),
  upload.single("file"),
  async (req, res) => {
    const f = req.file;
    if (!f) throw new HttpError(400, "Select an image or video");
    const png = f.buffer
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jpg =
      f.buffer[0] === 255 && f.buffer[1] === 216 && f.buffer[2] === 255;
    const webp =
      f.buffer.subarray(0, 4).toString() === "RIFF" &&
      f.buffer.subarray(8, 12).toString() === "WEBP";
    const mp4 = f.buffer.subarray(4, 8).toString() === "ftyp";
    const webm = f.buffer
      .subarray(0, 4)
      .equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    if (!png && !jpg && !webp && !mp4 && !webm)
      throw new HttpError(
        400,
        "Only PNG, JPEG, WebP, MP4, MOV and WebM files are supported",
      );
    const isQuickTime = mp4 && f.mimetype === "video/quicktime";
    const extension = png
      ? "png"
      : jpg
        ? "jpg"
        : webp
          ? "webp"
          : webm
            ? "webm"
            : isQuickTime
              ? "mov"
              : "mp4";
    const mimeType = png
      ? "image/png"
      : jpg
        ? "image/jpeg"
        : webp
          ? "image/webp"
          : webm
            ? "video/webm"
            : isQuickTime
              ? "video/quicktime"
              : "video/mp4";
    const filename = `${randomUUID()}.${extension}`;
    let url: string;
    if (env.MEDIA_MODE === "remote") {
      const form = new FormData();
      form.append(
        "file",
        new Blob([new Uint8Array(f.buffer)], { type: mimeType }),
        filename,
      );
      const response = await fetch(
        new URL(env.MEDIA_UPLOAD_PATH, env.MEDIA_SERVER_URL),
        {
          method: "POST",
          headers: { Authorization: `Bearer ${env.MEDIA_SERVER_SECRET}` },
          body: form,
          signal: AbortSignal.timeout(20000),
        },
      );
      if (!response.ok)
        throw new HttpError(502, "Media server rejected upload");
      const result = z
        .union([
          z.object({ url: z.string().url().startsWith("https://") }),
          z.object({
            data: z.object({ url: z.string().url().startsWith("https://") }),
          }),
        ])
        .parse(await response.json());
      url = "url" in result ? result.url : result.data.url;
    } else {
      const dir = resolve(".local/uploads");
      await mkdir(dir, { recursive: true });
      await writeFile(resolve(dir, filename), f.buffer);
      url = `${env.API_PUBLIC_URL}/uploads/${filename}`;
    }
    const row = await db.media.create({
      data: {
        url,
        filename: f.originalname.slice(0, 200),
        mimeType,
        size: f.size,
      },
    });
    ok(res, row, "Media uploaded", 201);
  },
);
