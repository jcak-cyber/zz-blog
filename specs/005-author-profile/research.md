# Research: 个人中心资料（005）

**Feature**: `005-author-profile` | **Date**: 2026-08-14

---

## 1. 昵称存储与默认值

**Decision**: `User` 新增必填字段 `nickname String`（非唯一）。注册时 `nickname = username`；迁移对既有行 `UPDATE ... SET nickname = username`；PATCH 禁止空字符串。

**Rationale**: 与 Clarification「必填、默认等于用户名、不可清空」一致；不要求唯一，避免与登录用户名抢唯一约束。

**Alternatives considered**:
- 可空昵称 + 公开回退 username → 规格已拒绝。
- 昵称也 `@unique` → 无规格要求，增加冲突处理成本。

---

## 2. 头像存储策略

**Decision**: `User.avatarUrl String?` 存公开相对路径（如 `/uploads/uuid.jpg`）。上传走既有 `POST /uploads`；成功后 `PATCH /auth/profile` 写入 `avatarUrl`。更换/删除时：先（可选）`DELETE /uploads` 清旧文件，再把 `avatarUrl` 更新为新 URL 或 `null`。

**Rationale**: 复用本地存储与鉴权，无新存储后端；与封面图同一模式，实现成本最低。

**Alternatives considered**:
- 专用 `POST /auth/avatar` 内联 multer → 重复上传链路。
- 把头像二进制塞进 DB → 违背既有 uploads 习惯与性能原则。

---

## 3. 头像体积与类型（用户可见约束）

**Decision**: 个人中心客户端 + 服务端 profile 写入前约定：**JPEG / PNG / WebP**；建议上限 **2 MiB**（界面提示）。底层 `POST /uploads` 仍可保留既有 12 MiB 上限作通用通道，但个人中心 MUST 在提交前按 2 MiB / MIME 拦截并给出中文提示。

**Rationale**: 头像场景无需文章插图那么大；收紧体验与带宽，又不改动通用上传对撰写台的兼容。

**Alternatives considered**:
- 全面把 uploads 降到 2 MiB → 可能影响封面/正文大图。
- 不限制 → 易拖慢个人中心与缓存。

---

## 4. 个人简介保存

**Decision**: `User.bio String?`（空 = null 或 `''` 归一为未填写）。前端显式「保存简介」调用 `PATCH /auth/profile`；失焦不自动保存。最大长度 **500** 字符（Unicode 码点计或按 JS `length` 明确一种，实现统一并用文案提示「最多 500 字」）。

**Rationale**: Clarification 要求显式保存；500 字落在「数百字」默认且可测。

**Alternatives considered**:
- 失焦自动保存 → 规格已拒绝。
- 1000+ 字 → 个人中心卡片过重，YAGNI。

---

## 5. API 形态

**Decision**:
- 扩展 `GET /auth/me`：返回 `{ id, username, role, nickname, avatarUrl, bio }`
- 新增 `PATCH /auth/profile`：body 可选 `nickname` / `avatarUrl` / `bio`（`avatarUrl: null` 表示删除头像）；仅本人 JWT
- 注册响应与 login/`me` 对齐含 `nickname`（及空 `avatarUrl`/`bio`）

**Rationale**: 资料属会话用户自身，挂在 auth 最自然；避免另开 CRUD 资源。

**Alternatives considered**:
- `PUT /users/me` 新模块 → 多余边界。
- 三个独立端点 → 接口碎片化。

---

## 6. 公开作者展示

**Decision**: 公开 Summary/Detail 的 `author` 增加 `nickname`；前端列表/详情**显示 `nickname`**（必有值）。`username` 可继续随 DTO 下发供调试，但 UI 不以用户名作为作者展示名。

**Rationale**: FR-012；与登录标识分离。

**Alternatives considered**:
- 只返回 `displayName` 合成字段 → 丢失 username 不利于后续扩展。
- 公开仍显示 username → 违背本规格。

---

## 7. 前端交互拆分

**Decision**: 在 `author-entry`（或拆出的 profile 子组件）实现：左侧昵称 +「修改昵称」（对话框或行内表单均可，实现任选一种并给成功/失败反馈）；右侧圆形头像（选文件上传 → PATCH）、有头像时显示删除；简介 textarea +「保存简介」按钮。保留「我的文章 / 写新文章 / 登出 / 返回阅读」。

**Rationale**: 对齐 UI 参照与 US4；不新开路由。

**Alternatives considered**:
- 独立 `/author/settings` 页 → 多一跳，偏离图示「手稿台即个人中心」。
