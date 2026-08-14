# Research: 开放注册与文章表态（004）

**Feature**: `004-open-register-votes` | **Date**: 2026-08-14

---

## 1. 登录标识：用户名 vs 既有 email 列

**Decision**: Prisma `User` **新增** `username String @unique`；登录/注册 API 与 UI 使用 `username`。保留 `email` 列：种子作者写入真实或占位邮箱；新注册用户写入合成唯一占位（如 `{username}@users.local`），**不**对外暴露为登录字段。

**Rationale**: 规格明确「仅用户名」；现网 002 以 email 唯一列与 JWT claims 运作，硬删 email 迁移风险高。合成 email 满足非空唯一约束，实现成本最低。

**Alternatives considered**:
- 仅把 UI「账号」改叫用户名但仍存 email → 与「非邮箱」规格冲突，易混淆校验。
- 删除 email 改 username → 破坏既有 seed/合同/数据，迁移面过大。
- 邮箱可选可空 → 需改唯一约束与多处 DTO，收益低。

---

## 2. 注册成功后的会话策略

**Decision**: `POST /auth/register` **只建用户、不设 Cookie**；返回成功后前端跳转 `/login?username=...`（可预填），用户再调既有 `POST /auth/login`。

**Rationale**: 与 Clarification 一致；复用登录限流与 Cookie 签发路径，减少「半登录」状态。

**Alternatives considered**:
- 注册即登录 → 规格已拒绝。
- 注册返回一次性 token → 多余概念，违背简洁。

---

## 3. 角色与写作权限

**Decision**: 自助注册用户默认 `role = AUTHOR`；既有 `ADMIN`/`AUTHOR` 种子账号保留。作者入口与撰写 API 允许 `ADMIN | AUTHOR`（与 002/003 一致）。`USER` 角色本功能不发放。

**Rationale**: 规格「每位登录用户都是可写作的作者」；无需新角色枚举。

**Alternatives considered**:
- 注册为 `USER` 再单独开通写作 → 多一步运营概念，规格未要求。
- 所有人 `ADMIN` → 权限过宽。

---

## 4. 多作者文章归属

**Decision**: 所有作者写路径（`POST/PATCH/DELETE /author/posts*`、上传若绑定作者）以 JWT `sub` 为 `authorId`；列表「我的文章」过滤 `authorId = sub`；跨作者访问返回 404（不泄露存在性）或 403（实现二选一，推荐 **404** 与 003 一致）。

**Rationale**: 当前实现若仍 `firstAuthor()`，开放注册后会串稿，必须改。

**Alternatives considered**:
- 共享编辑池 → 超出规格。
- 仅前端隐藏他人文章 → 不安全。

---

## 5. slug 冲突

**Decision**: 维持 `Post.slug @unique` 全站唯一；创建/更新冲突返回 **409** + 简体中文提示。

**Rationale**: Clarification 选定全站唯一；库级唯一约束最简。

**Alternatives considered**:
- `(authorId, slug)` 复合唯一 → 规格已拒绝。
- 自动加后缀 → 可作后续增强，第一版明确提示用户改即可。

---

## 6. 表态数据模型

**Decision**: 新建 `PostReaction`：`id`, `postId`, `userId`, `value`（`LIKE` | `DISLIKE`），`@@unique([postId, userId])`。公开接口返回 `{ likeCount, dislikeCount, myReaction }`；写接口：`PUT` 设为赞/踩或 `DELETE` 取消（或单一 `PUT` 带 null 取消——合同选定 **PUT + DELETE**）。

**Rationale**: 一行一用户保证互斥；聚合 count 用 `groupBy` 或条件计数，小流量足够；不在 Post 上冗余计数以免不一致（若后期热点再加缓存计数）。

**Alternatives considered**:
- Post 上 `likeCount`/`dislikeCount` 无明细 → 无法表达 myReaction 与防刷。
- 同时允许赞和踩 → 规格要求互斥。

---

## 7. 未登录点击表态

**Decision**: 写接口 `401`；前端引导 `/login`（可带 `next` 回详情），并提供注册入口链接。

**Rationale**: 与 FR-008 一致。

---

## 8. 公开 DTO 增加作者

**Decision**: `PostSummary` / `PostDetail` 增加 `author: { id, username }`（id 可选；至少 username）。列表与详情 UI 展示 username。

**Rationale**: FR-012。

**Alternatives considered**:
- 仅详情带作者 → 规格要求列表也要。

---

## 9. 限流

**Decision**: 注册、登录、表态写操作启用 Throttler（按 IP；已登录表态可再按 userId 辅助）。具体数值实现阶段调优，合同要求「可触发 429 + 中文说明」。

**Rationale**: 开放注册后的基本防滥用；宪章简洁下不引入验证码/邮件。

---

## 10. 与产品定位的张力

**Decision**: 接受「轻量表态」作为阅读反馈，规格写明不做评论/关注等；方案不引入动态流或通知。

**Rationale**: 宪章反对社交堆砌；本功能边界已由 FR-010 锁死。
