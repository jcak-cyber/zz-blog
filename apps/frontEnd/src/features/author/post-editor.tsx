'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  createAuthorPost,
  deleteAuthorPost,
  listCategories,
  updateAuthorPost,
  type AuthorPostDetail,
  type AuthorPostAction,
} from '@/lib/author-posts';
import { useNavigationLoading } from '@/features/navigation/navigation-provider';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { suggestSlugFromTitle } from './slug-suggest';
import { RichTextEditor } from './rich-text-editor';
import { PostMetaFields } from './post-meta-fields';
import { PostPreview } from './post-preview';

type Props = {
  mode: 'create' | 'edit';
  initial?: AuthorPostDetail | null;
};

function parseTags(raw: string) {
  return raw
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function toLocalInputValue(iso: string | null | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PostEditor({ mode, initial }: Props) {
  const router = useRouter();
  const { startNavigating } = useNavigationLoading();
  const slugTouched = useRef(Boolean(initial?.slug));
  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '');
  const [coverImageUrl, setCoverImageUrl] = useState(initial?.coverImageUrl ?? '');
  const [tagInput, setTagInput] = useState(initial?.tags?.map((t) => t.name).join(', ') ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '');
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>(
    [],
  );
  const [scheduledLocal, setScheduledLocal] = useState(toLocalInputValue(initial?.scheduledAt));
  const [confirmSlugChange, setConfirmSlugChange] = useState(false);
  const [slugExpanded, setSlugExpanded] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [unpublishOpen, setUnpublishOpen] = useState(false);

  const slugLocked = Boolean(initial?.slugLocked) && !confirmSlugChange;
  const wordCount = useMemo(() => content.replace(/\s/g, '').length, [content]);

  useEffect(() => {
    let cancelled = false;
    listCategories()
      .then((items) => {
        if (!cancelled) setCategories(items);
      })
      .catch(() => {
        /* optional */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function onTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched.current && !slugLocked) {
      setSlug(suggestSlugFromTitle(value));
    }
  }

  function payload(action: AuthorPostAction) {
    return {
      title,
      slug,
      content,
      excerpt: excerpt || null,
      coverImageUrl: coverImageUrl || null,
      tagNames: parseTags(tagInput),
      categoryId: categoryId || null,
      action,
      scheduledAt:
        action === 'schedule' && scheduledLocal
          ? new Date(scheduledLocal).toISOString()
          : action === 'draft' || action === 'unpublish' || action === 'publish'
            ? null
            : undefined,
      confirmSlugChange: confirmSlugChange || undefined,
    };
  }

  async function run(action: AuthorPostAction, opts?: { redirect?: boolean }) {
    setPending(action);
    setError(null);
    setMessage(null);
    try {
      let saved: AuthorPostDetail;
      if (mode === 'create') {
        saved = await createAuthorPost({ ...payload(action), action });
      } else if (initial) {
        saved = await updateAuthorPost(initial.id, payload(action));
      } else {
        throw new Error('缺少文章');
      }

      if (action === 'draft') setMessage('草稿已保存');
      if (action === 'publish') setMessage('已发布');
      if (action === 'schedule') setMessage('已预约发布');
      if (action === 'unpublish') setMessage('已撤回为草稿');

      if (opts?.redirect !== false) {
        if (action === 'publish') {
          startNavigating();
          router.push(`/posts/${saved.slug}`);
          router.refresh();
          return;
        }
        if (mode === 'create') {
          startNavigating();
          router.replace(`/author/posts/${saved.id}/edit`);
          router.refresh();
          return;
        }
        router.refresh();
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : '操作失败';
      setError(msg);
      if (/slug|别名|网址/i.test(msg)) setSlugExpanded(true);
    } finally {
      setPending(null);
    }
  }

  async function confirmDelete() {
    if (!initial) return;
    setPending('delete');
    setError(null);
    try {
      await deleteAuthorPost(initial.id);
      setDeleteOpen(false);
      startNavigating();
      router.push('/author/posts');
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '删除失败');
      setPending(null);
    }
  }

  async function confirmUnpublish() {
    setUnpublishOpen(false);
    await run('unpublish', { redirect: false });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
  }

  const deleteDescription =
    initial?.slugLocked || initial?.status === 'published' || initial?.status === 'scheduled'
      ? '确定删除这篇已发布/预约的文章吗？删除后公众将无法访问。'
      : '确定删除这篇草稿吗？';

  return (
    <form className="author-editor" onSubmit={onSubmit}>
      <header className="author-editor-top">
        <div className="author-editor-heading">
          <p className="author-eyebrow">WRITING DESK</p>
          <h1 className="font-brush text-2xl leading-none">
            {mode === 'create' ? '写新文章' : '继续编辑'}
          </h1>
        </div>
        <div className="author-editor-actions">
          {(error || message) && (
            <p
              className={cn(
                'author-msg author-msg--inline',
                error ? 'author-msg--error' : 'author-msg--ok',
              )}
              role={error ? 'alert' : undefined}
            >
              {error ?? message}
            </p>
          )}
          <Link
            href="/author/posts"
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
          >
            我的文章
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={Boolean(pending)}
            onClick={() => run('draft')}
          >
            {pending === 'draft' ? '保存中…' : '保存草稿'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={Boolean(pending) || !scheduledLocal}
            onClick={() => run('schedule')}
          >
            {pending === 'schedule' ? '预约中…' : '预约发布'}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={Boolean(pending)}
            onClick={() => run('publish')}
          >
            {pending === 'publish' ? '发布中…' : '立即发布'}
          </Button>
        </div>
      </header>

      <div className="author-editor-grid">
        <aside className="author-col author-col--meta">
          <div className="author-col-scroll space-y-3">
            <div className="space-y-1.5">
              <Label className="font-normal text-[var(--ink-muted)]">标题</Label>
              <Input
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="文章标题"
                required
                className="h-9 rounded-sm bg-[color-mix(in_srgb,var(--paper)_55%,transparent)]"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label className="font-normal text-[var(--ink-muted)]">
                  网址
                  {slugLocked ? ' · 已锁定' : ''}
                </Label>
                <button
                  type="button"
                  className="shrink-0 text-xs text-[var(--ink-muted)] underline-offset-2 hover:text-[var(--accent)] hover:underline"
                  onClick={() => setSlugExpanded((v) => !v)}
                >
                  {slugExpanded ? '收起' : '自定义'}
                </button>
              </div>
              {!slugExpanded ? (
                <p
                  className="truncate rounded-sm border border-[var(--line)] bg-[color-mix(in_srgb,var(--paper)_35%,transparent)] px-2.5 py-2 font-mono text-xs text-[var(--ink-muted)]"
                  title={slug ? `/posts/${slug}` : '随标题自动生成'}
                >
                  {slug ? `/posts/${slug}` : '随标题自动生成'}
                </p>
              ) : (
                <div className="space-y-2">
                  <Input
                    value={slug}
                    disabled={slugLocked}
                    onChange={(e) => {
                      slugTouched.current = true;
                      setSlug(e.target.value);
                    }}
                    placeholder="my-post"
                    className="h-9 rounded-sm bg-[color-mix(in_srgb,var(--paper)_55%,transparent)] font-mono text-sm"
                  />
                  {initial?.slugLocked ? (
                    <label className="flex items-center gap-2 text-xs text-[var(--ink-muted)]">
                      <Checkbox
                        checked={confirmSlugChange}
                        onCheckedChange={(v) => setConfirmSlugChange(v === true)}
                      />
                      确认修改已公开文章的网址（旧链接将失效）
                    </label>
                  ) : (
                    <p className="text-[11px] leading-snug text-[var(--ink-muted)]">
                      公开地址为 /posts/别名；未自定义时随标题自动更新。
                    </p>
                  )}
                </div>
              )}
            </div>

            <PostMetaFields
              excerpt={excerpt}
              coverImageUrl={coverImageUrl}
              tagInput={tagInput}
              categoryId={categoryId}
              categories={categories}
              onExcerptChange={setExcerpt}
              onCoverChange={setCoverImageUrl}
              onTagInputChange={setTagInput}
              onCategoryChange={setCategoryId}
              onCoverRemoved={
                mode === 'edit' && initial
                  ? async () => {
                      await updateAuthorPost(initial.id, {
                        title,
                        slug,
                        content,
                        excerpt: excerpt || null,
                        coverImageUrl: null,
                        tagNames: parseTags(tagInput),
                        categoryId: categoryId || null,
                      });
                    }
                  : undefined
              }
            />

            <div className="space-y-1.5">
              <Label className="font-normal text-[var(--ink-muted)]">预约发布时间</Label>
              <Input
                type="datetime-local"
                value={scheduledLocal}
                onChange={(e) => setScheduledLocal(e.target.value)}
                className="h-9 rounded-sm bg-[color-mix(in_srgb,var(--paper)_55%,transparent)]"
              />
            </div>

            {mode === 'edit' && initial ? (
              <div className="author-danger-zone">
                {(initial.status === 'published' || initial.status === 'scheduled') && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={Boolean(pending)}
                    onClick={() => setUnpublishOpen(true)}
                  >
                    撤回为草稿
                  </Button>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={Boolean(pending)}
                  onClick={() => setDeleteOpen(true)}
                >
                  删除文章
                </Button>
              </div>
            ) : null}
          </div>
        </aside>

        <section className="author-col author-col--write">
          <RichTextEditor value={content} onChange={setContent} />
          <p className="author-wordcount">字数（不含空白）：{wordCount}</p>
        </section>

        <aside className="author-col author-col--preview">
          <div className="author-col-scroll">
            <PostPreview
              mode="card"
              title={title}
              excerpt={excerpt}
              coverImageUrl={coverImageUrl}
              content={content}
            />
            <PostPreview
              mode="body"
              title={title}
              excerpt={excerpt}
              coverImageUrl={coverImageUrl}
              content={content}
            />
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="删除文章"
        description={deleteDescription}
        confirmLabel="确认删除"
        destructive
        pending={pending === 'delete'}
        onConfirm={confirmDelete}
      />
      <ConfirmDialog
        open={unpublishOpen}
        onOpenChange={setUnpublishOpen}
        title="撤回为草稿"
        description="确定将文章撤回为草稿吗？公开页面将立即不可见。"
        confirmLabel="确认撤回"
        destructive
        pending={pending === 'unpublish'}
        onConfirm={confirmUnpublish}
      />
    </form>
  );
}
