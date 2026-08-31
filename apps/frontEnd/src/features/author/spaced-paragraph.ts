import { Extension } from '@tiptap/react';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

export const PARAGRAPH_SPACING = [
  { id: 'tight', label: '紧凑', hint: '更紧凑的段距' },
  { id: 'normal', label: '默认', hint: '跟随正文默认间距' },
  { id: 'relaxed', label: '宽松', hint: '稍大的段距' },
  { id: 'loose', label: '疏朗', hint: '明显拉开段距' },
] as const;

export type ParagraphSpacingId = (typeof PARAGRAPH_SPACING)[number]['id'];

type MarkdownSerializeState = {
  write: (text: string) => void;
  renderInline: (node: ProseMirrorNode) => void;
  closeBlock: (node: ProseMirrorNode) => void;
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    paragraphSpacing: {
      setParagraphSpacing: (spacing: ParagraphSpacingId | null) => ReturnType;
      setAllParagraphSpacing: (spacing: ParagraphSpacingId | null) => ReturnType;
    };
  }
}

function isSpacingId(value: string | null): value is ParagraphSpacingId {
  return PARAGRAPH_SPACING.some((item) => item.id === value);
}

/**
 * 段落间距：给 paragraph 增加 data-spacing，工具栏可设紧凑/默认/宽松/疏朗。
 * 有自定义段距时以 HTML 落盘，保证预览与正文保留间距。
 */
export const ParagraphSpacing = Extension.create({
  name: 'paragraphSpacing',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph'],
        attributes: {
          spacing: {
            default: null,
            parseHTML: (element) => {
              const raw = element.getAttribute('data-spacing');
              return isSpacingId(raw) && raw !== 'normal' ? raw : null;
            },
            renderHTML: (attributes) => {
              if (!attributes.spacing || attributes.spacing === 'normal') return {};
              return { 'data-spacing': attributes.spacing };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setParagraphSpacing:
        (spacing) =>
        ({ tr, state, dispatch }) => {
          const next = !spacing || spacing === 'normal' ? null : spacing;
          const type = state.schema.nodes.paragraph;
          if (!type) return false;

          const { from, to, empty } = state.selection;
          let changed = false;

          const applyAt = (pos: number, node: ProseMirrorNode) => {
            if (node.type !== type) return;
            if (node.attrs.spacing === next) return;
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, spacing: next });
            changed = true;
          };

          if (empty) {
            const $from = state.selection.$from;
            for (let depth = $from.depth; depth >= 0; depth -= 1) {
              const node = $from.node(depth);
              if (node.type === type) {
                applyAt($from.before(depth), node);
                break;
              }
            }
          } else {
            state.doc.nodesBetween(from, to, (node, pos) => {
              applyAt(pos, node);
            });
          }

          if (changed && dispatch) dispatch(tr);
          return changed;
        },
      setAllParagraphSpacing:
        (spacing) =>
        ({ tr, state, dispatch }) => {
          const next = !spacing || spacing === 'normal' ? null : spacing;
          const type = state.schema.nodes.paragraph;
          if (!type) return false;

          let changed = false;
          state.doc.descendants((node, pos) => {
            if (node.type !== type) return;
            if (node.attrs.spacing === next) return;
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, spacing: next });
            changed = true;
          });

          if (changed && dispatch) {
            dispatch(tr);
          }
          return changed;
        },
    };
  },

  onCreate() {
    const paragraph = this.editor.extensionManager.extensions.find(
      (ext) => ext.name === 'paragraph',
    );
    if (!paragraph) return;

    type MarkdownStorage = {
      serialize?: (
        state: MarkdownSerializeState,
        node: ProseMirrorNode,
        ...rest: unknown[]
      ) => unknown;
      parse?: unknown;
    };
    const storage = paragraph.storage as { markdown?: MarkdownStorage };
    const prev = storage.markdown;
    storage.markdown = {
      ...prev,
      serialize(state: MarkdownSerializeState, node: ProseMirrorNode, ...rest: unknown[]) {
        const spacing = node.attrs.spacing as string | null;
        if (spacing && spacing !== 'normal') {
          state.write(`<p data-spacing="${spacing}">`);
          state.renderInline(node);
          state.write('</p>');
          state.closeBlock(node);
          return;
        }
        if (typeof prev?.serialize === 'function') {
          return prev.serialize.call(this, state, node, ...rest);
        }
        state.renderInline(node);
        state.closeBlock(node);
      },
      parse: prev?.parse ?? {},
    };
  },
});
