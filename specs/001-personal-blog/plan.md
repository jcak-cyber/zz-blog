# Implementation Plan: 极简个人博客（第一版）

**Branch**: `001-personal-blog` | **Date**: 2026-07-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-personal-blog/spec.md`，外加计划阶段明确的技术栈与架构要求。

**Note**: 本计划由 `/speckit-plan` 生成；实现任务见后续 `/speckit-tasks`（本命令不创建 `tasks.md`）。

## Summary

构建前后端分离的个人博客：Next.js（App Router）负责渲染、交互与 SEO；NestJS 仅提供 RESTful JSON API；PostgreSQL + Prisma 持久化。读者侧交付文章列表/详情、沉浸阅读、基础 SEO、Markdown 正文与封面图；作者侧以可版本管理的内容写入为主，经 API 对外提供已发布内容。

计划输入中的 JWT 认证、嵌套评论、客户端全文搜索、暗黑模式等，作为**目标架构能力**纳入设计；其中与现行 `spec.md` / 宪章冲突的部分见「Constitution Check」与「Complexity Tracking」，**实现前须修订规格或拆到后续 feature，不得静默扩大 001 验收范围**。

## Technical Context

**Language/Version**: TypeScript 5.x（前端与后端统一）

**Primary Dependencies**:
- 前端：Next.js（App Router）+ React 18 + Tailwind CSS + shadcn/ui + Zustand + React Hook Form + Zod + next-mdx-remote + next-themes + FlexSearch（或 Pagefind）
- 后端：NestJS + Prisma + Helmet + CORS + Rate Limiting + bcrypt + pino-http + @nestjs/config + @nestjs/swagger
- 通信：RESTful JSON（不使用 GraphQL / tRPC）

**Storage**: PostgreSQL；MVP 文件（封面/正文图）本地磁盘，预留 S3 适配器接口；禁止 MongoDB / Firebase / Supabase

**Testing**: 前端 Vitest + Playwright（冒烟）；后端 Jest（Nest 默认）+ Supertest（合同/集成）；以规格验收场景为准

**Target Platform**: Docker + Docker Compose 本地/生产一致；浏览器（桌面 + 移动可读）

**Project Type**: Monorepo Web 应用（`apps/frontEnd` + `apps/backEnd`）

**Performance Goals**: 首页主要内容约 1 秒内可见（SC-002）；主路径首页→详情 ≤10 秒（SC-003）；优先 SSR/流式与图片优化，避免阻塞首屏的重客户端包

**Constraints**:
- 不使用 Redis、消息队列、微服务
- 不使用 Redux / MobX
- 所有 API 必须有 DTO + Swagger
- 首页公开列表一次返回全部已发布文章（与规格澄清一致；管理端 API 仍统一分页封装）
- UI 文案与过程文档：简体中文

**Scale/Scope**: 单作者个人站；已发布文章数十篇量级；匿名读者为主

## Constitution Check

*GATE: Phase 0 前必须评估；Phase 1 后复检。*

| 门禁 | 结果 | 说明 |
|------|------|------|
| I. 中文优先 | PASS | 本计划与设计产物使用简体中文 |
| II. 规格驱动 | CONDITIONAL | 计划输入扩大了规格范围（认证/评论/搜索等）；须修订 `spec.md` 或拆 feature 后方可把扩展开入 001 验收 |
| III. 简洁优先 | CONDITIONAL | Nest+PG+JWT+评论相对「仓库 Markdown 静态站」更重；见 Complexity Tracking 正当理由 |
| IV. 可验证交付 | PASS | 保留可度量成功标准；合同与 quickstart 可映射验收 |
| V. 一致性 / 目录布局 | PASS（已裁决） | 宪章要求 `apps/frontEnd`、`apps/backEnd`；**拒绝**改名为 `apps/web`、`apps/server` |
| VI. 性能优先 | PASS | Next Image、SSR/Metadata、控制客户端重量；列表含封面时须有图片策略 |
| VII. 内容与可发现性 | PASS | Markdown/MDX 渲染 + Metadata + sitemap + robots |
| 产品定位：反社交/反复杂 CMS | FAIL→须处理 | 规格 FR-010 禁止评论与注册登录；计划输入要求 JWT + 嵌套评论 → **实现闸门未开** |

**Phase 1 后复检**: 数据模型与合同已包含 User/Comment 等扩展实体，但 quickstart 的 001 验收路径仅覆盖规格内公开阅读与发布可见性；扩展能力标注为「规格外 / 待修订」。

## Project Structure

### Documentation (this feature)

```text
specs/001-personal-blog/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md              # 由 /speckit-tasks 生成，本阶段不创建
```

### Source Code (repository root)

```text
apps/
  frontEnd/                 # Next.js App Router
    src/
      app/                  # 路由、Metadata、sitemap、robots
      components/           # shadcn + 业务组件
      features/             # 列表、详情、（预留）认证/评论/搜索 UI
      lib/                  # API client、FlexSearch 索引构建等
      styles/
    public/
    Dockerfile
  backEnd/                  # NestJS
    src/
      modules/
        auth/
        users/
        posts/
        tags/
        categories/
        comments/
        uploads/
      common/               # 分页/排序/过滤、守卫、过滤器
      prisma/
    uploads/                # MVP 本地磁盘（gitignore 大文件策略另定）
    Dockerfile
