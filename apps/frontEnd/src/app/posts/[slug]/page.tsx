import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PostDetailView } from '@/features/posts/post-detail';
import { renderPostMarkdown } from '@/lib/mdx';
import { fetchPostBySlug, normalizeSlugParam } from '@/lib/posts';

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await fetchPostBySlug(normalizeSlugParam(params.slug));
  if (!post) {
    return { title: '未找到文章' };
  }
  return {
    title: post.title,
    description: post.excerpt ?? `${post.title} - zz-blog`,
  };
}

export default async function PostPage({ params }: Props) {
  const post = await fetchPostBySlug(normalizeSlugParam(params.slug));
  if (!post) {
    notFound();
  }
  const content = await renderPostMarkdown(post.content);
  return <PostDetailView post={post} content={content} />;
}
