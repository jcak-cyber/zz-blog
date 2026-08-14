# Tasks: 开放注册与文章表态

**Input**: Design documents from `/specs/004-open-register-votes/`

**Prerequisites**: plan.md（必需）、spec.md（必需）、research.md、data-model.md、contracts/、quickstart.md

**Tests**: 规格未要求 TDD；本清单**不包含**强制自动化测试任务。验收以 `quickstart.md` 为准。

**Organization**: 按用户故事分阶段；依赖 002 登录与 003 撰写台已可用。

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

- [X] T001 对照 `specs/004-open-register-votes/contracts/api.md` 列出待改 auth/posts 端点清单（实现备注可贴在 PR/任务评论）
- [X] T002 [P] 确认前端目录可扩展：`apps/frontEnd/src/app/login/`、`apps/frontEnd/src/features/auth/`、`apps/frontEnd/src/features/posts/`
- [X] T003 [P] 确认后端模块可扩展：`apps/backEnd/src/modules/auth/`、`apps/backEnd/src/modules/posts/`、`apps/backEnd/prisma/schema.prisma`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 用户名模型、登录字段对齐、种子回填——阻塞所有用户故事

**⚠️ CRITICAL**: 未完成本阶段前不得开始 US1–US4 主实现

- [X] T004 在 `apps/backEnd/prisma/schema.prisma` 为 `User` 增加 `username String @unique`
- [X] T005 生成并应用迁移：`apps/backEnd/prisma/migrations/`（含 username；为既有行回填策略写在 migration SQL 或后续 seed）
- [X] T006 更新 seed：`apps/backEnd/prisma/seed.ts` 为种子作者设置明确 `username`（如 `author`），并保持可登录
- [X] T007 登录 DTO/校验改为 `username`：`apps/backEnd/src/modules/auth/` 下 login DTO、service（不再用 email 作为登录输入）
- [X] T008 更新 JWT claims 与 `GET /auth/me` 对外字段为 `username`：`apps/backEnd/src/modules/auth/`（controller/service/strategy 相关文件）
- [X] T009 前端登录请求与类型改为用户名：`apps/frontEnd/src/lib/auth.ts`、`apps/frontEnd/src/app/login/page.tsx`（及 `features/auth` 内表单组件）
- [X] T010 确认种子账号可用新字段登录（手工：username + 原密码）

**Checkpoint**: 迁移成功；旧作者可用 `username` 登录；`/auth/me` 返回 username

---

## Phase 3: User Story 1 - 访客自助注册并登录 (Priority: P1) 🎯 MVP

**Goal**: 公众可注册（用户名+密码≥8）；注册成功不自动登录，须回登录页再登

**Independent Test**: 新用户名注册 → 跳转登录且无会话 Cookie → 再登录进入作者入口（见 quickstart 场景 A）

### Implementation for User Story 1

- [X] T011 [US1] 实现注册 DTO（username、password≥8）：`apps/backEnd/src/modules/auth/dto/register.dto.ts`（或等价路径）
- [X] T012 [US1] 实现 `POST /auth/register`（建用户 role=AUTHOR、合成占位 email、**不设 Cookie**、冲突 409）：`apps/backEnd/src/modules/auth/auth.service.ts`、`auth.controller.ts`
- [X] T013 [US1] 为 register（及既有 login）配置 Throttler：`apps/backEnd/src/modules/auth/`
- [X] T014 [P] [US1] 前端 `register` API 封装：`apps/frontEnd/src/lib/auth.ts`
- [X] T015 [US1] 新增注册页（用户名、密码、确认密码、长度说明）：`apps/frontEnd/src/app/register/page.tsx`
- [X] T016 [US1] 注册成功跳转 `/login`（可预填 username）且不带登录态：同 `register/page.tsx` + 路由查询参数处理于 `apps/frontEnd/src/app/login/page.tsx`
- [X] T017 [US1] 登录页增加通往注册的明确链接：`apps/frontEnd/src/app/login/page.tsx`

