import { compileMDX } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeSanitize from 'rehype-sanitize';
import rehypePrettyCode from 'rehype-pretty-code';
import type { ReactNode } from 'react';
import { authorHtmlSanitizeSchema } from '@/lib/markdown-sanitize';
import { cn } from '@/lib/utils';

const components = {
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    const width =
      typeof props.width === 'number'
        ? props.width
        : typeof props.width === 'string'
          ? Number.parseInt(props.width, 10)
          : undefined;
    const sized = Number.isFinite(width) && (width as number) > 0;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        {...props}
        alt={props.alt ?? ''}
        loading="lazy"
        className={cn('rounded-lg', props.className)}
        style={{
          ...(typeof props.style === 'object' && props.style ? props.style : {}),
          ...(sized ? { width: width as number, maxWidth: '100%', height: 'auto' } : null),
        }}
      />
    );
  },
};

/** 代码块外：把未闭合 <img> 收成 MDX 可编译的自闭合标签，并转 class → className */
function normalizeMdxSource(source: string): string {
  return source
    .split(/(```[\s\S]*?```)/g)
    .map((part, index) => {
      if (index % 2 === 1) return part;
      return part.replace(/<img\b([^>]*?)>/gi, (_full, rawAttrs: string) => {
        const attrs = rawAttrs
          .trim()
          .replace(/\/\s*$/, '')
          .replace(/\bclass=/gi, 'className=')
          .replace(/\bclassname=/g, 'className=');
        return `<img ${attrs} />`;
      });
    })
    .join('');
}

export async function renderPostMarkdown(source: string): Promise<ReactNode> {
  const { content } = await compileMDX({
    source: normalizeMdxSource(source),
    components,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          [
            rehypePrettyCode,
            {
              theme: 'everforest-dark',
              keepBackground: false,
              defaultLang: 'plaintext',
            },
          ],
          // sanitize 放在 pretty-code 之后，保留高亮 span
          [rehypeSanitize, authorHtmlSanitizeSchema],
          rehypeSlug,
        ],
      },
    },
  });
  return content;
}
