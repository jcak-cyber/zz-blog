# Tasks: 极简个人博客（第一版）

**Input**: Design documents from `/specs/001-personal-blog/`

**Prerequisites**: plan.md（必需）、spec.md（必需）、research.md、data-model.md、contracts/、quickstart.md

**Tests**: 规格未要求 TDD；本清单**不包含**强制测试任务。验收以 `quickstart.md` 与规格场景为准。

**Organization**: 按用户故事分阶段；US5（标签筛选）第一版不实现。JWT 登录 UI、嵌套评论 UI、全文搜索属规格外，见文末「默认跳过」。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行（不同文件、无未完成依赖）
- **[Story]**: 仅用户故事阶段使用（如 [US1]）
- 描述须含明确文件路径

## Path Conventions

- 前端：`apps/frontEnd/`
- 后端：`apps/backEnd/`
- 内容：`content/posts/`
- 设计稿：`docs/ui/`（只读参照，非本阶段必改）

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Monorepo 与工程骨架初始化

- [x] T001 删除占位并建立 monorepo 根配置：`package.json`、`pnpm-workspace.yaml`（或 npm/yarn workspaces）、根 `tsconfig.base.json`、`.gitignore`、`.env.example`
- [x] T002 [P] 初始化 Next.js（App Router）+ React 18 + TypeScript 于 `apps/frontEnd/`（含 `src/app/`、`src/components/`、`src/features/`、`src/lib/`、`src/styles/`）
- [x] T003 [P] 初始化 NestJS + TypeScript 于 `apps/backEnd/`（含 `src/modules/`、`src/common/`、`src/prisma/`、`uploads/`）
- [x] T004 [P] 在 `apps/frontEnd/` 配置 Tailwind CSS、路径别名与基础全局样式 `apps/frontEnd/src/styles/globals.css`
- [x] T005 [P] 在仓库根配置 ESLint + Prettier（根与 apps 共享规则文件，如 `.eslintrc.cjs`、`.prettierrc`）
- [x] T006 编写 `docker-compose.yml`（服务：`postgres`、`backEnd`、`frontEnd`）及 `apps/frontEnd/Dockerfile`、`apps/backEnd/Dockerfile`
- [x] T007 [P] 创建内容与上传占位目录：`content/posts/.gitkeep`、`apps/backEnd/uploads/.gitkeep`，并在 `.gitignore` 忽略上传大文件策略说明

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 所有用户故事开始前必须完成的基础设施

**⚠️ CRITICAL**: 未完成本阶段前不得开始 US1–US4 实现

- [x] T008 在 `apps/backEnd/prisma/schema.prisma` 定义 User、Post、Tag、PostTag、Category 模型与索引（按 `data-model.md`；Comment 表可建但不接公开 UI）
- [x] T009 配置 `apps/backEnd` 的 `@nestjs/config`、环境变量与 `.env.example`（`DATABASE_URL`、`JWT_*`、`IMPORT_TOKEN`、`UPLOAD_DIR`、CORS 源等）
- [x] T010 实现 Prisma 模块与迁移脚本：`apps/backEnd/src/prisma/prisma.module.ts`、`apps/backEnd/src/prisma/prisma.service.ts`，并生成首迁 `apps/backEnd/prisma/migrations/`
- [x] T011 [P] 实现统一分页/排序/过滤工具于 `apps/backEnd/src/common/pagination/`（query DTO + 解析辅助）
- [x] T012 [P] 配置全局 ValidationPipe、Helmet、CORS、Rate Limiting、异常过滤器与 pino-http 于 `apps/backEnd/src/main.ts` 与 `apps/backEnd/src/common/`
- [x] T013 [P] 启用 Swagger（`@nestjs/swagger`）于 `apps/backEnd/src/main.ts`，约定前缀 `/api/v1`
- [x] T014 实现 `GET /api/v1/health`：`apps/backEnd/src/modules/health/`
- [x] T015 实现本地磁盘存储适配器接口与实现：`apps/backEnd/src/modules/uploads/storage.adapter.ts`、`local-storage.adapter.ts`（预留 S3 接口形状）
- [x] T016 实现上传模块骨架：`apps/backEnd/src/modules/uploads/`（`POST /api/v1/uploads`，鉴权使用 `IMPORT_TOKEN` Guard，不交付登录 UI）
- [x] T017 实现 Seed：至少 1 个作者 User（bcrypt 密码哈希）于 `apps/backEnd/prisma/seed.ts`，供 Post.authorId 使用
- [x] T018 配置前端 API 客户端与环境变量：`apps/frontEnd/src/lib/api.ts`、`apps/frontEnd/.env.example`（`NEXT_PUBLIC_API_BASE_URL`）
- [x] T019 [P] 初始化 shadcn/ui 风格基础组件与 `next-themes` 主题提供者于 `apps/frontEnd/src/components/ui/`、`apps/frontEnd/src/components/theme-provider.tsx`、`apps/frontEnd/src/app/layout.tsx`
- [x] T020 打通 Compose 启动路径：文档化于根 `README.md`（中文）

**Checkpoint**: 数据库可迁移、后端 health/Swagger 可访问、前端可启动并读到 API Base URL

---

## Phase 3: User Story 1 - 浏览文章列表 (Priority: P1) 🎯 MVP

**Goal**: 读者打开首页看到全部已发布文章（标题、摘要、日期、可选封面），可点击进入详情入口

**Independent Test**: 库中 ≥3 篇已发布文时，仅打开首页即可验证全量列表、排序、空状态与封面展示

### Implementation for User Story 1

