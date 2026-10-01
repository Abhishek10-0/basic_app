ALTER TABLE "Notification" ADD COLUMN "imageUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Notification" ADD COLUMN "campaignId" TEXT;
CREATE TABLE "PushCampaign" ("id" TEXT NOT NULL, "title" TEXT NOT NULL, "message" TEXT NOT NULL, "deepLink" TEXT NOT NULL DEFAULT '', "imageUrl" TEXT NOT NULL DEFAULT '', "audience" TEXT NOT NULL DEFAULT 'ALL', "status" TEXT NOT NULL DEFAULT 'QUEUED', "attempts" INTEGER NOT NULL DEFAULT 0, "lastError" TEXT, "scheduledFor" TIMESTAMP(3), "sentAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "PushCampaign_pkey" PRIMARY KEY ("id"));
CREATE TABLE "PushDelivery" ("id" TEXT NOT NULL, "campaignId" TEXT NOT NULL, "token" TEXT NOT NULL, "ticketId" TEXT, "status" TEXT NOT NULL DEFAULT 'QUEUED', "error" TEXT, "sentAt" TIMESTAMP(3), "checkedAt" TIMESTAMP(3), CONSTRAINT "PushDelivery_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "PushDelivery_campaignId_token_key" ON "PushDelivery"("campaignId", "token");
CREATE INDEX "PushDelivery_status_sentAt_idx" ON "PushDelivery"("status", "sentAt");
CREATE INDEX "PushDelivery_ticketId_idx" ON "PushDelivery"("ticketId");
ALTER TABLE "PushDelivery" ADD CONSTRAINT "PushDelivery_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "PushCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
