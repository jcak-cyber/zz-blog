import matter from 'gray-matter';

export type ParsedFrontmatter = {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  cover?: string;
  published: boolean;
  date?: string;
  tags: string[];
};

function toBool(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const v = value.toLowerCase();
    if (v === 'true' || v === '1') return true;
    if (v === 'false' || v === '0') return false;
  }
  return fallback;
}

export function parseMarkdownDocument(raw: string): ParsedFrontmatter {
  const { data, content } = matter(raw);
  const draft = data.draft !== undefined ? toBool(data.draft) : undefined;
  const publishedExplicit =
    data.published !== undefined ? toBool(data.published) : undefined;
  const published =
    publishedExplicit !== undefined
      ? publishedExplicit
      : draft !== undefined
        ? !draft
        : false;

  const tags = Array.isArray(data.tags)
    ? data.tags.map(String)
    : typeof data.tags === 'string'
      ? [data.tags]
      : [];

  const dateValue = data.date ?? data.publishedAt;
  const date =
    dateValue instanceof Date
      ? dateValue.toISOString()
      : dateValue
        ? String(dateValue)
        : undefined;

  return {
    title: String(data.title ?? ''),
    slug: String(data.slug ?? ''),
    content: content.trim(),
    excerpt: data.excerpt ? String(data.excerpt) : undefined,
    cover: data.cover || data.coverImage ? String(data.cover ?? data.coverImage) : undefined,
    published,
    date,
    tags,
  };
}