- [x] T021 [P] [US1] 实现 Post Repository：`apps/backEnd/src/modules/posts/posts.repository.ts`
- [x] T022 [P] [US1] 实现公开列表 DTO：`apps/backEnd/src/modules/posts/dto/post-summary.dto.ts`、`list-posts.query.dto.ts`（支持 `all=true`）
- [x] T023 [US1] 实现 PostsService.listPublished：`apps/backEnd/src/modules/posts/posts.service.ts`
- [x] T024 [US1] 实现 `GET /api/v1/posts`：`apps/backEnd/src/modules/posts/posts.controller.ts` + `posts.module.ts`
- [x] T025 [P] [US1] 实现前端类型与获取函数：`apps/frontEnd/src/lib/posts.ts`
- [x] T026 [P] [US1] 实现列表项 UI（封面可选）：`apps/frontEnd/src/features/posts/post-list-item.tsx`
- [x] T027 [US1] 实现首页路由 SSR：`apps/frontEnd/src/app/page.tsx`
- [x] T028 [US1] 完善列表组件：`apps/frontEnd/src/features/posts/post-list.tsx`
- [x] T029 [US1] 列表封面尺寸/优先级策略与 `apps/frontEnd/next.config.js` images 配置

**Checkpoint**: 首页可独立验收 US1

---

## Phase 4: User Story 2 - 沉浸式阅读正文 (Priority: P1)

**Goal**: 详情页展示标题、日期、可选封面与完整 Markdown/MDX 正文；低干扰；支持返回列表

### Implementation for User Story 2

- [x] T030 [P] [US2] 实现 PostDetail DTO 与 Repository.findPublishedBySlug
- [x] T031 [US2] 实现 `GET /api/v1/posts/:slug`
- [x] T032 [P] [US2] 实现 MDX 渲染：`apps/frontEnd/src/lib/mdx.tsx`
- [x] T033 [P] [US2] 实现详情布局：`apps/frontEnd/src/features/posts/post-detail.tsx`
- [x] T034 [US2] 实现详情路由：`apps/frontEnd/src/app/posts/[slug]/page.tsx`
- [x] T035 [US2] 实现中文 404：`apps/frontEnd/src/app/posts/[slug]/not-found.tsx`、`apps/frontEnd/src/app/not-found.tsx`
- [x] T036 [US2] 确认详情页无评论区/登录墙/社交强制模块

**Checkpoint**: US2 可独立打开详情验收

---

## Phase 5: User Story 3 - 作者用 Markdown 发布文章 (Priority: P1)

### Implementation for User Story 3

- [x] T037 [P] [US3] frontmatter 解析：`apps/backEnd/src/modules/posts/markdown/frontmatter.ts`
- [x] T038 [US3] 导入服务（含于 `posts.service.ts`）
- [x] T039 [US3] `POST /api/v1/posts/import` + `IMPORT_TOKEN` Guard
- [x] T040 [P] [US3] CLI：`apps/backEnd/scripts/import-content.ts`
- [x] T041 [US3] 标签关联写入（仅存储/展示，无筛选 UI）
- [x] T042 [P] [US3] 示例 Markdown 于 `content/posts/`（含草稿与缺 slug 样例）
- [x] T043 [US3] `POST/PATCH/DELETE /api/v1/posts`（禁止静默改 slug）
- [x] T044 [US3] 作者发布流程文档：`content/README.md` 与根 `README.md`

**Checkpoint**: 导入后公开可见性规则符合澄清

---

## Phase 6: User Story 4 - 基础 SEO 可发现 (Priority: P2)

- [x] T045 [P] [US4] 首页 Metadata：`apps/frontEnd/src/app/layout.tsx`、`page.tsx`
- [x] T046 [US4] 详情 `generateMetadata`：`apps/frontEnd/src/app/posts/[slug]/page.tsx`
- [x] T047 [P] [US4] `apps/frontEnd/src/app/sitemap.ts`
- [x] T048 [P] [US4] `apps/frontEnd/src/app/robots.ts`
- [x] T049 [US4] 详情 SSR 输出正文（MDX RSC）

**Checkpoint**: SEO 基础项可按 quickstart 验收

---

## Phase 7: User Story 5 - 按标签筛选 (Priority: P3) — 第一版跳过

- [x] T050 [US5] 确认跳过标签筛选 UI（仅允许标签展示）

---

## Phase 8: Polish & Cross-Cutting Concerns

- [x] T051 [P] Husky + lint-staged 配置于仓库根（需 git init 后 `pnpm prepare` 生效）
- [x] T052 [P] 中文 UI 文案（空状态、404、错误提示）
- [x] T053 列表封面 sizes/priority 策略
- [ ] T054 按 `quickstart.md` 完整跑通（**阻塞**：本机未安装 Docker，需安装后启动 postgres 再验收）
- [x] T055 [P] Swagger 与 `contracts/api.md` 公开接口对齐

---

## 规格外（默认跳过 — 须先修订 spec 再执行）

- [ ] T056 实现 JWT Auth 模块于 `apps/backEnd/src/modules/auth/`
- [ ] T057 实现嵌套评论 API 于 `apps/backEnd/src/modules/comments/`
- [ ] T058 实现前端评论树 UI 于 `apps/frontEnd/src/features/comments/`
- [ ] T059 实现延迟加载 FlexSearch 于 `apps/frontEnd/src/features/search/`
- [ ] T060 实现标签/分类筛选 UI

---

## Notes

- 路径一律 `apps/frontEnd`、`apps/backEnd`
- 公开列表使用 `GET /posts?all=true`
- 规格外项 T056–T060 默认不执行