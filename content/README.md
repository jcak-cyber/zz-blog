# 内容目录

将 Markdown 文章放在 `posts/`。

## Frontmatter 约定

| 字段 | 说明 |
|------|------|
| title | 标题（必填） |
| slug | 唯一可读标识（公开必填） |
| published / draft | 显式发布标记 |
| date | 发布日期（公开必填） |
| excerpt | 摘要 |
| tags | 标签数组 |
| cover | 封面图 URL |

## 导入

```bash
# 后端运行后
cd apps/backEnd
pnpm import:content
```
