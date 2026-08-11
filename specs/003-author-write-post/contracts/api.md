# API Contracts: 作者撰写文章（003）

**Base URL**: `/api/v1`  
**格式**: JSON  
**认证**: Cookie JWT（`Auth` = ADMIN \| AUTHOR）；浏览器 `credentials: include`  
**错误体**: `{ "statusCode", "message", "error" }`（简体中文 message）

公开读合同仍以 001 为准，本文件补充**可见性变更**与**作者写合同**。

---

## 公开读（变更）

### GET `/posts?all=true`

- **Auth**: Public  
- **过滤**: `published=true` 且（`scheduledAt` 为空或 `<= now`）  
- **排序**: `publishedAt` 降序  
- **200**: `{ "items": PostSummary[] }`（字段同 001）

### GET `/posts/:slug`

- **Auth**: Public  
- **200**: 仅当满足公开可见规则  
- **404**: 不存在、草稿、或预约未到期

---

## 作者：我的文章

### GET `/author/posts`

- **Auth**: Auth  
- **Query**: 可选 `status=draft|scheduled|published`；可选分页  
- **200**: `{ "items": AuthorPostSummary[] }`  
  `AuthorPostSummary`: `{ id, title, slug, excerpt, coverImageUrl, status, publishedAt, scheduledAt, updatedAt }`  
  `status`: `draft` \| `scheduled` \| `published`（服务端按 data-model 派生）

---

## 作者：撰写

### POST `/author/posts`

- **Auth**: Auth  
- **Body**:
  ```json
  {
    "title": "string",
    "slug": "string",
    "content": "string",
    "excerpt": "string?",
    "coverImageUrl": "string?",
    "tagNames": ["string"]?,
    "categoryId": "string?",
    "action": "draft" | "publish" | "schedule",
    "scheduledAt": "ISO-8601?"
  }
  ```
- **行为**:
  - `draft` → 草稿  
  - `publish` → 立即公开（`scheduledAt` 忽略或清空）  
  - `schedule` → 预约（需未来 `scheduledAt`；若时间已过则按立即发布或 400，与产品约定一致）
- **201**: `AuthorPostDetail`  
- **400**: 校验失败（发布/预约时缺标题正文等）  
- **409**: slug 冲突

### GET `/author/posts/:id`

- **Auth**: Auth  
- **200**: `AuthorPostDetail`（含 content、tags、status 等）  
- **404**: 非本人或不存在

### PATCH `/author/posts/:id`

- **Auth**: Auth  
- **Body**: 同创建 字段的部分更新 + `action?`（`draft` \| `publish` \| `schedule` \| `unpublish`）  
- **Slug**: 已公开可见时默认拒绝修改；若带 `confirmSlugChange: true` 允许并记警告语义  
- **200**: `AuthorPostDetail`  
- **409**: slug 冲突

### DELETE `/author/posts/:id`

- **Auth**: Auth  
- **204**: 删除成功（草稿或已发布均可；前端须先确认）  
- **404**: 不存在

---

## 封面上传

### POST `/uploads`

- **Auth**: Auth（JWT）**或** 既有 import-token（脚本）  
- **Content-Type**: multipart  
- **201**: `{ "url": string, ... }`  
- 作者编辑器使用返回的 `url` 写入 `coverImageUrl`

### DELETE `/uploads`

- **Auth**: Auth（JWT）**或** import-token  
- **Body**: `{ "url": "/uploads/<uuid>.<ext>" }`  
- **204**: 删除成功（文件不存在也视为成功）  
- **400**: 非本站上传路径 / 非法路径  

---

## 前端页面合同（验收）

| 路径 | 规则 |
|------|------|
| `/author` | Auth；入口链到列表/新建 |
| `/author/posts` | Auth；我的文章列表 |
| `/author/posts/new` | Auth；三栏编辑器（墨色风格） |
| `/author/posts/[id]/edit` | Auth；编辑 |
| `/`、`/posts/[slug]` | Public；遵守新可见性 |

---

## 明确不在 003 合同

- 评论开关、点赞  
- 将 Web 编辑结果写回 `content/posts` 文件  
- 公众注册
