import { db } from "../config/db.js";

const SEND_URL = "https://exp.host/--/api/v2/push/send";
const RECEIPTS_URL = "https://exp.host/--/api/v2/push/getReceipts";
const chunks = <T>(items: T[], size: number) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) =>
    items.slice(i * size, i * size + size),
  );
type Ticket =
  | { status: "ok"; id: string }
  | { status: "error"; message?: string; details?: { error?: string } };
type Receipt =
  | { status: "ok" }
  | { status: "error"; message?: string; details?: { error?: string } };
async function expoPost<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok)
    throw new Error(`Expo Push returned HTTP ${response.status}`);
  return (await response.json()) as T;
}
export async function dispatchDuePushCampaigns() {
  const campaigns = await db.pushCampaign.findMany({
    where: {
      status: { in: ["QUEUED", "RETRY"] },
      OR: [{ scheduledFor: null }, { scheduledFor: { lte: new Date() } }],
    },
    take: 5,
  });
  for (const campaign of campaigns) await dispatchCampaign(campaign.id);
}
export async function dispatchCampaign(campaignId: string) {
  const claim = await db.pushCampaign.updateMany({
    where: {
      id: campaignId,
      status: { in: ["QUEUED", "RETRY"] },
      attempts: { lt: 5 },
    },
    data: { status: "SENDING", attempts: { increment: 1 }, lastError: null },
  });
  if (!claim.count) return;
  const campaign = await db.pushCampaign.findUniqueOrThrow({
    where: { id: campaignId },
  });
  const tokens = await db.pushToken.findMany({
    where: { user: { disabled: false } },
    select: { token: true },
    distinct: ["token"],
  });
  if (!tokens.length) {
    await db.pushCampaign.update({
      where: { id: campaignId },
      data: {
        status: "NO_RECIPIENTS",
        lastError: "No registered Expo push tokens",
      },
    });
    return;
  }
  await db.pushDelivery.createMany({
    data: tokens.map(({ token }) => ({ campaignId, token })),
    skipDuplicates: true,
  });
  const deliveries = await db.pushDelivery.findMany({
    where: { campaignId, status: { in: ["QUEUED", "RETRY"] } },
    select: { id: true, token: true },
  });
  let retryError = "";
  for (const batch of chunks(deliveries, 100)) {
    try {
      const result = await expoPost<{ data: Ticket[] }>(
        SEND_URL,
        batch.map((row) => ({
          to: row.token,
          title: campaign.title,
          body: campaign.message,
          sound: "default",
          priority: "high",
          channelId: "default",
          ttl: 86400,
          data: {
            type: "broadcast",
            deepLink: campaign.deepLink,
            campaignId,
          },
          ...(campaign.imageUrl
            ? { richContent: { image: campaign.imageUrl } }
            : {}),
        })),
      );
      await Promise.all(
        batch.map(async (row, i) => {
          const ticket = result.data[i];
          const error =
            ticket?.status === "error"
              ? (ticket.details?.error ??
                ticket.message ??
                "Expo rejected token")
              : undefined;
          await db.pushDelivery.update({
            where: { id: row.id },
            data: {
              status: ticket?.status === "ok" ? "SENT" : "ERROR",
              ticketId: ticket?.status === "ok" ? ticket.id : null,
              error,
              sentAt: new Date(),
            },
          });
          if (error === "DeviceNotRegistered")
            await db.pushToken.deleteMany({ where: { token: row.token } });
        }),
      );
    } catch (error) {
      retryError =
        error instanceof Error ? error.message : "Expo Push request failed";
      await db.pushDelivery.updateMany({
        where: { id: { in: batch.map((row) => row.id) } },
        data: { status: "RETRY", error: retryError },
      });
    }
  }
  await db.pushCampaign.update({
    where: { id: campaignId },
    data: retryError
      ? {
          status: campaign.attempts >= 5 ? "FAILED" : "RETRY",
          lastError: retryError,
        }
      : { status: "SENT", sentAt: new Date() },
  });
}
export async function processPushReceipts() {
  const deliveries = await db.pushDelivery.findMany({
    where: { status: "SENT", ticketId: { not: null }, checkedAt: null },
    select: { id: true, token: true, ticketId: true },
    take: 1000,
  });
  for (const batch of chunks(deliveries, 300)) {
    try {
      const result = await expoPost<{ data: Record<string, Receipt> }>(
        RECEIPTS_URL,
        { ids: batch.map((row) => row.ticketId) },
      );
      await Promise.all(
        batch.map(async (row) => {
          const receipt = row.ticketId ? result.data[row.ticketId] : undefined;
          if (!receipt) return;
          const error =
            receipt.status === "error"
              ? (receipt.details?.error ??
                receipt.message ??
                "Push receipt failed")
              : undefined;
          await db.pushDelivery.update({
            where: { id: row.id },
            data: {
              status: receipt.status === "ok" ? "DELIVERED" : "ERROR",
              error,
              checkedAt: new Date(),
            },
          });
          if (error === "DeviceNotRegistered" || error === "InvalidCredentials")
            await db.pushToken.deleteMany({ where: { token: row.token } });
        }),
      );
    } catch {
      /* retry at the next worker run */
    }
  }
}
