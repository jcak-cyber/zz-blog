# Tasks: 个人中心资料（昵称 / 头像 / 简介）

**Input**: Design documents from `/specs/005-author-profile/`

**Prerequisites**: plan.md（必需）、spec.md（必需）、research.md、data-model.md、contracts/、quickstart.md

**Tests**: 规格未要求 TDD；本清单**不包含**强制自动化测试任务。验收以 `quickstart.md` 为准。

**Organization**: 按用户故事分阶段；依赖 004 开放注册与手稿台已可用。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行（不同文件、无未完成依赖）
- **[Story]**: 仅用户故事阶段使用（如 [US1]）
- 描述须含明确文件路径

## Path Conventions

- 前端：`apps/frontEnd/`
- 后端：`apps/backEnd/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 确认可扩展目录与合同对照

- [X] T001 对照 `specs/005-author-profile/contracts/api.md` 列出待改 auth/posts/uploads 端点与 DTO 增量（实现备注可贴在 PR/任务评论）
- [X] T002 [P] 确认前端可扩展路径存在：`apps/frontEnd/src/features/auth/`、`apps/frontEnd/src/lib/auth.ts`、`apps/frontEnd/src/features/posts/`
- [X] T003 [P] 确认后端可扩展路径存在：`apps/backEnd/src/modules/auth/`、`apps/backEnd/src/modules/posts/`、`apps/backEnd/src/modules/uploads/`、`apps/backEnd/prisma/schema.prisma`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: User 资料三字段、迁移回填、注册/me 对齐——阻塞所有用户故事

**⚠️ CRITICAL**: 未完成本阶段前不得开始 US1–US4 主实现

- [X] T004 在 `apps/backEnd/prisma/schema.prisma` 为 `User` 增加 `nickname String`、`avatarUrl String?`、`bio String?`
- [X] T005 生成并应用迁移：`apps/backEnd/prisma/migrations/`（既有行 `nickname = username` 后 NOT NULL）
- [X] T006 更新 seed：`apps/backEnd/prisma/seed.ts` 为种子用户写入 `nickname`（默认同 username）
- [X] T007 注册创建用户时写入 `nickname = username`：`apps/backEnd/src/modules/auth/auth.service.ts`
- [X] T008 扩展 `AuthUserDto` 与 `toUserDto` / `GET /auth/me` 返回 `nickname`、`avatarUrl`、`bio`：`apps/backEnd/src/modules/auth/dto/auth-user.dto.ts`、`auth.service.ts`
- [X] T009 实现 `PATCH /auth/profile`（可选 nickname/avatarUrl/bio；空昵称拒绝；bio≤500；avatarUrl null 删头像；尽力删旧 uploads 文件；Throttle）：`apps/backEnd/src/modules/auth/`（dto + controller + service）
- [X] T010 前端 `AuthUser` 类型与 `fetchMe` 对齐新字段：`apps/frontEnd/src/lib/auth.ts`
- [X] T011 前端封装 `updateProfile`（PATCH `/auth/profile`）：`apps/frontEnd/src/lib/auth.ts`
- [X] T012 登录/注册成功响应消费侧兼容新字段（不破坏既有会话）：`apps/frontEnd/src/features/auth/`、`apps/frontEnd/src/features/auth/auth-provider.tsx`

**Checkpoint**: 迁移成功；`/auth/me` 含 nickname；空库新注册用户 nickname=username

---

## Phase 3: User Story 1 - 修改并展示昵称 (Priority: P1) 🎯 MVP

**Goal**: 个人中心可改昵称；公开文章作者显示昵称；登录用户名不变

**Independent Test**: 改昵称并刷新仍在；「当前账号」仍为 username；公开列表/详情作者名为新昵称（quickstart 场景 A）

### Implementation for User Story 1

- [X] T013 [US1] 公开文章 author 投影增加 `nickname`：`apps/backEnd/src/modules/posts/posts.repository.ts`、`posts.service.ts`
- [X] T014 [P] [US1] 前端 `AuthorSummary` / 列表详情类型含 `nickname`：`apps/frontEnd/src/lib/posts.ts`
- [X] T015 [P] [US1] 列表与详情作者展示改为 `nickname`：`apps/frontEnd/src/features/posts/post-list-item.tsx`、`post-detail.tsx`
- [X] T016 [US1] 手稿台左侧展示昵称 +「修改昵称」交互（合法保存/空昵称拒绝/成功反馈）：`apps/frontEnd/src/features/auth/author-entry.tsx` 与/或 `profile-nickname-form.tsx`
- [X] T017 [US1] 修改昵称成功后同步全局 `useAuth().setUser`：同 `author-entry` / nickname 表单 + `auth-provider.tsx`
- [X] T018 [US1] 「当前账号」行继续展示 `username`（及 role），不被昵称替换：`apps/frontEnd/src/features/auth/author-entry.tsx`

**Checkpoint**: US1 可独立验收（quickstart 场景 A）

---

## Phase 4: User Story 2 - 上传或更换头像 (Priority: P1)

**Goal**: 个人中心上传/更换/删除头像；合规校验 2MiB + JPEG/PNG/WebP

**Independent Test**: 上传→刷新仍在；超限失败；删除回占位（quickstart 场景 B）

### Implementation for User Story 2

- [X] T019 [P] [US2] 复用上传/删除封装或抽公共方法供头像使用：`apps/frontEnd/src/lib/author-posts.ts` 与/或 `apps/frontEnd/src/lib/auth.ts`（调用 `/uploads`）
- [X] T020 [US2] 头像区 UI（占位、选文件、预览、上传中态、错误提示）：`apps/frontEnd/src/features/auth/profile-avatar.tsx` 或并入 `author-entry.tsx`
- [X] T021 [US2] 上传成功后 `updateProfile({ avatarUrl })` 并清理旧文件（若有）：同头像组件 + `apps/frontEnd/src/lib/auth.ts`
- [X] T022 [US2] 客户端校验类型与 ≤2MiB，失败中文提示且不请求 profile：同头像组件
- [X] T023 [US2] 有头像时可删除（`avatarUrl: null` + 删 uploads）；无头像时隐藏/禁用删除：同头像组件
- [X] T024 [US2] 头像变更后同步 `useAuth` 用户状态：同头像组件 / `author-entry.tsx`

**Checkpoint**: US2 可独立验收（quickstart 场景 B）

---

## Phase 5: User Story 3 - 编辑个人简介 (Priority: P1)

**Goal**: 简介显式保存；空态占位；超长拒绝；未保存不落库

**Independent Test**: 不点保存刷新丢失；点保存后持久；清空回占位（quickstart 场景 C）

### Implementation for User Story 3

- [X] T025 [US3] 简介 textarea + 占位文案 +「保存简介」按钮：`apps/frontEnd/src/features/auth/profile-bio-form.tsx` 或并入 `author-entry.tsx`
- [X] T026 [US3] 点击保存调用 `updateProfile({ bio })`；成功/失败中文反馈；同步 `useAuth`：同简介组件
- [X] T027 [US3] 前端提示或拦截超过 500 字；与后端 400 文案一致：同简介组件 + 确认 `apps/backEnd/src/modules/auth/` 校验
- [X] T028 [US3] 确认未点击保存时刷新页面不持久化（手工对照 quickstart C）：同简介组件行为（无自动保存）

**Checkpoint**: US3 可独立验收（quickstart 场景 C）

---

## Phase 6: User Story 4 - 资料编辑不打断既有写作入口 (Priority: P2)

**Goal**: 资料区与「我的文章 / 写新文章 / 登出 / 返回阅读」并存且可用

**Independent Test**: 资料控件就位后写作入口仍一键可达（quickstart 场景 D）

### Implementation for User Story 4

- [X] T029 [US4] 整合双栏布局：左昵称、右头像+账号+入口+简介，不遮挡既有按钮：`apps/frontEnd/src/features/auth/author-entry.tsx`
- [X] T030 [US4] 核对未登录访问 `/author` 仍引导登录：`apps/frontEnd/src/app/author/page.tsx`
- [X] T031 [P] [US4] 墨色样式微调（圆形头像、简介区、修改昵称链）融入 `apps/frontEnd/src/styles/globals.css` 或组件 class

**Checkpoint**: US4 可独立验收（场景 D）；与 US1–US3 同页共存

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 文案、合同对齐与走查

- [X] T032 [P] 核对 profile/uploads 错误文案为简体中文：`apps/backEnd/src/modules/auth/`、前端表单提示
- [X] T033 按 `specs/005-author-profile/quickstart.md` 走查场景 A–D 并记录结果（可附在 quickstart 末尾）
- [X] T034 [P] 确认 Swagger/OpenAPI 与 `contracts/api.md` 一致（若项目有自动文档装饰）
- [X] T035 [P] 导航「手稿室」等处若展示用户标识，优先用 nickname 且不破坏登录态展示：`apps/frontEnd/src/components/site-nav.tsx`（若适用）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**：无依赖
- **Phase 2 Foundational**：依赖 Setup；**阻塞**全部用户故事
- **Phase 3 US1**：依赖 Foundational（含 PATCH）
- **Phase 4 US2**：依赖 Foundational；可与 US1/US3 并行于不同组件文件
- **Phase 5 US3**：依赖 Foundational；可与 US2 并行
- **Phase 6 US4**：依赖 US1–US3 UI 已挂上手稿台（或至少占位），做布局收口
- **Phase 7 Polish**：依赖拟交付故事完成

### User Story Dependencies

- **US1**：Foundational 之后即可；MVP；含公开作者 nickname
- **US2**：依赖 profile PATCH + uploads；不依赖简介
- **US3**：依赖 profile PATCH；不依赖头像
- **US4**：布局整合；建议在 US1–US3 控件就绪后收口

### Parallel Opportunities

- T002 / T003 可并行
- T014 / T015 可并行（类型与展示）
- T019 可与 US1 UI 并行（不同文件）
- US2 与 US3 在 Foundational + PATCH 完成后可前后端分工并行

---

## Parallel Example: User Story 1

```text
# 后端公开投影：
Task: T013 posts author.nickname

