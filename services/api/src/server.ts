  import { app } from "./app.js";
  import { env } from "./config/env.js";
  import { db } from "./config/db.js";
  import { flushEmails } from "./services/email.js";
  import { expireHolds } from "./services/payments.js";
  import { dispatchDuePushCampaigns, processPushReceipts } from "./services/push.js";
  try {
    await db.$connect();
    await db.$queryRaw`SELECT 1`;
    console.log("[API] PostgreSQL connected");
  } catch {
    console.error(
      "[API] Database connection failed. Check services/api/.env DATABASE_URL and run npm run prisma:deploy.",
    );
    process.exit(1);
  }
  const server = app.listen(env.PORT, "0.0.0.0", () =>
    console.log(`[API] http://localhost:${env.PORT} | health: /api/v1/health`),
  );
  const timer = setInterval(() => {
    void expireHolds()
      .then(flushEmails)
      .then(async () => {
        if (env.PUSH_DELIVERY_ENABLED) {
          await dispatchDuePushCampaigns();
          await processPushReceipts();
        }
      })
      .catch(() =>
        console.error(
          "[API] Background worker: database unavailable. Run database setup.",
        ),
      );
  }, 30000);
  if (env.PUSH_DELIVERY_ENABLED)
    void dispatchDuePushCampaigns().catch(() =>
      console.error("[API] Push worker startup failed"),
    );
  async function shutdown() {
    clearInterval(timer);
    server.close();
    await db.$disconnect();
    process.exit(0);
  }
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
