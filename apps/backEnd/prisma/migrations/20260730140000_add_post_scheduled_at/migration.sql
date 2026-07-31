-- AlterTable
ALTER TABLE "Post" ADD COLUMN "scheduledAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Post_published_scheduledAt_idx" ON "Post"("published", "scheduledAt");
