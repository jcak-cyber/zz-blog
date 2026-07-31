# Tasks: 作者撰写文章

**Input**: Design documents from `/specs/003-author-write-post/`

**Prerequisites**: plan.md（必需）、spec.md（必需）、research.md、data-model.md、contracts/、quickstart.md

**Tests**: 规格未要求 TDD；本清单**不包含**强制自动化测试任务。验收以 `quickstart.md` 为准。

**Organization**: 按用户故事分阶段；依赖 002 登录已可用。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行（不同文件、无未完成依赖）
- **[Story]**: 仅用户故事阶段使用（如 [US1]）
- 描述须含明确文件路径

## Path Conventions

- 前端：`apps/frontEnd/`
- 后端：`apps/backEnd/`
- UI 参照：`docs/ui/003-author-write-post-layout.png`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 确认依赖与作者区目录占位（工程已存在）

- [x] T001 确认前端作者区目录存在：`apps/frontEnd/src/app/author/`、`apps/frontEnd/src/features/author/`
- [x] T002 [P] 确认后端 posts/uploads/auth 模块可扩展：`apps/backEnd/src/modules/posts/`、`uploads/`、`auth/`
- [x] T003 [P] 在 `apps/frontEnd/package.json` 按需增加 Markdown 预览依赖（若不用既有 `next-mdx-remote` 则选轻量渲染库），并安装

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 数据模型、公开可见性、作者 API 骨架——阻塞所有用户故事

**⚠️ CRITICAL**: 未完成本阶段前不得开始 US1–US4 UI 主实现

- [x] T004 在 `apps/backEnd/prisma/schema.prisma` 为 `Post` 增加 `scheduledAt DateTime?`，并添加合适索引
- [x] T005 生成并应用迁移：`apps/backEnd/prisma/migrations/`（含 `scheduledAt`）
- [x] T006 实现公开可见性工具：`apps/backEnd/src/modules/posts/post-visibility.ts`（`published && (!scheduledAt || scheduledAt <= now)`）
- [x] T007 更新公开列表/详情查询使用可见性规则：`apps/backEnd/src/modules/posts/posts.repository.ts`、`posts.service.ts`
- [x] T008 实现作者状态派生：`apps/backEnd/src/modules/posts/author-post-status.ts`（draft / scheduled / published）
- [x] T009 [P] 实现作者侧 DTO：`apps/backEnd/src/modules/posts/dto/author-posts.dto.ts`（create/update/list query，含 action）
- [x] T010 实现 AuthorPostsService 骨架（CRUD 方法签名）：`apps/backEnd/src/modules/posts/author-posts.service.ts`
- [x] T011 实现 AuthorPostsController 路由挂载：`apps/backEnd/src/modules/posts/author-posts.controller.ts`，并在 `posts.module.ts` 注册；全部端点使用 `JwtAuthGuard`
- [x] T012 扩展上传鉴权：`apps/backEnd/src/modules/uploads/uploads.controller.ts` 支持 JWT（ADMIN|AUTHOR）或既有 import-token
- [x] T013 前端作者 API 封装：`apps/frontEnd/src/lib/author-posts.ts`（list/create/get/patch/delete，credentials）
- [x] T014 [P] slug 建议工具：`apps/frontEnd/src/features/author/slug-suggest.ts`
- [x] T015 扩展 `/author` 入口页链到「我的文章」与「新建」：`apps/frontEnd/src/app/author/page.tsx`（及 `features/auth/author-entry.tsx` 若仍承载入口）

**Checkpoint**: 迁移成功；公开接口遵守预约不可见；作者 API 骨架可 401/空列表响应；前端 lib 可调用

---

## Phase 3: User Story 1 - 登录后撰写并发布新文章 (Priority: P1) 🎯 MVP

**Goal**: 已登录作者可新建文章并立即发布或预约发布；未登录读者可见已到期公开文

**Independent Test**: 登录 → 新建 → 填标题正文 → 立即发布 → 未登录首页可见；另测预约未到期不可见

### Implementation for User Story 1

