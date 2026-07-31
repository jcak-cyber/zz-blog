# Data Model: 极简个人博客（第一版）

**Feature**: `001-personal-blog` | **Date**: 2026-07-30  
**存储**: PostgreSQL + Prisma  
**说明**: 含计划输入的完整模型；标注与现行规格的关系。

---

## 实体关系（概览）

```text
User 1──* Post
User 1──* Comment
Post *──* Tag（隐式 PostTag）
Post *──* Category（可选：多对一或多对多；本计划采用 Post 多对一 Category，另保留 Post*──*Tag）
Post 1──* Comment
Comment 1──* Comment（parentId 自引用，嵌套）
```

---

## User（用户）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID / CUID | PK | |
| email | String | 唯一、必填 | 登录标识 |
| passwordHash | String | 必填 | bcrypt |
| role | Enum | 必填 | `ADMIN` \| `AUTHOR` \| `USER`（MVP 可用 ADMIN/USER） |
| createdAt | DateTime | 必填 | |
| updatedAt | DateTime | 必填 | |

**校验**: email 格式；密码仅接受明文于写入 DTO，入库前哈希。  
**规格关系**: 模块存在；**001 公开验收不依赖读者注册登录**（见 research R-003）。

---

## Post（文章）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID / CUID | PK | |
| title | String | 必填 | |
| slug | String | 唯一、必填（公开前） | 可读 URL 标识；不随 title 变更 |
| content | Text | 必填 | Markdown/MDX 源 |
| excerpt | String | 可选 | 摘要 |
| coverImageUrl | String | 可选 | 封面 |
| published | Boolean | 必填，默认 false | 显式发布标记 |
| publishedAt | DateTime | 公开前必填 | 列表排序；缺失则不可公开 |
| authorId | FK → User | 必填 | |
| categoryId | FK → Category | 可选 | |
| createdAt / updatedAt | DateTime | 必填 | |

**公开可见规则**（对齐规格澄清）:
1. `published === true`
2. `slug` 非空且唯一
3. `publishedAt` 合法
4. 否则对公开 API 不可见（404/不进列表）

**状态转换**:
- 草稿/未标记 → 已发布：置 `published=true` 且满足 slug、publishedAt
- 已发布 → 撤回：`published=false`（立即从公开列表消失）
- 改标题：允许；**禁止**自动改 slug

**规格关系**: 核心实体；Markdown 同步写入本表。

---

## Tag（标签）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID / CUID | PK | |
| name | String | 必填 | |
| slug | String | 唯一、必填 | |

**关系**: `Post` ↔ `Tag` 多对多（`PostTag`）。  
**规格关系**: 可存储与详情展示；**第一版不做筛选 UI**（FR-011）。

---

## Category（分类）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID / CUID | PK | |
| name | String | 必填 | |
| slug | String | 唯一、必填 | |

**关系**: `Post.categoryId` 多对一（可空）。  
**规格关系**: 计划数据模型需要；001 不交付分类筛选 UI。

---

## Comment（评论）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID / CUID | PK | |
| content | Text | 必填 | |
| postId | FK → Post | 必填 | |
| authorId | FK → User | 必填 | |
| parentId | FK → Comment | 可选 | 空=根评论 |
| createdAt / updatedAt | DateTime | 必填 | |

**规则**:
- 嵌套深度建议实现时限制（如 ≤3），防止过深树
- 删除策略：软删或级联——实现阶段选定；合同先按「隐藏/软删」预留

**规格关系**: **规格外预留**；公开 UI 默认不交付。

---

## Upload / 文件（逻辑实体，可无独立表或简易表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | |
| path / url | String | 本地磁盘相对路径或对外 URL |
| mimeType | String | |
| size | Int | |
| createdBy | FK User | |
| createdAt | DateTime | |

MVP 存本地磁盘；接口抽象便于换 S3。

---

## 索引建议

- `Post(slug)` 唯一
- `Post(published, publishedAt DESC)` 公开列表
- `Tag(slug)` / `Category(slug)` 唯一
- `Comment(postId, parentId)` 树查询
- `User(email)` 唯一

---

## 校验规则汇总

| 规则 ID | 描述 |
|---------|------|
| V-POST-01 | 公开内容必须 published + slug + publishedAt |
| V-POST-02 | slug 唯一；冲突拒绝写入，不得覆盖 |
| V-POST-03 | 公开列表按 publishedAt 降序，返回全部已发布 |
| V-USER-01 | 密码 bcrypt；禁止存明文 |
| V-COMMENT-01 | parentId 若存在必须同属一 postId |