**Checkpoint**: US1 可独立验收（quickstart 场景 A）

---

## Phase 4: User Story 2 - 任意登录用户撰写并发布自己的文章 (Priority: P1)

**Goal**: 登录用户仅管理本人文章；公开列表/详情展示作者用户名；slug 全站唯一冲突 409

**Independent Test**: A 发文公开可见且显示作者名；B 无法改 A 的稿；同 slug 冲突（quickstart 场景 B）

### Implementation for User Story 2

- [X] T018 [US2] 作者写路径强制 `authorId = JWT.sub`（创建/列表/详情/更新/删除）：`apps/backEnd/src/modules/posts/author-posts.service.ts`、`posts.repository.ts`（移除或停用跨用户 `firstAuthor` 写路径）
- [X] T019 [US2] 非本人 `GET/PATCH/DELETE /author/posts/:id` 返回 404：同 `author-posts.service.ts`、`author-posts.controller.ts`
- [X] T020 [US2] 公开 Summary/Detail 映射增加 `author: { id, username }`：`apps/backEnd/src/modules/posts/posts.service.ts`、`posts.repository.ts`（include author）
- [X] T021 [P] [US2] 前端类型与 `fetch` 适配 author 字段：`apps/frontEnd/src/lib/posts.ts`
- [X] T022 [P] [US2] 首页/列表展示作者用户名：`apps/frontEnd/src/features/posts/post-list-item.tsx`（及列表容器若需要）
- [X] T023 [US2] 详情页展示作者用户名：`apps/frontEnd/src/features/posts/post-detail.tsx`
- [X] T024 [US2] 确认 slug 冲突仍返回 409 且文案简体中文：`apps/backEnd/src/modules/posts/author-posts.service.ts`

**Checkpoint**: US2 可独立验收（quickstart 场景 B）；US1 登录用户即可发本人文

---

## Phase 5: User Story 3 - 读者在正文下对文章点赞或点踩 (Priority: P1)

**Goal**: 详情正文下赞/踩+计数；登录可设/取消/切换；未登录引导登录

**Independent Test**: quickstart 场景 C（未登录不计数；登录互斥与刷新保持）

### Implementation for User Story 3

- [X] T025 [US3] 在 `apps/backEnd/prisma/schema.prisma` 新增 enum 与 `PostReaction` 模型（`@@unique([postId, userId])`）
- [X] T026 [US3] 生成并应用 `PostReaction` 迁移：`apps/backEnd/prisma/migrations/`
- [X] T027 [US3] 实现 reactions 仓储/服务（聚合计数、myReaction、PUT/DELETE）：`apps/backEnd/src/modules/reactions/`（新建 module/service/repository）
- [X] T028 [US3] 实现 `GET/PUT/DELETE /posts/:slug/reactions` 并挂载模块：`apps/backEnd/src/modules/reactions/reactions.controller.ts`、`app.module.ts`
- [X] T029 [US3] 表态写接口鉴权 + 不可见表 404 + Throttle：同 reactions 模块
- [X] T030 [P] [US3] 前端 reactions API：`apps/frontEnd/src/lib/posts.ts` 或 `apps/frontEnd/src/lib/reactions.ts`
- [X] T031 [US3] 实现赞踩控件（图标+计数、选中态、未登录跳转登录）：`apps/frontEnd/src/features/posts/post-reactions.tsx`
- [X] T032 [US3] 挂到详情正文下方、页脚上方：`apps/frontEnd/src/features/posts/post-detail.tsx` 与/或 `apps/frontEnd/src/app/posts/[slug]/page.tsx`
- [X] T033 [US3] 样式融入墨色体系（避免高饱和社交风）：`apps/frontEnd/src/styles/globals.css` 与控件组件 class

**Checkpoint**: US3 可独立验收（quickstart 场景 C）

---

## Phase 6: User Story 4 - 发现注册入口且不打断阅读 (Priority: P2)

**Goal**: 阅读路径无登录墙；注册入口可达且不挡正文

**Independent Test**: quickstart 场景 D

### Implementation for User Story 4

