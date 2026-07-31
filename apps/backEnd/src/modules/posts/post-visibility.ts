import { Prisma } from '@prisma/client';

/** 读者可见：已发布且预约时间已到（或无预约）且 slug 非空 */
export function publicVisibleWhere(now = new Date()): Prisma.PostWhereInput {
  return {
    published: true,
    NOT: [{ slug: '' }],
    OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
  };
}

export function isPubliclyVisible(
  post: { published: boolean; slug: string; scheduledAt: Date | null },
  now = new Date(),
): boolean {
  if (!post.published || !post.slug?.trim()) return false;
  if (post.scheduledAt && post.scheduledAt.getTime() > now.getTime()) return false;
  return true;
}
