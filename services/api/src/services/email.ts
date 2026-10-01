import nodemailer from "nodemailer";
import { db } from "../config/db.js";
import { env } from "../config/env.js";
const transport = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  connectionTimeout: 10000,
  socketTimeout: 15000,
});
let running = false;
export async function flushEmails() {
  if (running || !env.MAIL_DELIVERY_ENABLED) return;
  running = true;
  try {
    const jobs = await db.emailJob.findMany({
      where: {
        sentAt: null,
        attempts: { lt: 8 },
        nextAttempt: { lte: new Date() },
      },
      take: 10,
    });
    for (const job of jobs) {
      const claimed = await db.emailJob.updateMany({
        where: { id: job.id, nextAttempt: job.nextAttempt, sentAt: null },
        data: {
          nextAttempt: new Date(Date.now() + 120000),
          attempts: { increment: 1 },
        },
      });
      if (!claimed.count) continue;
      try {
        await transport.sendMail({
          from: { name: env.SMTP_FROM_NAME, address: env.SMTP_FROM_EMAIL },
          to: job.to,
          cc: job.dedupeKey.startsWith("confirmation:")
            ? env.ADMIN_CC
            : undefined,
          subject: job.subject,
          html: job.html,
        });
        await db.emailJob.update({
          where: { id: job.id },
          data: { sentAt: new Date(), lastError: null },
        });
      } catch {
        await db.emailJob.update({
          where: { id: job.id },
          data: {
            lastError: "SMTP delivery failed",
            nextAttempt: new Date(
              Date.now() + Math.min(3600000, 30000 * 2 ** job.attempts),
            ),
          },
        });
        console.error("[API] Email delivery failed; queued for retry", job.id);
      }
    }
  } finally {
    running = false;
  }
}