- [X] T034 [US4] 站导航/作者入口未登录态提供登录与注册可达链接（不遮挡正文）：`apps/frontEnd/src/components/site-nav.tsx`（及作者入口相关组件）
- [X] T035 [US4] 核对首页与详情无强制登录跳转：`apps/frontEnd/src/app/page.tsx`、`apps/frontEnd/src/app/posts/[slug]/page.tsx`、middleware（若有）
- [X] T036 [P] [US4] 登录页注册入口文案清晰（简体中文）：`apps/frontEnd/src/app/login/page.tsx`

**Checkpoint**: US4 可独立验收（场景 D）；与 US1 登录页链接不冲突

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 跨故事收尾与验收

- [X] T037 [P] 将表态 UI 参照图落到 `docs/ui/pages/article-detail/`（若仓库需留档）— 仓库无既有 docs/ui，已跳过
- [X] T038 核对公开/作者 API 错误文案为简体中文（register/login/reactions/slug 409）
- [X] T039 按 `specs/004-open-register-votes/quickstart.md` 完整走查场景 A–D 并记录结果
- [X] T040 [P] 更新或确认 Swagger/OpenAPI 与 `contracts/api.md` 一致（若项目有自动文档）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**：无依赖
- **Phase 2 Foundational**：依赖 Setup；**阻塞**全部用户故事
- **Phase 3 US1**：依赖 Foundational
- **Phase 4 US2**：依赖 Foundational；建议在 US1 后做（需能登录发文），但归属改造可与 US1 并行于后端
- **Phase 5 US3**：依赖 Foundational；建议公开详情与登录可用（US1）；与 US2 的 author 展示可并行于不同文件
- **Phase 6 US4**：依赖 US1 注册页存在；主要前端导航
- **Phase 7 Polish**：依赖拟交付的故事完成

### User Story Dependencies

- **US1**：Foundational 之后即可；MVP
- **US2**：需要登录用户；依赖撰写台已存在；依赖 Foundational 的 username
- **US3**：需要公开详情页与登录；不依赖 US2 的归属改造即可测赞踩，但完整 demo 建议 US2 后
- **US4**：依赖注册/登录入口（US1）

### Parallel Opportunities

- T002 / T003 可并行
- T014 与 T011–T013 可部分并行（前后端）
- T021 / T022 可并行
- T030 与 T027–T029 可前后端并行
- US2 前端展示（T021–T023）与 US3 后端模型（T025–T026）在 Foundational 完成后可由不同人并行

---

## Parallel Example: User Story 1

```text
# 后端合同实现：
Task: T011 注册 DTO
Task: T012 POST /auth/register
Task: T013 Throttler

# 同时前端（待 T012 可用后联调）：
Task: T014 auth.ts register 封装
Task: T015 register/page.tsx
```

---

## Parallel Example: User Story 3

```text
Task: T025–T026 Prisma PostReaction
Task: T027–T029 reactions 模块 API
# 并行前端：
Task: T030 reactions 客户端
Task: T031–T033 控件与样式
```

---

## Implementation Strategy

### MVP First（仅 US1）

1. Phase 1 → Phase 2  
2. Phase 3 US1  
3. **STOP**：按 quickstart 场景 A 验收  
4. 再进入 US2 / US3

### Incremental Delivery

1. US1：开放注册闭环  
2. US2：多作者安全写作 + 作者名展示  
3. US3：赞踩  
4. US4：入口与阅读打扰收尾  
5. Polish：quickstart 全量

### Suggested MVP Scope

- **MVP** = Phase 1 + 2 + **US1**（T001–T017）  
- 完整 004 交付 = 追加 US2 + US3 + US4 + Polish

---

## Notes

- [P] = 不同文件且无未完成依赖  
- 不新增自动化测试任务（规格未要求）；后端若已有 Jest 习惯可在实现时顺手补，非本清单门禁  
- 每完成一故事对照 `quickstart.md` 对应场景  
- 避免继续使用 `firstAuthor()` 作为写路径默认作者