# 同时前端：
Task: T014 posts.ts AuthorSummary
Task: T015 list/detail 展示 nickname
# 待 PATCH 可用后：
Task: T016–T018 手稿台改昵称
```

---

## Parallel Example: User Story 2 & 3

```text
Task: T020–T024 头像组件
# 并行：
Task: T025–T028 简介组件
# 最后：
Task: T029 并入 author-entry 双栏
```

---

## Implementation Strategy

### MVP First（仅 US1）

1. Phase 1 → Phase 2  
2. Phase 3 US1（含公开 nickname）  
3. **STOP**：按 quickstart 场景 A 验收  
4. 再进入 US2 / US3

### Incremental Delivery

1. US1：昵称 + 公开展示  
2. US2：头像  
3. US3：简介显式保存  
4. US4：布局与入口收口  
5. Polish：quickstart 全量

### Suggested MVP Scope

- **MVP** = Phase 1 + 2 + **US1**（T001–T018）  
- 完整 005 交付 = 追加 US2 + US3 + US4 + Polish

---

## Notes

- [P] = 不同文件且无未完成依赖  
- 不新增自动化测试任务（规格未要求）；验收以 quickstart 为准  
- 头像复用 `POST/DELETE /uploads`，资料写入统一走 `PATCH /auth/profile`  
- 避免在失焦时自动保存简介  
- 昵称不可清空；无头像时不可删除

