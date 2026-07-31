'use client';

import { Button } from '@/components/ui/button';

type Props = {
  onInsert: (before: string, after?: string) => void;
};

export function MarkdownToolbar({ onInsert }: Props) {
  const buttons: Array<{ label: string; before: string; after?: string }> = [
    { label: '粗体', before: '**', after: '**' },
    { label: '斜体', before: '*', after: '*' },
    { label: '标题', before: '## ' },
    { label: '代码', before: '`', after: '`' },
    { label: '引用', before: '> ' },
    { label: '列表', before: '- ' },
    { label: '链接', before: '[', after: '](url)' },
  ];

  return (
    <div className="author-md-toolbar" role="toolbar" aria-label="Markdown 工具栏">
      {buttons.map((b) => (
        <Button
          key={b.label}
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => onInsert(b.before, b.after)}
        >
          {b.label}
        </Button>
      ))}
    </div>
  );
}
