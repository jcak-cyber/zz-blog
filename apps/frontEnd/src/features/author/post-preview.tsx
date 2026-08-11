'use client';

import { useState, type ImgHTMLAttributes } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { resolveMediaUrl } from '@/lib/media';
import { authorHtmlSanitizeSchema } from '@/lib/markdown-sanitize';
import { ImageLightbox } from '@/components/image-lightbox';

type Props = {
  title: string;
  excerpt: string;
  coverImageUrl: string;
  content: string;
  mode: 'card' | 'body';
};

export function PostPreview({ title, excerpt, coverImageUrl, content, mode }: Props) {
  const cover = resolveMediaUrl(coverImageUrl);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  function openLightbox(src?: string | null) {
    const resolved = resolveMediaUrl(src);
    if (resolved) setLightboxSrc(resolved);
  }

  const MarkdownImage = (props: ImgHTMLAttributes<HTMLImageElement>) => {
    const src = typeof props.src === 'string' ? props.src : '';
    const resolved = resolveMediaUrl(src) ?? src;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        {...props}
        src={resolved}
        alt={props.alt ?? ''}
        className="cursor-zoom-in rounded-sm"
        onClick={() => openLightbox(resolved)}
      />
    );
  };

  if (mode === 'card') {
    return (
      <article className="author-preview-card">
        <p className="author-preview-label">列表预览</p>
        <div className="author-preview-cover-frame">
          {cover ? (
            <button
              type="button"
              className="author-preview-cover-btn"
              onClick={() => openLightbox(cover)}
              aria-label="放大预览封面"
              title="点击放大预览"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cover} alt="" className="author-preview-cover" />
              <span className="author-preview-zoom-hint">点击放大</span>
            </button>
          ) : (
            <div className="author-preview-cover author-preview-cover--empty" aria-hidden />
          )}
        </div>
        <h3 className="author-preview-title">{title.trim() || '无标题'}</h3>
        <p className="author-preview-excerpt">{excerpt.trim() || '摘要将出现在这里…'}</p>
        <ImageLightbox
          open={Boolean(lightboxSrc)}
          onOpenChange={(open) => {
            if (!open) setLightboxSrc(null);
          }}
          src={lightboxSrc}
          alt={title.trim() || '封面预览'}
        />
      </article>
    );
  }

  return (
    <div className="author-preview-body prose-blog">
      <p className="author-preview-label">正文预览</p>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, authorHtmlSanitizeSchema]]}
        components={{ img: MarkdownImage }}
      >
        {content.trim() || '*开始书写，预览将显示在这里*'}
      </ReactMarkdown>
      <ImageLightbox
        open={Boolean(lightboxSrc)}
        onOpenChange={(open) => {
          if (!open) setLightboxSrc(null);
        }}
        src={lightboxSrc}
        alt="正文图片预览"
      />
    </div>
  );
}
