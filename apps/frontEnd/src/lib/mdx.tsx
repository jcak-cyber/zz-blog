import { compileMDX } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeSanitize from 'rehype-sanitize';
import type { ReactNode } from 'react';
import { authorHtmlSanitizeSchema } from '@/lib/markdown-sanitize';

const components = {
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ''} loading="lazy" className="rounded-lg" />
  ),
};

export async function renderPostMarkdown(source: string): Promise<ReactNode> {
  const { content } = await compileMDX({
    source,
    components,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [[rehypeSanitize, authorHtmlSanitizeSchema], rehypeSlug],
      },
    },
  });
  return content;
}
