-- CreateEnum
CREATE TYPE "ReactionValue" AS ENUM ('LIKE', 'DISLIKE');

-- AlterTable: add username nullable, backfill, then require unique
ALTER TABLE "User" ADD COLUMN "username" TEXT;

UPDATE "User"
SET "username" = split_part("email", '@', 1)
WHERE "username" IS NULL;

-- Ensure uniqueness if collisions
UPDATE "User" AS u
SET "username" = u."username" || '_' || substr(u."id", 1, 6)
WHERE EXISTS (
  SELECT 1 FROM "User" u2
  WHERE u2."username" = u."username" AND u2."id" <> u."id"
);

ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateTable
CREATE TABLE "PostReaction" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" "ReactionValue" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostReaction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PostReaction_postId_value_idx" ON "PostReaction"("postId", "value");

CREATE UNIQUE INDEX "PostReaction_postId_userId_key" ON "PostReaction"("postId", "userId");

ALTER TABLE "PostReaction" ADD CONSTRAINT "PostReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PostReaction" ADD CONSTRAINT "PostReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
