import { apiGet } from '@/lib/api';
import type { PostSummary } from '@/lib/posts';

export type PublicAuthor = {
  username: string;
  nickname: string;
  avatarUrl: string | null;
  bio: string | null;
  posts: PostSummary[];
};

export async function fetchPublicAuthor(username: string): Promise<PublicAuthor | null> {
  try {
    return await apiGet<PublicAuthor>(`/authors/${encodeURIComponent(username)}`, {
      cache: 'no-store',
    });
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'status' in error &&
      (error as { status: number }).status === 404
    ) {
      return null;
    }
    throw error;
  }
}
