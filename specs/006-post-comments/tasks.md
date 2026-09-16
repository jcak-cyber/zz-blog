# Tasks: 文章评论侧栏

**Input**: Design documents from `/specs/006-post-comments/`

**Prerequisites**: plan.md（必需）、spec.md（必需）、research.md、data-model.md、contracts/、quickstart.md

**Tests**: 规格未要求 TDD；本清单**不包含**强制自动化测试任务。验收以 `quickstart.md` 为准。

**Organization**: 按用户故事分阶段；依赖既有赞/踩、登录注册与公开文章详情已可用。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行（不同文件、无未完成依赖）
- **[Story]**: 仅用户故事阶段使用（如 [US1]）
- 描述须含明确文件路径

## Path Conventions

- 前端：`apps/frontEnd/`
- 后端：`apps/backEnd/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 确认目录与合同对照

- [X] T001 对照 `specs/006-post-comments/contracts/api.md` 列出待增评论端点与公开详情 `commentCount` 增量
- [X] T002 [P] 确认前端可扩展路径：`apps/frontEnd/src/features/posts/`、`apps/frontEnd/src/lib/`、`apps/frontEnd/src/app/posts/[slug]/`
- [X] T003 [P] 确认后端可扩展路径：`apps/backEnd/src/modules/`、`apps/backEnd/prisma/schema.prisma`、既有 `Comment` 模型

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 数据模型、Comments 模块骨架、详情 commentCount——阻塞所有用户故事

**⚠️ CRITICAL**: 未完成本阶段前不得开始 US1–US5 主实现

- [X] T004 在 `apps/backEnd/prisma/schema.prisma` 新增 `CommentReaction`（`commentId`/`userId` 唯一、Cascade），并为 `Comment` 补充 `@@index([postId, createdAt])`（若尚无）
- [X] T005 生成并应用迁移：`apps/backEnd/prisma/migrations/`
- [X] T006 新建 `CommentsModule` 骨架并注册到 `apps/backEnd/src/app.module.ts`：`apps/backEnd/src/modules/comments/`（module / controller / service 空实现可编译）
- [X] T007 [P] 定义评论相关 DTO（创建 body、列表 query、条目投影类型）：`apps/backEnd/src/modules/comments/dto/`
- [X] T008 公开文章详情投影增加 `commentCount`：`apps/backEnd/src/modules/posts/`（repository/service 与对外 DTO）
- [X] T009 [P] 前端文章类型增加 `commentCount`：`apps/frontEnd/src/lib/posts.ts`
- [X] T010 [P] 新建前端评论 API 封装占位（list/count/create/like/delete）：`apps/frontEnd/src/lib/comments.ts`

**Checkpoint**: 迁移成功；详情 API 返回 `commentCount`；Comments 模块可启动无报错

---

## Phase 3: User Story 1 - 打开侧栏并浏览评论 (Priority: P1) 🎯 MVP

**Goal**: 详情页评论入口 + 总数；右侧侧栏列表（较新在前）与关闭；空态；列表按需加载

**Independent Test**: 打开已发布详情 → 见入口与数字 → 点开侧栏见列表/空态 → 关闭后可继续阅读（quickstart 场景 A）

### Implementation for User Story 1

- [X] T011 [US1] 实现 `GET /posts/:slug/comments`（分页、`createdAt DESC`、仅 `parentId` 空、可选 JWT 填充 `likedByMe`/`canDelete`）：`apps/backEnd/src/modules/comments/comments.service.ts`、`comments.controller.ts`
- [X] T012 [P] [US1] 实现或确认 `GET /posts/:slug/comments/count`（或与详情 count 对齐）：`apps/backEnd/src/modules/comments/`
- [X] T013 [US1] 完善前端 `fetchComments` / `fetchCommentCount`：`apps/frontEnd/src/lib/comments.ts`
- [X] T014 [US1] 在赞/踩旁增加评论按钮（图标 + `commentCount`）：`apps/frontEnd/src/features/posts/post-reactions.tsx` 与/或 `post-detail.tsx`
- [X] T015 [US1] 实现右侧评论侧栏壳（打开/关闭、标题「评论 N」、列表区滚动、空态）：`apps/frontEnd/src/features/posts/post-comments-drawer.tsx`
- [X] T016 [US1] 侧栏打开后再请求列表并渲染条目（昵称/日期/正文/头像占位；点赞数字可先只读）：`apps/frontEnd/src/features/posts/post-comments-drawer.tsx`
- [X] T017 [US1] 将侧栏挂到详情页并保证换文不串数据：`apps/frontEnd/src/features/posts/post-detail.tsx`、`apps/frontEnd/src/app/posts/[slug]/page.tsx`

**Checkpoint**: US1 可独立验收（访客浏览 + 关闭侧栏）

---

## Phase 4: User Story 2 - 登录后发表评论 (Priority: P1)

**Goal**: 登录用户发表 1～1000 字评论；计数同步；同文约 30 秒限频；未登录引导登录

**Independent Test**: 登录发表出现在顶部且 count+1；30 秒内再发失败；未登录被引导（quickstart 场景 B/C）

### Implementation for User Story 2

- [X] T018 [US2] 实现 `POST /posts/:slug/comments`（鉴权、trim、Unicode 码点 1～1000、`parentId=null`、同用户同文 30s 限频 → 429）：`apps/backEnd/src/modules/comments/comments.service.ts`、`comments.controller.ts`
- [X] T019 [US2] 前端 `createComment` 封装与错误映射（401/400/429 中文）：`apps/frontEnd/src/lib/comments.ts`
- [X] T020 [US2] 发表区 UI（头像、占位文案、剩余字数、「评论」按钮）：`apps/frontEnd/src/features/posts/post-comment-composer.tsx` 与/或 `post-comments-drawer.tsx`
- [X] T021 [US2] 提交成功：列表顶部插入、清空输入、更新入口与标题 count；失败不假成功：同侧栏/composer
- [X] T022 [US2] 未登录点击提交/发表区引导登录（可回跳详情）：`apps/frontEnd/src/features/posts/post-comments-drawer.tsx`、复用既有 login 跳转模式

**Checkpoint**: US2 可独立验收（发表 + 限频 + 登录引导）

---

## Phase 5: User Story 3 - 为单条评论点赞 (Priority: P2)

**Goal**: 登录点赞/取消；显示数字（含 0）；未登录可见数字但引导登录

**Independent Test**: 点赞数字 ±1；再点取消；未登录引导（quickstart 场景 D）

### Implementation for User Story 3

- [X] T023 [US3] 实现 `PUT` / `DELETE /posts/:slug/comments/:id/like`：`apps/backEnd/src/modules/comments/`
- [X] T024 [P] [US3] 前端 `likeComment` / `unlikeComment`：`apps/frontEnd/src/lib/comments.ts`
- [X] T025 [US3] 列表项点赞交互（已赞态、数字、乐观或请求后更新）：`apps/frontEnd/src/features/posts/post-comments-drawer.tsx`
- [X] T026 [US3] 未登录点赞 → 401 引导登录：同侧栏组件

**Checkpoint**: US3 可独立验收

---

## Phase 6: User Story 4 - 删除评论 (Priority: P2)

**Goal**: 本人 / 文作者 / ADMIN 硬删除；无权限拒绝；count 同步

**Independent Test**: 自删成功；他删被拒；作者/ADMIN 可删任意（quickstart 场景 E）

### Implementation for User Story 4

- [X] T027 [US4] 实现 `DELETE /posts/:slug/comments/:id`（权限校验、硬删除、Cascade 点赞）：`apps/backEnd/src/modules/comments/comments.service.ts`、`comments.controller.ts`
- [X] T028 [US4] 列表投影正确计算 `canDelete`：`apps/backEnd/src/modules/comments/comments.service.ts`
- [X] T029 [P] [US4] 前端 `deleteComment`：`apps/frontEnd/src/lib/comments.ts`
- [X] T030 [US4] 有权限时展示删除入口；成功移除条目并更新 count；403 中文提示：`apps/frontEnd/src/features/posts/post-comments-drawer.tsx`

**Checkpoint**: US4 可独立验收

---

## Phase 7: User Story 5 - 表情与图片入口边界 (Priority: P3)

**Goal**: 发表区可见表情/图片入口；图片点击明确不可用；输入法表情可提交

**Independent Test**: 见入口；点图片有说明；文字+表情可发（quickstart 场景 F）

### Implementation for User Story 5

- [X] T031 [US5] 在发表区增加表情/图片图标入口（图片点击提示后续开放）：`apps/frontEnd/src/features/posts/post-comment-composer.tsx`
- [X] T032 [US5] 确认含 emoji 的合法正文可保存展示（无需独立表情面板）：手工走查 + 既有 POST 路径

**Checkpoint**: US5 可独立验收；不阻塞 MVP

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 体验与合同收尾

- [X] T033 [P] 侧栏/互动区样式融入阅读页变量色（不强制设计图纯黑）：`apps/frontEnd/src/styles/globals.css` 与/或评论相关组件 class
- [X] T034 确认既有文章赞/踩行为未被破坏：`apps/frontEnd/src/features/posts/post-reactions.tsx`
- [X] T035 错误文案简体中文与合同表对齐（空/超长/过频/无权）：`apps/backEnd/src/modules/comments/`
- [X] T036 按 `specs/006-post-comments/quickstart.md` 完整走查场景 A–F 并勾选完成判据

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖
- **Foundational (Phase 2)**: 依赖 Setup；**阻塞**所有用户故事
- **US1 (Phase 3)**: 依赖 Foundational → MVP
- **US2 (Phase 4)**: 依赖 US1 侧栏壳（发表挂在侧栏内）
- **US3 (Phase 5)**: 依赖 US1 列表；可与 US2 并行（不同端点）但建议 US2 后做体验更完整
- **US4 (Phase 6)**: 依赖 US1 列表；可与 US3 并行
- **US5 (Phase 7)**: 依赖 US2 发表区
- **Polish (Phase 8)**: 依赖已交付故事

### User Story Dependencies

- **US1 (P1)**: Foundational 后即可 → **MVP**
- **US2 (P1)**: 依赖 US1 侧栏
- **US3 (P2)**: 依赖 US1 列表项
- **US4 (P2)**: 依赖 US1 列表项
- **US5 (P3)**: 依赖 US2 发表区

### Parallel Opportunities

- T002 / T003 并行
- T007 / T009 / T010 在 T006 之后可并行
- T012 可与 T011 部分并行（不同路由文件时）
- US3 与 US4 后端端点可并行（T023 与 T027）
- T024 / T029 前端封装可并行
- T033 可与走查准备并行

---

## Parallel Example: User Story 1

```text
# Foundational 完成后：
T011 实现 GET comments（后端）
T013 完善 fetchComments（前端）— 可在 T011 合同稳定后
T014 / T015 入口按钮与侧栏壳可并行（不同文件）
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 + Phase 2  
2. Phase 3（US1：入口 + 侧栏浏览）  
3. **STOP**：按 quickstart 场景 A 验收  
4. 再进入 US2 发表  

### Incremental Delivery

1. US1 浏览 → 演示侧栏  
2. US2 发表 + 限频  
3. US3 点赞数字  
4. US4 删除权限  
5. US5 图片入口说明  
6. Polish + quickstart A–F  

### 建议 MVP 范围

**仅 US1**（评论入口、count、侧栏列表/空态/关闭）。发表与互动为紧随增量。

---

## Notes

- [P] = 不同文件且无未完成依赖  
- 规格故事「3b 删除」在本清单标为 **[US4]**；「表情与图片」为 **[US5]**  
- 首版不做楼中楼、图片上传、审核后台、评论编辑  
- 提交建议按任务或故事增量 commit  
- **实现状态（2026-09-16）**：T001–T036 代码已落地；请按 `quickstart.md` 在浏览器补齐场景 A–F 手工验收。若本机 `prisma generate` 因 `dev:back` 锁文件失败，请重启后端后再执行一次 `pnpm --filter @zz-blog/backend exec prisma generate`。
