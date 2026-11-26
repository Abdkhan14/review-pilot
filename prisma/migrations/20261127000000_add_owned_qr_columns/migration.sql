-- AlterTable
ALTER TABLE "User" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "User" ADD COLUMN "trialUsedAt" DATETIME;

-- AlterTable
ALTER TABLE "Business" ADD COLUMN "ownerId" TEXT;
ALTER TABLE "Business" ADD COLUMN "trialStartedAt" DATETIME;
ALTER TABLE "Business" ADD COLUMN "trialGenerations" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Business" ADD COLUMN "trialHandoffs" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Business" ADD COLUMN "dailyHandoffLimit" INTEGER;
ALTER TABLE "Business" ADD COLUMN "limitsDisabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Business" ADD COLUMN "basicPaidAt" DATETIME;
ALTER TABLE "Business" ADD COLUMN "stripeSubscriptionId" TEXT;
ALTER TABLE "Business" ADD COLUMN "subscriptionStatus" TEXT;
ALTER TABLE "Business" ADD COLUMN "currentPeriodEnd" DATETIME;
ALTER TABLE "Business" ADD COLUMN "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Business" ADD COLUMN "sponsoredPlan" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Business_stripeSubscriptionId_key" ON "Business"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Business_ownerId_idx" ON "Business"("ownerId");
