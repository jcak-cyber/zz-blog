'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Props = {
  title: string;
  excerpt: string;
  coverImageUrl: string;
  content: string;
  mode: 'card' | 'body';
};

export function PostPreview({ title, excerpt, coverImageUrl, content, mode }: Props) {
  if (mode === 'card') {
    return (
      <article className="author-preview-card">
        <p className="author-preview-label">列表预览</p>
        {coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImageUrl} alt="" className="author-preview-cover" />
        ) : (
          <div className="author-preview-cover author-preview-cover--empty" aria-hidden />
        )}
        <h3 className="author-preview-title">{title.trim() || '无标题'}</h3>
        <p className="author-preview-excerpt">
          {excerpt.trim() || '摘要将出现在这里…'}
        </p>
      </article>
    );
  }

  return (
    <div className="author-preview-body prose-blog">
      <p className="author-preview-label">正文预览</p>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content.trim() || '*开始书写，预览将显示在这里*'}
      </ReactMarkdown>
    </div>
  );
}
