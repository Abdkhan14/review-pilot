-- CreateTable
CREATE TABLE "BusinessHandoff" (
    "businessId" TEXT NOT NULL PRIMARY KEY,
    "count" INTEGER NOT NULL,
    "day" TEXT NOT NULL,
    CONSTRAINT "BusinessHandoff_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
