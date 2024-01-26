/*
  Warnings:

  - Added the required column `newfield` to the `Testmodel` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Testmodel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testnametestname" TEXT,
    "newfield" TEXT NOT NULL
);
INSERT INTO "new_Testmodel" ("id", "testnametestname") SELECT "id", "testnametestname" FROM "Testmodel";
DROP TABLE "Testmodel";
ALTER TABLE "new_Testmodel" RENAME TO "Testmodel";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
