# API Contracts: 极简个人博客

**Base URL**: `/api/v1`（后端 Nest；前端经环境变量指向）  
**格式**: JSON  
**文档**: Swagger（`@nestjs/swagger`）与本文件保持同构  
**认证**: 标注 `Public` 或 `Auth(Cookie JWT)`  

约定：
- 错误体：`{ "statusCode": number, "message": string | string[], "error": string }`
- 管理端分页：`page`（从 1）、`pageSize`、`sort`、`order`、`filter[...]`
- 公开文章全量列表：见 `GET /posts` 的 `all=true`

---

## 健康检查

### GET `/health`
- **Auth**: Public
- **200**: `{ "status": "ok" }`

---

## 认证（规格外模块；合同预留）

### POST `/auth/login`
- **Auth**: Public
- **Body**: `{ "email": string, "password": string }`
- **200**: 设置 HttpOnly Cookie（Access + Refresh）；可返回 `{ "user": { id, email, role } }`
- **401**: 凭证无效

### POST `/auth/refresh`
- **Auth**: Refresh Cookie
- **200**: 轮转 Access（及策略允许时 Refresh）

### POST `/auth/logout`
- **Auth**: Auth
- **204**: 清除 Cookie

---

## 文章 Posts

### GET `/posts`
- **Auth**: Public
- **Query**:
  - `all=true`：**001 首页必用**，返回全部 `published=true` 文章的摘要列表（不分页）
  - 若无 `all=true`：走统一分页（管理/其它客户端）
- **200 (all=true)**: `{ "items": PostSummary[] }`
- **PostSummary**: `{ id, title, slug, excerpt, coverImageUrl, publishedAt, tags: { name, slug }[] }`
- **排序**: `publishedAt` 降序
- **过滤**: 仅已发布；草稿不可见

### GET `/posts/:slug`
- **Auth**: Public
- **200**: `PostDetail`  
  `{ id, title, slug, content, excerpt, coverImageUrl, publishedAt, updatedAt, tags[], category? }`
- **404**: 不存在或未发布

### POST `/posts`（管理）
- **Auth**: Auth(ADMIN|AUTHOR)
- **Body**: CreatePostDto（title, slug, content, excerpt?, coverImageUrl?, published, publishedAt?, tagSlugs?, categoryId?）
- **201**: PostDetail
- **409**: slug 冲突

### PATCH `/posts/:id`（管理）
- **Auth**: Auth(ADMIN|AUTHOR)
- **Body**: UpdatePostDto（不可通过本接口「静默改 slug」除非显式字段且做冲突检查；**001 建议禁止改 slug**）
- **200**: PostDetail

### DELETE `/posts/:id`（管理）
- **Auth**: Auth(ADMIN|AUTHOR)
- **204**

### POST `/posts/import`（可选，Markdown 同步）
- **Auth**: Auth(ADMIN|AUTHOR) 或 CI Token
- **Body**: 单篇或批量 frontmatter+content
- **200**: 导入结果（created/updated/skipped + 错误列表）

---

## 标签 / 分类

### GET `/tags`
- **Auth**: Public
- **200**: `{ "items": { id, name, slug }[] }`  
  注：001 不做筛选 UI，接口可存在。

### GET `/categories`
- **Auth**: Public
- **200**: 同上结构

---

## 评论 Comments（规格外预留）

### GET `/posts/:slug/comments`
- **Auth**: Public
- **200**: `{ "items": CommentNode[] }` 树形或扁平+parentId  
  `CommentNode`: `{ id, content, author: { id, email? }, parentId, createdAt, children?: CommentNode[] }`

### POST `/posts/:slug/comments`
- **Auth**: Auth
- **Body**: `{ "content": string, "parentId"?: string }`
- **201**: Comment

---

## 上传 Uploads

### POST `/uploads`
- **Auth**: Auth(ADMIN|AUTHOR)
- **Content-Type**: multipart/form-data
- **200**: `{ "url": string, "id": string }`
- **存储**: 本地磁盘 MVP；服务内抽象 `StorageAdapter`（预留 S3）

---

## 前端衍生合同（非 Nest，但属交付接口）

| 资源 | 说明 |
|------|------|
| `GET /`（Next） | 首页列表；调用 `GET /api/v1/posts?all=true`；Metadata |
| `GET /posts/[slug]` | 详情；SSR 渲染 Markdown；Metadata |
| `GET /sitemap.xml` | 基于已发布文章生成 |
| `GET /robots.txt` | 允许抓取公开页 |

---

## 与规格映射

| 规格项 | 合同 |
|--------|------|
| 列表全部已发布 | `GET /posts?all=true` |
| 详情 slug | `GET /posts/:slug` |
| 显式发布 | 公开接口过滤 `published` |
| SEO | Next Metadata + sitemap + robots |
| 无评论 UI | 不实现评论页组件即可；API 可后开 |
| 无登录墙 | 公开路由不强制 Auth |
