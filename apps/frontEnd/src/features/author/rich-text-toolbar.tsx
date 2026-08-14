'use client';

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
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
  Minus,
  MoreHorizontal,
  PaintBucket,
  Quote,
  Redo2,
  Rows3,
  Strikethrough,
  Table,
  Type,
  Underline,
  Undo2,
  Video,
  Italic,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadCover } from '@/lib/author-posts';
import { PARAGRAPH_SPACING, type ParagraphSpacingId } from './spaced-paragraph';

type Props = {
  editor: Editor;
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
  | 'spacing'
  | 'code'
  | 'image'
  | 'history'
  | 'toc'
  | 'table'
  | null;

const TABLE_MAX_ROWS = 8;
const TABLE_MAX_COLS = 8;

const CODE_LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'json', label: 'JSON' },
  { id: 'css', label: 'CSS' },
  { id: 'html', label: 'HTML' },
  { id: 'xml', label: 'XML' },
  { id: 'bash', label: 'Bash' },
  { id: 'shell', label: 'Shell' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' },
  { id: 'sql', label: 'SQL' },
  { id: 'markdown', label: 'Markdown' },
  { id: 'yaml', label: 'YAML' },
  { id: 'plaintext', label: '纯文本' },
] as const;

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

/** 避免点击工具栏时编辑器失焦、选区丢失（TipTap 惯例） */
function keepEditorSelection(e: ReactMouseEvent) {
  e.preventDefault();
}

