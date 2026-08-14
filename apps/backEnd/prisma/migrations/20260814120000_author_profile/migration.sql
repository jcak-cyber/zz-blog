-- AlterTable
ALTER TABLE "User" ADD COLUMN "nickname" TEXT;
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "bio" TEXT;

-- Backfill nickname from username
UPDATE "User" SET "nickname" = "username" WHERE "nickname" IS NULL;

-- Make nickname required
ALTER TABLE "User" ALTER COLUMN "nickname" SET NOT NULL;
