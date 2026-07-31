export type AuthorPostStatus = 'draft' | 'scheduled' | 'published';

export function deriveAuthorPostStatus(
  post: { published: boolean; scheduledAt: Date | null },
  now = new Date(),
): AuthorPostStatus {
  if (!post.published) return 'draft';
  if (post.scheduledAt && post.scheduledAt.getTime() > now.getTime()) return 'scheduled';
  return 'published';
}
