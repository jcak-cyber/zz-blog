'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Editor } from '@tiptap/react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Heading,
  Highlighter,
  History,
  ImageIcon,
  Link2,
  List,
  ListOrdered,
  ListTree,
  Maximize2,
  Minimize2,
  Minus,
  MoreHorizontal,
  PaintBucket,
  Quote,
  Redo2,
  Strikethrough,
  Table,
  Type,
  Underline,
  Undo2,
  Video,
  Italic,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { uploadCover } from '@/lib/author-posts';

type Props = {
  editor: Editor;
  wide: boolean;
  onToggleWide: () => void;
  historyItems: Array<{ id: string; at: number; preview: string; content: string }>;
  onRestoreHistory: (content: string) => void;
};

type MenuKey =
  | 'format'
  | 'color'
  | 'bg'
  | 'more'
  | 'list'
  | 'align'
  | 'code'
  | 'image'
  | 'history'
  | 'toc'
  | null;

const TEXT_COLORS = [
  { label: '墨色', value: '#1f2a24' },
  { label: '森绿', value: '#2f5d45' },
  { label: '暖赭', value: '#a45a3a' },
  { label: '靛蓝', value: '#2a4a6b' },
  { label: '绛红', value: '#8b3a3a' },
  { label: '灰', value: '#6b7280' },
];

const BG_COLORS = [
  { label: '无', value: '' },
  { label: '浅黄', value: '#f5e6a8' },
  { label: '浅绿', value: '#d8ebd8' },
  { label: '浅赭', value: '#f0dcc8' },
  { label: '浅青', value: '#d5e6ef' },
  { label: '浅灰', value: '#e8e6e1' },
];

function ToolBtn({
  label,
  active,
  disabled,
  onClick,
  children,
  title,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title || label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn('author-rt-tool', active && 'author-rt-tool--active')}
    >
      <span className="author-rt-tool-icon">{children}</span>
      <span className="author-rt-tool-label">{label}</span>
    </button>
  );
}

function MenuPanel({
  open,
  onClose,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div ref={ref} className={cn('author-rt-menu', className)} role="menu">
      {children}
    </div>
  );
}

function MenuItem({
  onClick,
  active,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn('author-rt-menu-item', active && 'author-rt-menu-item--active')}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function extractHeadings(editor: Editor) {
  const items: Array<{ level: number; text: string; pos: number }> = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      items.push({
        level: node.attrs.level as number,
        text: node.textContent || '无标题',
        pos,
      });
    }
  });
  return items;
}