- [x] T016 [US1] 实现 `POST /author/posts`（draft/publish/schedule）：`apps/backEnd/src/modules/posts/author-posts.service.ts`、`author-posts.controller.ts`
- [x] T017 [US1] 实现 slug 唯一冲突 409 与发布校验（标题/正文非空）：同 `author-posts.service.ts`
- [x] T018 [P] [US1] 实现编辑器壳三栏布局（墨色风格）：`apps/frontEnd/src/features/author/post-editor.tsx`
- [x] T019 [P] [US1] 实现 Markdown 输入区与基础工具栏：`apps/frontEnd/src/features/author/markdown-toolbar.tsx`
- [x] T020 [US1] 新建页路由：`apps/frontEnd/src/app/author/posts/new/page.tsx`（接 PostEditor；未登录重定向 `/login`）
- [x] T021 [US1] 编辑器支持立即发布与预约（日期时间选择）：`apps/frontEnd/src/features/author/post-editor.tsx`
- [x] T022 [US1] 标题变更触发 slug 建议且可编辑：`apps/frontEnd/src/features/author/post-editor.tsx` + `slug-suggest.ts`
- [x] T023 [US1] 发布成功后跳转公开详情或返回列表，并确认首页可见性符合规则

**Checkpoint**: US1 可独立验收（quickstart 1、4、5、9 相关）

---

## Phase 4: User Story 2 - 保存草稿并稍后继续 (Priority: P1)

**Goal**: 保存草稿、我的文章列表、打开继续编辑；公众看不到草稿

**Independent Test**: 存草稿 → 未登录不可见 → 列表打开草稿内容恢复

### Implementation for User Story 2

- [x] T024 [US2] 实现 `GET /author/posts` 列表（含 status 派生与可选过滤）：`apps/backEnd/src/modules/posts/author-posts.service.ts`、`author-posts.controller.ts`
- [x] T025 [US2] 实现 `GET /author/posts/:id`：同模块
- [x] T026 [US2] 实现 `PATCH /author/posts/:id` 保存草稿 / 更新内容：同模块
- [x] T027 [P] [US2] 实现「我的文章」列表 UI（区分草稿/预约中/已发布）：`apps/frontEnd/src/features/author/post-list.tsx`
- [x] T028 [US2] 列表页路由：`apps/frontEnd/src/app/author/posts/page.tsx`
- [x] T029 [US2] 编辑页路由：`apps/frontEnd/src/app/author/posts/[id]/edit/page.tsx`（加载详情填入 PostEditor）
- [x] T030 [US2] 编辑器「保存草稿」按钮与成功/失败中文提示：`apps/frontEnd/src/features/author/post-editor.tsx`

**Checkpoint**: US2 可独立验收（quickstart 2、3）

---

## Phase 5: User Story 3 - 编辑元信息、封面与摘要 (Priority: P2)

**Goal**: 摘要、封面（上传或 URL）、标签；预览卡片反映元信息

**Independent Test**: 设置摘要与封面后发布，公开列表可见；标签保存并展示

### Implementation for User Story 3

- [x] T031 [US3] 后端 create/update 支持 excerpt、coverImageUrl、tagNames（upsert Tag）：`apps/backEnd/src/modules/posts/author-posts.service.ts`
- [x] T032 [P] [US3] 侧栏摘要与封面 URL/上传控件：`apps/frontEnd/src/features/author/post-meta-fields.tsx`
- [x] T033 [P] [US3] 标签输入与展示：同 `post-meta-fields.tsx` 或 `post-editor.tsx`
- [x] T034 [US3] 封面上传调用 `POST /uploads`（JWT）：`apps/frontEnd/src/lib/author-posts.ts` 或独立 `uploads.ts`
- [x] T035 [US3] 可选分类下拉（有 Category 数据时）：`apps/frontEnd/src/features/author/post-meta-fields.tsx`
- [x] T036 [US3] 右侧列表风预览卡反映标题/摘要/封面：`apps/frontEnd/src/features/author/post-preview.tsx`

