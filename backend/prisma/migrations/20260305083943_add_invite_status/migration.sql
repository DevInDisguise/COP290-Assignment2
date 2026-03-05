-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProjectMember" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "projectId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'PROJECT_MEMBER',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ProjectMember" ("id", "projectId", "role", "userId") SELECT "id", "projectId", "role", "userId" FROM "ProjectMember";
DROP TABLE "ProjectMember";
ALTER TABLE "new_ProjectMember" RENAME TO "ProjectMember";
CREATE UNIQUE INDEX "ProjectMember_userId_projectId_key" ON "ProjectMember"("userId", "projectId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
