# Research: 文章评论侧栏（006）

**Feature**: `006-post-comments` | **Date**: 2026-09-16

---

## 1. 复用既有 Comment 模型 vs 新建表

**Decision**: 复用 Prisma 已有 `Comment`（`content` / `postId` / `authorId` / `parentId` / 时间戳）。首版 API **始终创建 `parentId = null`**，列表只查顶层评论；不实现楼中楼 UI。

**Rationale**: 规格明确扁平列表；已有模型避免重复迁移；保留 `parentId` 不阻塞未来扩展。

**Alternatives considered**:
- 新建独立表 → 重复实体，无收益。
- 首版就做嵌套回复 → 违背 FR-009 / YAGNI。

---

## 2. 评论点赞存储

**Decision**: 新建 `CommentReaction`：`commentId` + `userId` 唯一；仅「赞」一种值（布尔存在即赞）。列表返回 `likeCount` 与当前用户 `likedByMe`。删除评论时 Cascade 清除点赞行。

**Rationale**: 与 `PostReaction` 模式一致；规格只要点赞不要踩；数字来自 count 聚合。

**Alternatives considered**:
- 复用 `PostReaction` 表并加可空 `commentId` → 语义混乱。
- 在 Comment 上缓存 `likeCount` 列 → 需维护一致性，首版规模不需要。

---

## 3. 详情首屏与列表加载时机

**Decision**:
- 文章详情（SSR 或轻量接口）提供 **`commentCount`**（`COUNT(*)` where postId）。
- **评论列表**仅在用户打开侧栏时请求（客户端 fetch）。
- 发表/删除/点赞成功后本地更新列表与 count，并可再拉 count 对齐。

**Rationale**: 满足 FR-011 / SC-004，避免首屏拉大列表。

**Alternatives considered**:
- 首屏内嵌全部评论 → 违背性能门禁。
- 完全不带 count、打开侧栏才显示数字 → 入口「评论 N」体验差。

---

## 4. 发表频率限制（约 30 秒 1 条）

**Decision**: 业务层：创建前查询该用户对该 `postId` 最近一条评论的 `createdAt`；若距今 &lt; 30s，返回 **429**（或 400）与中文「请稍后再试」。不单独建限流表。全局 `Throttler` 仍保留作防刷补充。

**Rationale**: 规格按「同用户同文」计；查最近一条简单可靠，跨实例亦正确（以 DB 时间为准）。

**Alternatives considered**:
- 仅内存 Map 限流 → 多实例/重启不一致。
- 仅靠全局 120/min → 无法表达「同文 30s」。

---

## 5. 删除权限与硬删除

**Decision**: 允许删除当且仅当：`user.id === comment.authorId` **或** `user.id === post.authorId` **或** `user.role === ADMIN`。使用 Prisma `delete`（物理删除）；关联 `CommentReaction` Cascade。

**Rationale**: 对齐 Clarifications；无回收站需求。

**Alternatives considered**:
- 软删除 `deletedAt` → 规格已选直接删除。
- 仅本人可删 → 规格已要求文作者/管理员也可删。

---

## 6. 字数统计

**Decision**: 上下限按 **Unicode 码点**计（实现可用 `[...content.trim()].length` 或等价）；上限 **1000**；空白-only 视为空。前端实时提示「还能输入 N 个字符」。

**Rationale**: 与中文「字符」直觉接近；表情按码点计即可（不强制 grapheme cluster）。

**Alternatives considered**:
- UTF-16 `string.length` → 部分表情算 2，体验略怪。
- 按字节 → 对用户不可理解。

---

## 7. 列表分页

**Decision**: 首版 `GET` 支持 `page` / `pageSize`（默认 pageSize=20，上限 50）；按 `createdAt DESC`。侧栏滚动加载或「加载更多」二选一，实现时优先简单分页即可。

**Rationale**: 防止单文评论极多时一次过大；个人站默认 20 足够。

**Alternatives considered**:
- 一次拉全量 → 简单但违背超长列表边界。
- 游标分页 → 略复杂，可后续再上。

---

## 8. 前端交互与视觉

**Decision**: 右侧 Drawer/Sheet（可用现有 UI 原语或轻量 fixed 面板）；表情/图片按钮可见但图片点击提示「后续开放」；表情不强制面板（输入法表情即可）。视觉融入阅读页变量色，不强制设计图纯黑皮肤。

**Rationale**: 对齐 UI 参照与 FR-010；宪章一致性。

**Alternatives considered**:
- 页内嵌评论区 → 与设计图侧栏不符且占阅读流。
- 完整表情/图片上传 → 首版范围外。

---

## 9. 未登录发表 / 点赞

**Decision**: 写操作走 `JwtAuthGuard`；401 时前端引导 `/login`（可带回跳详情）。读列表与 count 公开。

**Rationale**: 与既有赞踩一致；满足 FR-005 / FR-008。
