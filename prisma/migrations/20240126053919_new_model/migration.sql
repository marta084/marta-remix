-- CreateTable
CREATE TABLE "Testmodel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testnametestname" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "Note_ownerId_updatedAt_idx" ON "Note"("ownerId", "updatedAt");
