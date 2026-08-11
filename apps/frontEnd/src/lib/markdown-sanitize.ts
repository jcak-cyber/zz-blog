import { defaultSchema, type Options as SanitizeOptions } from 'rehype-sanitize';

/** 允许作者富文本产生的有限 HTML（颜色/对齐/视频等） */
export const authorHtmlSanitizeSchema: SanitizeOptions = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    'video',
    'iframe',
    'mark',
    'span',
    'u',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'colgroup',
    'col',
  ],
  attributes: {
    ...defaultSchema.attributes,
    '*': [...(defaultSchema.attributes?.['*'] ?? []), 'className', 'class', 'style'],
    a: [...(defaultSchema.attributes?.a ?? []), 'href', 'name', 'target', 'rel'],
    img: [...(defaultSchema.attributes?.img ?? []), 'src', 'alt', 'title', 'width', 'height'],
    video: ['src', 'controls', 'width', 'height', 'style'],
    iframe: ['src', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder', 'style', 'class'],
    mark: ['style', 'dataColor', 'data-color', 'class'],
    span: ['style', 'class'],
    p: [...(defaultSchema.attributes?.p ?? []), 'style', 'class'],
    h1: ['id', 'style', 'class'],
    h2: ['id', 'style', 'class'],
    h3: ['id', 'style', 'class'],
    td: ['colspan', 'rowspan', 'style', 'class'],
    th: ['colspan', 'rowspan', 'style', 'class'],
    col: ['span', 'width', 'style'],
  },
};