docs/
  ui/                       # 设计稿/页面示意（非文章配图）
content/                    # 可选：仓库内 Markdown 源（作者工作流）
  posts/
docker-compose.yml          # frontEnd + backEnd + postgres
package.json                # monorepo 根（ESLint/Prettier/Husky）
```

**Structure Decision**: 采用宪章规定的 `apps/frontEnd` + `apps/backEnd` monorepo；根目录 Docker Compose 编排；文章配图走后端上传/本地磁盘（可版本管理策略见 research）；设计稿仍在 `docs/ui/`。

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| NestJS + PostgreSQL + Prisma 全栈 API | 计划输入明确要求前后端分离与 JSON API，便于后续扩展与 Swagger 合同 | 纯静态生成/无后端无法满足「后端仅 JSON API」与统一 DTO/Swagger 要求 |
| JWT（Access + Refresh，HttpOnly Cookie） | 计划输入要求；便于未来作者管理端 | 规格 FR-010 禁止登录；**001 公开站可不启用登录 UI**，但保留模块；启用前须修订规格 |
| 嵌套评论 | 计划输入要求 | 与 FR-010/沉浸阅读冲突；**默认不在 001 验收交付评论 UI**；库表与 API 可预留 |
| 客户端全文搜索 | 计划输入要求 | 规格未要求；作增强项，不得拖慢首屏（延迟加载索引） |
| 分类 Category + 标签筛选 API | 数据模型需要 | 规格 FR-011 第一版不做筛选 UI；API 可有，前端筛选交互延后 |
| Repository 分层（Controller→Service→Repository） | Nest 模块化与可测性；计划输入要求 | 直接在 Service 调 Prisma 对个人站够用，但 PO 要求严格分层 |
| 目录不用 `web`/`server` | 遵守宪章 | PO 偏好的命名与宪章冲突，以宪章为准 |

## 与规格的交付边界（001）

**必须交付（对齐 spec）**: 公开文章列表（全部已发布）、详情沉浸阅读、slug URL、SEO、显式 `published` + slug、封面（列表+详情）、正文 Markdown/MDX 图、空状态与 404、前后端分目录、Docker Compose 可启动。

**架构预留 / 须先改规格再验收**: 读者或作者登录 UI、嵌套评论 UI、标签/分类筛选 UI、复杂 CMS 后台。

**推荐后续动作**: 若坚持评论与 JWT 登录进入第一版验收，先 `/speckit-specify` 修订 FR-010 及相关成功标准，再 `/speckit-tasks`。