export function RichTextToolbar({
  editor,
  wide,
  onToggleWide,
  historyItems,
  onRestoreHistory,
}: Props) {
  const [menu, setMenu] = useState<MenuKey>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const close = useCallback(() => setMenu(null), []);
  const toggle = (key: MenuKey) => setMenu((m) => (m === key ? null : key));

  const headings = menu === 'toc' ? extractHeadings(editor) : [];

  async function onPickImage(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      window.alert('请选择图片文件');
      return;
    }
    setUploading(true);
    try {
      const stored = await uploadCover(file);
      const alt = file.name.replace(/[[\]]/g, '');
      const ok = editor.chain().focus().setImage({ src: stored.url, alt }).run();
      if (!ok) {
        editor.chain().focus().insertContent(`![${alt}](${stored.url})\n\n`).run();
      }
      close();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '图片上传失败';
      window.alert(msg.includes('未登录') ? `${msg}，请重新登录后再试` : msg);
    } finally {
      setUploading(false);
    }
  }

  function insertImageByUrl() {
    const url = window.prompt('图片地址', 'https://');
    if (!url?.trim()) return;
    editor.chain().focus().setImage({ src: url.trim() }).run();
    close();
  }

  function setLink() {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('链接地址', prev || 'https://');
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  }

  function insertVideo() {
    const url = window.prompt('视频地址（支持 YouTube 链接或直链）', 'https://');
    if (!url?.trim()) return;
    const raw = url.trim();
    if (/youtu\.?be|youtube\.com/i.test(raw)) {
      editor.commands.setYoutubeVideo({ src: raw });
      return;
    }
    editor
      .chain()
      .focus()
      .insertContent(
        `<video src="${raw.replace(/"/g, '&quot;')}" controls style="max-width:100%"></video><p></p>`,
      )
      .run();
  }

  function insertToc() {
    const items = extractHeadings(editor);
    if (!items.length) {
      window.alert('当前正文还没有标题');
      return;
    }
    const md = [
      '## 目录',
      ...items.map((h) => `${'  '.repeat(Math.max(0, h.level - 1))}- ${h.text}`),
      '',
      '',
    ].join('\n');
    editor.chain().focus().insertContent(md).run();
    close();
  }

  return (
    <div className="author-rt-toolbar" role="toolbar" aria-label="正文格式">
      <div className="author-rt-group">
        <ToolBtn
          label="撤消"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 />
        </ToolBtn>
        <ToolBtn
          label="重做"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 />
        </ToolBtn>
        <div className="author-rt-tool-wrap">
          <ToolBtn label="历史" active={menu === 'history'} onClick={() => toggle('history')}>
            <History />
          </ToolBtn>
          <MenuPanel open={menu === 'history'} onClose={close} className="author-rt-menu--wide">
            {historyItems.length === 0 ? (
              <p className="author-rt-menu-empty">暂无本地快照</p>
            ) : (
              historyItems.map((item) => (
                <MenuItem
                  key={item.id}
                  onClick={() => {
                    onRestoreHistory(item.content);
                    close();
                  }}
                >
                  <span className="author-rt-history-time">
                    {new Date(item.at).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                  <span className="author-rt-history-preview">{item.preview}</span>
                </MenuItem>
              ))
            )}
          </MenuPanel>
        </div>
      </div>

      <div className="author-rt-group">
        <div className="author-rt-tool-wrap">
          <ToolBtn label="格式" active={menu === 'format'} onClick={() => toggle('format')}>
            <Heading />
          </ToolBtn>
          <MenuPanel open={menu === 'format'} onClose={close}>
            <MenuItem
              active={editor.isActive('paragraph')}
              onClick={() => {
                editor.chain().focus().setParagraph().run();
                close();
              }}
            >
              正文
            </MenuItem>
            {[1, 2, 3].map((level) => (
              <MenuItem
                key={level}
                active={editor.isActive('heading', { level })}
                onClick={() => {
                  editor
                    .chain()
                    .focus()
                    .toggleHeading({ level: level as 1 | 2 | 3 })
                    .run();
                  close();
                }}
              >
                标题 {level}
              </MenuItem>
            ))}
          </MenuPanel>
        </div>
        <ToolBtn
          label="加粗"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold />
        </ToolBtn>
        <div className="author-rt-tool-wrap">
          <ToolBtn label="颜色" active={menu === 'color'} onClick={() => toggle('color')}>
            <Type />
          </ToolBtn>
          <MenuPanel open={menu === 'color'} onClose={close}>
            <div className="author-rt-swatches">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  className="author-rt-swatch"
                  style={{ background: c.value }}
                  onClick={() => {
                    editor.chain().focus().setColor(c.value).run();
                    close();
                  }}
                />
              ))}
            </div>
            <MenuItem
              onClick={() => {
                editor.chain().focus().unsetColor().run();
                close();
              }}
            >
              清除颜色
            </MenuItem>
          </MenuPanel>
        </div>
        <div className="author-rt-tool-wrap">
          <ToolBtn label="背景" active={menu === 'bg'} onClick={() => toggle('bg')}>
            <PaintBucket />
          </ToolBtn>
          <MenuPanel open={menu === 'bg'} onClose={close}>
            <div className="author-rt-swatches">
              {BG_COLORS.filter((c) => c.value).map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  className="author-rt-swatch"
                  style={{ background: c.value }}
                  onClick={() => {
                    editor.chain().focus().toggleHighlight({ color: c.value }).run();
                    close();
                  }}
                />
              ))}
            </div>
            <MenuItem
              onClick={() => {
                editor.chain().focus().unsetHighlight().run();
                close();
              }}
            >
              清除背景
            </MenuItem>
          </MenuPanel>
        </div>
        <div className="author-rt-tool-wrap">
          <ToolBtn label="其他" active={menu === 'more'} onClick={() => toggle('more')}>
            <MoreHorizontal />
          </ToolBtn>
          <MenuPanel open={menu === 'more'} onClose={close}>
            <MenuItem
              active={editor.isActive('italic')}
              onClick={() => {
                editor.chain().focus().toggleItalic().run();
                close();
              }}
            >
              <Italic className="size-3.5" /> 斜体
            </MenuItem>
            <MenuItem
              active={editor.isActive('underline')}
              onClick={() => {
                editor.chain().focus().toggleUnderline().run();
                close();
              }}
            >
              <Underline className="size-3.5" /> 下划线
            </MenuItem>
            <MenuItem
              active={editor.isActive('strike')}
              onClick={() => {
                editor.chain().focus().toggleStrike().run();
                close();
              }}
            >
              <Strikethrough className="size-3.5" /> 删除线
            </MenuItem>
            <MenuItem
              onClick={() => {
                editor.chain().focus().unsetAllMarks().clearNodes().run();
                close();
              }}
            >
              <Highlighter className="size-3.5" /> 清除格式
            </MenuItem>
          </MenuPanel>
        </div>
      </div>

      <div className="author-rt-group">
        <div className="author-rt-tool-wrap">
          <ToolBtn label="列表" active={menu === 'list'} onClick={() => toggle('list')}>
            <List />
          </ToolBtn>
          <MenuPanel open={menu === 'list'} onClose={close}>
            <MenuItem
              active={editor.isActive('bulletList')}
              onClick={() => {
                editor.chain().focus().toggleBulletList().run();
                close();
              }}
            >
              <List className="size-3.5" /> 无序列表
            </MenuItem>
            <MenuItem
              active={editor.isActive('orderedList')}
              onClick={() => {
                editor.chain().focus().toggleOrderedList().run();
                close();
              }}
            >
              <ListOrdered className="size-3.5" /> 有序列表
            </MenuItem>
          </MenuPanel>
        </div>
        <div className="author-rt-tool-wrap">
          <ToolBtn label="对齐" active={menu === 'align'} onClick={() => toggle('align')}>
            <AlignLeft />
          </ToolBtn>
          <MenuPanel open={menu === 'align'} onClose={close}>
            {(
              [
                ['left', '左对齐', AlignLeft],
                ['center', '居中', AlignCenter],
                ['right', '右对齐', AlignRight],
                ['justify', '两端对齐', AlignJustify],
              ] as const
            ).map(([align, label, Icon]) => (
              <MenuItem
                key={align}
                active={editor.isActive({ textAlign: align })}
                onClick={() => {
                  editor.chain().focus().setTextAlign(align).run();
                  close();
                }}
              >
                <Icon className="size-3.5" /> {label}
              </MenuItem>
            ))}
          </MenuPanel>
        </div>
        <ToolBtn label="水平线" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus />
        </ToolBtn>
        <ToolBtn
          label="块引用"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote />
        </ToolBtn>
        <div className="author-rt-tool-wrap">
          <ToolBtn label="代码" active={menu === 'code'} onClick={() => toggle('code')}>
            <Code2 />
          </ToolBtn>
          <MenuPanel open={menu === 'code'} onClose={close}>
            <MenuItem
              active={editor.isActive('code')}
              onClick={() => {
                editor.chain().focus().toggleCode().run();
                close();
              }}
            >
              行内代码
            </MenuItem>
            <MenuItem
              active={editor.isActive('codeBlock')}
              onClick={() => {
                editor.chain().focus().toggleCodeBlock().run();
                close();
              }}
            >
              代码块
            </MenuItem>
          </MenuPanel>
        </div>
        <ToolBtn
          label="表格"
          active={editor.isActive('table')}
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
        >
          <Table />
        </ToolBtn>
      </div>

      <div className="author-rt-group">
        <div className="author-rt-tool-wrap">
          <ToolBtn
            label="图像"
            active={menu === 'image'}
            disabled={uploading}
            onClick={() => toggle('image')}
          >
            <ImageIcon />
          </ToolBtn>
          <MenuPanel open={menu === 'image'} onClose={close}>
            <MenuItem onClick={() => fileRef.current?.click()}>
              {uploading ? '上传中…' : '上传图片'}
            </MenuItem>
            <MenuItem onClick={insertImageByUrl}>图片链接</MenuItem>
          </MenuPanel>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              void onPickImage(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>
        <ToolBtn label="视频" onClick={insertVideo}>
          <Video />
        </ToolBtn>
        <ToolBtn label="链接" active={editor.isActive('link')} onClick={setLink}>
          <Link2 />
        </ToolBtn>
      </div>

      <div className={cn('author-rt-group', !editor.isActive('table') && 'author-rt-group--last')}>
        <div className="author-rt-tool-wrap">
          <ToolBtn label="目录" active={menu === 'toc'} onClick={() => toggle('toc')}>
            <ListTree />
          </ToolBtn>
          <MenuPanel open={menu === 'toc'} onClose={close} className="author-rt-menu--wide">
            <MenuItem onClick={insertToc}>插入目录</MenuItem>
            {headings.length === 0 ? (
              <p className="author-rt-menu-empty">暂无标题</p>
            ) : (
              headings.map((h, i) => (
                <MenuItem
                  key={`${h.pos}-${i}`}
                  onClick={() => {
                    editor
                      .chain()
                      .focus()
                      .setTextSelection(h.pos + 1)
                      .run();
                    close();
                  }}
                >
                  <span style={{ paddingLeft: `${(h.level - 1) * 0.65}rem` }}>
                    H{h.level} · {h.text}
                  </span>
                </MenuItem>
              ))
            )}
          </MenuPanel>
        </div>
        <ToolBtn label={wide ? '收起' : '宽屏'} active={wide} onClick={onToggleWide}>
          {wide ? <Minimize2 /> : <Maximize2 />}
        </ToolBtn>
      </div>

      {editor.isActive('table') ? (
        <div className="author-rt-group author-rt-group--table author-rt-group--last">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
          >
            加列
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => editor.chain().focus().addRowAfter().run()}
          >
            加行
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => editor.chain().focus().deleteTable().run()}
          >
            删表
          </Button>
        </div>
      ) : null}
    </div>
  );
}
