-- CreateTable
CREATE TABLE "DemoPlace" (
    "placeId" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "writeReviewUrl" TEXT,
    "details" TEXT,
    "detailsFetchedAt" DATETIME,
    "generationsUsed" INTEGER NOT NULL DEFAULT 0,
    "generationLimit" INTEGER,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "DemoSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "placeId" TEXT NOT NULL,
    "customInstructions" TEXT,
    "ipHash" TEXT NOT NULL,
    "generations" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "DemoSession_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "DemoPlace" ("placeId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DemoSession_ipHash_createdAt_idx" ON "DemoSession"("ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "DemoSession_createdAt_idx" ON "DemoSession"("createdAt");
