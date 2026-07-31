'use client';

import { useRef, useState } from 'react';
import { uploadCover } from '@/lib/author-posts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Category = { id: string; name: string; slug: string };

type Props = {
  excerpt: string;
  coverImageUrl: string;
  tagInput: string;
  categoryId: string;
  categories: Category[];
  onExcerptChange: (v: string) => void;
  onCoverChange: (v: string) => void;
  onTagInputChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
};

export function PostMetaFields({
  excerpt,
  coverImageUrl,
  tagInput,
  categoryId,
  categories,
  onExcerptChange,
  onCoverChange,
  onTagInputChange,
  onCategoryChange,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const res = await uploadCover(file);
      onCoverChange(res.url);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : '上传失败');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="author-meta space-y-3">
      <div className="space-y-1.5">
        <Label className="font-normal text-[var(--ink-muted)]">摘要</Label>
        <Textarea
          rows={2}
          value={excerpt}
          onChange={(e) => onExcerptChange(e.target.value)}
          placeholder="一句话概括文章…"
          className="min-h-0 resize-none rounded-sm bg-[color-mix(in_srgb,var(--paper)_55%,transparent)]"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="font-normal text-[var(--ink-muted)]">封面 URL</Label>
        <Input
          type="url"
          value={coverImageUrl}
          onChange={(e) => onCoverChange(e.target.value)}
          placeholder="https://… 或上传"
          className="h-9 rounded-sm bg-[color-mix(in_srgb,var(--paper)_55%,transparent)]"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="font-normal text-[var(--ink-muted)]">封面上传</Label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? '上传中…' : '选择图片'}
        </Button>
        {uploadError ? (
          <p className="text-sm text-destructive" role="alert">
            {uploadError}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label className="font-normal text-[var(--ink-muted)]">标签</Label>
        <Input
          type="text"
          value={tagInput}
          onChange={(e) => onTagInputChange(e.target.value)}
          placeholder="用逗号分隔，如：随笔, 技术"
          className="h-9 rounded-sm bg-[color-mix(in_srgb,var(--paper)_55%,transparent)]"
        />
      </div>

      {categories.length > 0 ? (
        <div className="space-y-1.5">
          <Label className="font-normal text-[var(--ink-muted)]">分类</Label>
          <Select
            value={categoryId || 'none'}
            onValueChange={(v) => onCategoryChange(!v || v === 'none' ? '' : String(v))}
          >
            <SelectTrigger className="h-9 w-full rounded-sm bg-[color-mix(in_srgb,var(--paper)_55%,transparent)]">
              <SelectValue placeholder="无" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">无</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </div>
  );
}
