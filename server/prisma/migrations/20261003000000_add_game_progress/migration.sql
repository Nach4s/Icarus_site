-- CreateTable
CREATE TABLE "GameProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "unlockedSkins" JSONB NOT NULL DEFAULT '["classic"]',
    "selectedSkin" TEXT NOT NULL DEFAULT 'classic',
    "bestScore" INTEGER NOT NULL DEFAULT 0,
    "scores" JSONB NOT NULL DEFAULT '[]',
    "stats" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameProgress_userId_key" ON "GameProgress"("userId");

-- AddForeignKey
ALTER TABLE "GameProgress" ADD CONSTRAINT "GameProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
