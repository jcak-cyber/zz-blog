import Image from '@tiptap/extension-image';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

type MarkdownSerializeState = {
  write: (text: string) => void;
  closeBlock: (node: ProseMirrorNode) => void;
};

function escapeAttr(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/** MDX 要求 void 标签自闭合；落盘用 class，渲染前再转 className */
function serializeSizedImage(attrs: {
  src?: string | null;
  alt?: string | null;
  title?: string | null;
  width?: number | string | null;
  height?: number | string | null;
}) {
  const parts = [`class="author-rich-image"`];
  if (attrs.src) parts.push(`src="${escapeAttr(String(attrs.src))}"`);
  if (attrs.alt != null && attrs.alt !== '') parts.push(`alt="${escapeAttr(String(attrs.alt))}"`);
  if (attrs.title) parts.push(`title="${escapeAttr(String(attrs.title))}"`);
  if (attrs.width) parts.push(`width="${attrs.width}"`);
  if (attrs.height) parts.push(`height="${attrs.height}"`);
  return `<img ${parts.join(' ')} />`;
}

/**
 * 可拖拽缩放的图片：拖四角手柄调整大小，尺寸写入 width/height。
 * 有尺寸时以自闭合 HTML img 落盘，避免 markdown `![]()` 丢掉宽高，并兼容 MDX。
 */
export const ResizableImage = Image.extend({
  addNodeView() {
    const parent = this.parent?.();
    if (!parent) return null;

    return (props) => {
      const view = parent(props);
      if (!view) {
        throw new Error('ResizableImage: parent Image node view returned empty');
      }

      // TipTap 默认等 onload 才显示；缓存图可能已 complete，补一次显形
      const root = view.dom as HTMLElement;
      const img = root.querySelector('img');
      if (img instanceof HTMLImageElement) {
        const reveal = () => {
          root.style.visibility = '';
          root.style.pointerEvents = '';
        };
        if (img.complete) reveal();
        else img.addEventListener('load', reveal, { once: true });
      }

      return view;
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: MarkdownSerializeState, node: ProseMirrorNode) {
          const { width, height, src, alt, title } = node.attrs as {
            src?: string | null;
            alt?: string | null;
            title?: string | null;
            width?: number | string | null;
            height?: number | string | null;
          };

          if (width || height) {
            state.write(serializeSizedImage({ src, alt, title, width, height }));
            if (node.isBlock) state.closeBlock(node);
            return;
          }

          const safeSrc = src ?? '';
          const safeAlt = alt ?? '';
          state.write(title ? `![${safeAlt}](${safeSrc} "${title}")` : `![${safeAlt}](${safeSrc})`);
          if (node.isBlock) state.closeBlock(node);
        },
        parse: {},
      },
    };
  },
}).configure({
  allowBase64: false,
  HTMLAttributes: { class: 'author-rich-image' },
  resize: {
    enabled: true,
    directions: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    minWidth: 48,
    minHeight: 48,
    alwaysPreserveAspectRatio: true,
  },
});