function ToolBtn({
  label,
  active,
  disabled,
  onClick,
  children,
  title,
  buttonRef,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
  title?: string;
  buttonRef?: Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      title={title || label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={keepEditorSelection}
      onClick={onClick}
      className={cn('author-rt-tool', active && 'author-rt-tool--active')}
    >
      <span className="author-rt-tool-icon">{children}</span>
      <span className="author-rt-tool-label">{label}</span>
    </button>
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
      onMouseDown={keepEditorSelection}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function TableSizePicker({
  onPick,
}: {
  onPick: (rows: number, cols: number) => void;
}) {
  const [hover, setHover] = useState({ rows: 0, cols: 0 });
  const label =
    hover.rows > 0 && hover.cols > 0 ? `${hover.rows} × ${hover.cols}` : '选择行列';

  return (
    <div className="author-rt-table-picker" onMouseLeave={() => setHover({ rows: 0, cols: 0 })}>
      <p className="author-rt-table-picker-label">{label}</p>
      <div
        className="author-rt-table-grid"
        role="grid"
        aria-label="选择表格大小"
        style={{
          gridTemplateColumns: `repeat(${TABLE_MAX_COLS}, 1.05rem)`,
        }}
      >
        {Array.from({ length: TABLE_MAX_ROWS * TABLE_MAX_COLS }, (_, i) => {
          const row = Math.floor(i / TABLE_MAX_COLS) + 1;
          const col = (i % TABLE_MAX_COLS) + 1;
          const active = row <= hover.rows && col <= hover.cols;
          return (
            <button
              key={`${row}-${col}`}
              type="button"
              role="gridcell"
              aria-label={`${row} 行 ${col} 列`}
              className={cn('author-rt-table-cell', active && 'author-rt-table-cell--active')}
              onMouseDown={keepEditorSelection}
              onMouseEnter={() => setHover({ rows: row, cols: col })}
              onFocus={() => setHover({ rows: row, cols: col })}
              onClick={() => onPick(row, col)}
            />
          );
        })}
      </div>
    </div>
  );
}

function Dropdown({
  open,
  onClose,
  anchorRef,
  align = 'start',
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  align?: 'start' | 'end';
  className?: string;
  children: ReactNode;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({
    position: 'fixed',
    top: 0,
    left: 0,
    visibility: 'hidden',
  });

  const place = useCallback(() => {
    const anchor = anchorRef.current;
    const menu = menuRef.current;
    if (!anchor || !menu) return;

    const rect = anchor.getBoundingClientRect();
    const menuWidth = menu.offsetWidth || 160;
    const menuHeight = menu.offsetHeight || 80;
    const gap = 4;
    const pad = 8;

    let left = align === 'end' ? rect.right - menuWidth : rect.left;
    left = Math.min(Math.max(pad, left), window.innerWidth - menuWidth - pad);

    let top = rect.bottom + gap;
    if (top + menuHeight > window.innerHeight - pad) {
      top = Math.max(pad, rect.top - menuHeight - gap);
    }

    setStyle({
      position: 'fixed',
      top,
      left,
      visibility: 'visible',
      zIndex: 80,
    });
  }, [anchorRef, align]);

  useLayoutEffect(() => {
    if (!open) return;
    place();
  }, [open, place, children]);

  useEffect(() => {
    if (!open) return;
    const onWin = () => place();
    window.addEventListener('resize', onWin);
    // 捕获阶段：工具栏横向滚动也要重新定位
    window.addEventListener('scroll', onWin, true);
    return () => {
      window.removeEventListener('resize', onWin);
      window.removeEventListener('scroll', onWin, true);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (menuRef.current?.contains(t)) return;
      if (anchorRef.current?.contains(t)) return;
      onClose();
    }
    // 用 click 而不是 mousedown，避免与按钮 toggle 抢事件
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, [open, onClose, anchorRef]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div ref={menuRef} className={cn('author-rt-menu', className)} role="menu" style={style}>
      {children}
    </div>,
    document.body,
  );
}

function ToolbarMenu({
  id,
  label,
  icon,
  open,
  active,
  disabled,
  onToggle,
  onClose,
  align,
  menuClassName,
  children,
}: {
  id: string;
  label: string;
  icon: ReactNode;
  open: boolean;
  active?: boolean;
  disabled?: boolean;
  onToggle: () => void;
  onClose: () => void;
  align?: 'start' | 'end';
  menuClassName?: string;
  children: ReactNode;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  return (
    <div className="author-rt-tool-wrap">
      <ToolBtn
        label={label}
        active={active || open}
        disabled={disabled}
        buttonRef={btnRef}
        onClick={onToggle}
        title={label}
      >
        {icon}
      </ToolBtn>
      <Dropdown
        open={open}
        onClose={onClose}
        anchorRef={btnRef}
        align={align}
        className={menuClassName}
      >
        <div id={`${menuId}-${id}`}>{children}</div>
      </Dropdown>
    </div>
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

export function RichTextToolbar({ editor, historyItems, onRestoreHistory }: Props) {
  const [menu, setMenu] = useState<MenuKey>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const close = useCallback(() => setMenu(null), []);
  const toggle = useCallback((key: Exclude<MenuKey, null>) => {
    setMenu((m) => (m === key ? null : key));
  }, []);

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
      <div className="author-rt-toolbar-track">
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
          <ToolbarMenu
            id="history"
            label="历史"
            icon={<History />}
            open={menu === 'history'}
            onToggle={() => toggle('history')}
            onClose={close}
            menuClassName="author-rt-menu--wide"
          >
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
          </ToolbarMenu>
        </div>

        <div className="author-rt-group">
          <ToolbarMenu
            id="format"
            label="格式"
            icon={<Heading />}
            open={menu === 'format'}
            onToggle={() => toggle('format')}
            onClose={close}
          >
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
          </ToolbarMenu>
          <ToolBtn
            label="加粗"
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold />
          </ToolBtn>
          <ToolbarMenu
            id="color"
            label="颜色"
            icon={<Type />}
            open={menu === 'color'}
            onToggle={() => toggle('color')}
            onClose={close}
          >
            <div className="author-rt-swatches">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  className="author-rt-swatch"
                  style={{ background: c.value }}
                  onMouseDown={keepEditorSelection}
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
          </ToolbarMenu>
          <ToolbarMenu
            id="bg"
            label="背景"
            icon={<PaintBucket />}
            open={menu === 'bg'}
            onToggle={() => toggle('bg')}
            onClose={close}
          >
            <div className="author-rt-swatches">
              {BG_COLORS.filter((c) => c.value).map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  className="author-rt-swatch"
                  style={{ background: c.value }}
                  onMouseDown={keepEditorSelection}
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
          </ToolbarMenu>
          <ToolbarMenu
            id="more"
            label="其他"
            icon={<MoreHorizontal />}
            open={menu === 'more'}
            onToggle={() => toggle('more')}
            onClose={close}
          >
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
          </ToolbarMenu>
        </div>

        <div className="author-rt-group">
          <ToolbarMenu
            id="list"
            label="列表"
            icon={<List />}
            open={menu === 'list'}
            onToggle={() => toggle('list')}
            onClose={close}
          >
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
          </ToolbarMenu>
          <ToolbarMenu
            id="align"
            label="对齐"
            icon={<AlignLeft />}
            open={menu === 'align'}
            onToggle={() => toggle('align')}
            onClose={close}
          >
            {(
              [
                ['left', '左对齐', AlignLeft],
                ['center', '居中', AlignCenter],
                ['right', '右对齐', AlignRight],
                ['justify', '两端对齐', AlignJustify],
              ] as const
            ).map(([alignValue, label, Icon]) => (
              <MenuItem
                key={alignValue}
                active={editor.isActive({ textAlign: alignValue })}
                onClick={() => {
                  editor.chain().focus().setTextAlign(alignValue).run();
                  close();
                }}
              >
                <Icon className="size-3.5" /> {label}
              </MenuItem>
            ))}
          </ToolbarMenu>
          <ToolbarMenu
            id="spacing"
            label="段距"
            icon={<Rows3 />}
            open={menu === 'spacing'}
            active={Boolean(
              (editor.getAttributes('paragraph').spacing as string | null | undefined) &&
                editor.getAttributes('paragraph').spacing !== 'normal',
            )}
            onToggle={() => toggle('spacing')}
            onClose={close}
          >
            {PARAGRAPH_SPACING.map((item) => {
              const current =
                (editor.getAttributes('paragraph').spacing as ParagraphSpacingId | null) ??
                'normal';
              return (
                <MenuItem
                  key={item.id}
                  active={current === item.id}
                  onClick={() => {
                    editor.chain().focus().setParagraphSpacing(item.id).run();
                    close();
                  }}
                >
                  <span className="author-rt-spacing-item">
                    <span>{item.label}</span>
                    <span className="author-rt-spacing-hint">{item.hint}</span>
                  </span>
                </MenuItem>
              );
            })}
            <p className="author-rt-menu-caption">应用到全文</p>
            {PARAGRAPH_SPACING.map((item) => (
              <MenuItem
                key={`all-${item.id}`}
                onClick={() => {
                  editor.chain().focus().setAllParagraphSpacing(item.id).run();
                  close();
                }}
              >
                全文 · {item.label}
              </MenuItem>
            ))}
          </ToolbarMenu>
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
          <ToolbarMenu
            id="code"
            label="代码"
            icon={<Code2 />}
            open={menu === 'code'}
            onToggle={() => toggle('code')}
            onClose={close}
            menuClassName="author-rt-menu--wide"
          >
            <MenuItem
              active={editor.isActive('code')}
              onClick={() => {
                editor.chain().focus().toggleCode().run();
                close();
              }}
            >
              行内代码
            </MenuItem>
            <p className="author-rt-menu-empty">代码块语言</p>
            {CODE_LANGUAGES.map((lang) => (
              <MenuItem
                key={lang.id}
                active={editor.isActive('codeBlock', { language: lang.id })}
                onClick={() => {
                  if (editor.isActive('codeBlock')) {
                    editor.chain().focus().updateAttributes('codeBlock', { language: lang.id }).run();
                  } else {
                    editor.chain().focus().toggleCodeBlock({ language: lang.id }).run();
                  }
                  close();
                }}
              >
                {lang.label}
              </MenuItem>
            ))}
            {editor.isActive('codeBlock') ? (
              <MenuItem
                onClick={() => {
                  editor.chain().focus().toggleCodeBlock().run();
                  close();
                }}
              >
                取消代码块
              </MenuItem>
            ) : null}
          </ToolbarMenu>
          <ToolbarMenu
            id="table"
            label="表格"
            icon={<Table />}
            open={menu === 'table'}
            active={editor.isActive('table') || menu === 'table'}
            onToggle={() => toggle('table')}
            onClose={close}
          >
            {editor.isActive('table') ? (
              <>
                <MenuItem
                  onClick={() => {
                    editor.chain().focus().addColumnAfter().run();
                    close();
                  }}
                >
                  在右侧加列
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    editor.chain().focus().addRowAfter().run();
                    close();
                  }}
                >
                  在下方加行
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    editor.chain().focus().deleteColumn().run();
                    close();
                  }}
                >
                  删除当前列
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    editor.chain().focus().deleteRow().run();
                    close();
                  }}
                >
                  删除当前行
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    editor.chain().focus().deleteTable().run();
                    close();
                  }}
                >
                  删除整个表格
                </MenuItem>
              </>
            ) : (
              <TableSizePicker
                onPick={(rows, cols) => {
                  editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
                  close();
                }}
              />
            )}
          </ToolbarMenu>
        </div>

        <div className="author-rt-group">
          <ToolbarMenu
            id="image"
            label="图像"
            icon={<ImageIcon />}
            open={menu === 'image'}
            active={menu === 'image'}
            disabled={uploading}
            onToggle={() => toggle('image')}
            onClose={close}
          >
            <MenuItem
              onClick={() => {
                fileRef.current?.click();
              }}
            >
              {uploading ? '上传中…' : '上传图片'}
            </MenuItem>
            <MenuItem onClick={insertImageByUrl}>图片链接</MenuItem>
          </ToolbarMenu>
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
          <ToolBtn label="视频" onClick={insertVideo}>
            <Video />
          </ToolBtn>
          <ToolBtn label="链接" active={editor.isActive('link')} onClick={setLink}>
            <Link2 />
          </ToolBtn>
        </div>

        <div className="author-rt-group author-rt-group--last">
          <ToolbarMenu
            id="toc"
            label="目录"
            icon={<ListTree />}
            open={menu === 'toc'}
            onToggle={() => toggle('toc')}
            onClose={close}
            align="end"
            menuClassName="author-rt-menu--wide"
          >
            <MenuItem onClick={insertToc}>插入目录</MenuItem>
            {headings.length === 0 ? (
              <p className="author-rt-menu-empty">暂无标题</p>
            ) : (
              headings.map((h, i) => (
                <MenuItem
                  key={`${h.pos}-${i}`}
                  onClick={() => {
                    editor.chain().focus().setTextSelection(h.pos + 1).run();
                    close();
                  }}
                >
                  <span style={{ paddingLeft: `${(h.level - 1) * 0.65}rem` }}>
                    H{h.level} · {h.text}
                  </span>
                </MenuItem>
              ))
            )}
          </ToolbarMenu>
        </div>
      </div>
    </div>
  );
}
