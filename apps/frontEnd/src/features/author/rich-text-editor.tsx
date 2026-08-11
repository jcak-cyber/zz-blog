'use client';

import { useEffect, useRef, useState } from 'react';
import { type Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Table } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Youtube from '@tiptap/extension-youtube';
import { common, createLowlight } from 'lowlight';
import { Markdown } from 'tiptap-markdown';
import { cn } from '@/lib/utils';
import { RichTextToolbar } from './rich-text-toolbar';
import { ResizableImage } from './resizable-image';
import { ResizableTableRow, TableRowResize } from './table-row-resize';

const lowlight = createLowlight(common);
lowlight.registerAlias({
  xml: ['html', 'xhtml'],
  bash: ['sh', 'zsh'],
  typescript: ['ts'],
  javascript: ['js'],
});

/** 默认语言 javascript，确保新建/无语言代码块也能高亮 */
const HighlightedCodeBlock = CodeBlockLowlight.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      language: {
        default: 'javascript',
        parseHTML: (element) => {
          const prefix = this.options.languageClassPrefix || 'language-';
          const classNames = [...(element.firstElementChild?.classList || [])];
          const languages = classNames
            .filter((className) => className.startsWith(prefix))
            .map((className) => className.slice(prefix.length));
          const language = languages[0];
          if (!language || language === 'null' || language === 'plaintext') {
            return 'javascript';
          }
          return language;
        },
        rendered: false,
      },
    };
  },
}).configure({
  lowlight,
  defaultLanguage: 'javascript',
  languageClassPrefix: 'language-',
  HTMLAttributes: {
    class: 'author-code-block',
  },
});

type Props = {
  value: string;
  onChange: (markdown: string) => void;
  className?: string;
};

type MdStorage = { getMarkdown: () => string };

type HistoryItem = {
  id: string;
  at: number;
  preview: string;
  content: string;
};

function getMarkdown(editor: Editor) {
  const md = (editor.storage as { markdown?: MdStorage }).markdown;
  return md?.getMarkdown?.() ?? '';
}

const MAX_HISTORY = 12;

export function RichTextEditor({ value, onChange, className }: Props) {
  const emitting = useRef(false);
  const [, setTick] = useState(0);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const lastSnap = useRef('');
  const snapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      ResizableImage,
      HighlightedCodeBlock,
      Table.configure({
        resizable: true,
        allowTableNodeSelection: true,
        lastColumnResizable: true,
        cellMinWidth: 64,
      }),
      ResizableTableRow,
      TableHeader,
      TableCell,
      TableRowResize,
      Youtube.configure({
        controls: true,
        nocookie: true,
        width: 640,
        height: 360,
      }),
      Placeholder.configure({
        placeholder: '开始书写正文…',
      }),
      Markdown.configure({
        html: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: value || '',
    onUpdate: ({ editor: ed }) => {
      emitting.current = true;
      const md = getMarkdown(ed);
      onChange(md);
      queueMicrotask(() => {
        emitting.current = false;
      });

      if (snapTimer.current) clearTimeout(snapTimer.current);
      snapTimer.current = setTimeout(() => {
        const text = md.trim();
        if (!text || text === lastSnap.current) return;
        lastSnap.current = text;
        const preview = text.replace(/\s+/g, ' ').slice(0, 48);
        setHistoryItems((prev) =>
          [
            {
              id: `${Date.now()}`,
              at: Date.now(),
              preview: preview || '（空）',
              content: md,
            },
            ...prev,
          ].slice(0, MAX_HISTORY),
        );
      }, 2500);
    },
    editorProps: {
      attributes: {
        class: 'author-rich-prose',
        spellcheck: 'false',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const bump = () => setTick((n) => n + 1);
    editor.on('selectionUpdate', bump);
    editor.on('transaction', bump);
    return () => {
      editor.off('selectionUpdate', bump);
      editor.off('transaction', bump);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor || emitting.current) return;
    const current = getMarkdown(editor);
    if (value !== current) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  useEffect(() => {
    return () => {
      if (snapTimer.current) clearTimeout(snapTimer.current);
    };
  }, []);

  function restoreHistory(content: string) {
    if (!editor) return;
    emitting.current = true;
    editor.commands.setContent(content || '');
    onChange(content);
    queueMicrotask(() => {
      emitting.current = false;
    });
  }

  if (!editor) {
    return (
      <div className={cn('author-rich-editor', className)}>
        <div className="author-rt-toolbar author-rt-toolbar--loading" />
        <div className="author-rich-surface author-rich-surface--loading" />
      </div>
    );
  }

  return (
    <div className={cn('author-rich-editor', className)}>
      <RichTextToolbar
        editor={editor}
        historyItems={historyItems}
        onRestoreHistory={restoreHistory}
      />
      <div className="author-rich-surface">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