**Checkpoint**: US3 可独立验收

---

## Phase 6: User Story 4 - 预览、字数、删除与撤回 (Priority: P2)

**Goal**: Markdown 预览、字数、删草稿/已发布（确认）、撤回为草稿（确认）；已公开 slug 默认锁定

**Independent Test**: 预览与字数可见；删除/撤回后公开侧立即不可见

### Implementation for User Story 4

- [x] T037 [US4] 实现 `DELETE /author/posts/:id`：`apps/backEnd/src/modules/posts/author-posts.service.ts`、`author-posts.controller.ts`
- [x] T038 [US4] 实现 `action=unpublish` 撤回草稿：同 service（确认由前端保证）
- [x] T039 [US4] slug 锁定与 `confirmSlugChange`：同 service + 编辑器 UI
- [x] T040 [P] [US4] 正文 Markdown 预览面板：`apps/frontEnd/src/features/author/post-preview.tsx`
- [x] T041 [P] [US4] 字数统计展示：`apps/frontEnd/src/features/author/post-editor.tsx`
- [x] T042 [US4] 删除确认对话框（草稿与已发布）：`apps/frontEnd/src/features/author/post-list.tsx` 与/或编辑器
- [x] T043 [US4] 撤回为草稿确认与调用：`apps/frontEnd/src/features/author/post-editor.tsx`

**Checkpoint**: US4 可独立验收（quickstart 6、7、8）

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 风格、文档、回归与导入共存

- [x] T044 对照 `docs/ui/003-author-write-post-layout.png` 调整分区，确保墨色手稿而非浅色后台皮：`apps/frontEnd/src/features/author/*.tsx`、`apps/frontEnd/src/styles/globals.css`（按需）
- [x] T045 [P] 作者页 Metadata `noindex`：`apps/frontEnd/src/app/author/**/layout.tsx` 或各 page
- [x] T046 [P] 更新根 `README.md`：作者撰写入口与草稿/预约/撤回说明（简体中文）
- [x] T047 抽查 `pnpm import:content` 与 Web 文共存、slug 冲突有中文提示
- [x] T048 按 `specs/003-author-write-post/quickstart.md` 完整走查 1–10
- [x] T049 SiteNav 在 `/author/*` 保持隐藏「作者入口」或改为「我的文章」链（避免重复登录入口）：`apps/frontEnd/src/components/site-nav.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup → Foundational → US1 → US2 → US3 → US4 → Polish**
- US3/US4 依赖 US1 编辑器与 US2 列表/编辑路由
- 预约可见性在 Foundational（T006–T007）即影响公开读，须先于 US1 验收

### User Story Dependencies

```text
Foundational
    │
    ├─▶ US1 新建发布/预约 ──▶ US3 元信息
    │         │
    │         └─▶ US2 列表+草稿 ──▶ US4 预览/删除/撤回
    │
    └─▶ 公开可见性规则（全程）
```

### Parallel Opportunities

- T002/T003；T009 与 T006–T008 部分并行
- US1：T018/T019 可并行
- US2：T027 可与 T024–T026 后端并行（接口约定稳定后）
- US3：T032/T033 可并行
- US4：T040/T041 可并行
- Polish：T045/T046 可并行

---

## Parallel Example: User Story 1

```bash
Task: "实现编辑器壳三栏布局：apps/frontEnd/src/features/author/post-editor.tsx"
Task: "实现 Markdown 工具栏：apps/frontEnd/src/features/author/markdown-toolbar.tsx"
```

---

## Implementation Strategy

### MVP First（US1）

1. Phase 1–2  
2. Phase 3 US1（新建 + 立即发布；预约可同批）  
3. **STOP**：未登录首页可见性验收  

### Incremental Delivery

1. US2 列表与草稿  
2. US3 封面摘要标签  
3. US4 预览删除撤回 slug 锁  
4. Polish + quickstart 全绿  

---

## Notes

- 不引入 Redis/Cron；预约靠查询惰性可见  
- 不做评论开关/点赞  
- 下一命令：`/speckit-implement`
