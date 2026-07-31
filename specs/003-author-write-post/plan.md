# Implementation Plan: 作者撰写文章

**Branch**: `003-author-write-post` | **Date**: 2026-07-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-author-write-post/spec.md`（含 Clarify 结论）

**Note**: 本计划由 `/speckit-plan` 生成；实现任务见后续 `/speckit-tasks`（本命令不创建 `tasks.md`）。

## Summary

在已登录作者区交付 **Markdown 撰写/编辑页**（布局参照 `docs/ui/003-author-write-post-layout.png`，视觉沿用墨色手稿）与 **「我的文章」列表**：草稿保存、立即发布、定时预约、撤回草稿、删除（含已发布，须确认）、slug 建议与锁定、摘要/封面/标签。后端扩展既有 Post CRUD 为 Cookie JWT 鉴权的作者 API，并修正公开列表/详情的「预约未到点不可见」规则；与 `content/posts` 导入共存。

## Technical Context

**Language/Version**: TypeScript 5.x（与 001/002 一致）

**Primary Dependencies**:
- 前端：Next.js 14 App Router、React 18、Tailwind、既有 globals/墨色样式；Markdown 文本域 + 轻量工具栏；预览复用既有 MDX/渲染路径或等价 Markdown→HTML；可选 Zod 校验表单
- 后端：NestJS、Prisma、既有 JWT Cookie Auth（002）、Uploads 模块（封面）、扩展 Posts 管理端点
- 通信：RESTful JSON，`credentials: 'include'`（同域 `/api/v1` rewrite）

**Storage**: PostgreSQL；Post 增加预约相关字段（见 data-model）；**不**引入 Redis / 消息队列；定时生效采用**查询时惰性可见**（见 research）

**Testing**: quickstart 手工走查为主；后端可对可见性规则与状态转换做单元/合同级用例（非强制 TDD）

**Target Platform**: 本地 Docker Compose + 浏览器（3000/4000）

**Project Type**: Monorepo Web（`apps/frontEnd` + `apps/backEnd`）

**Performance Goals**: 公开首页查询仍简单；作者编辑页仅登录作者加载，不得拖慢读者首屏包体

**Constraints**:
- Markdown 为主，非富文本 CMS
- 无评论开关生效、无点赞
- 需 002 登录；读者路径免登录墙
- 不引入 Redis/队列；目录坚持 frontEnd/backEnd
- 文案简体中文；UI 不复制参照图浅色皮肤

**Scale/Scope**: 单作者；文章数十～百篇量级；编辑页低频使用

## Constitution Check

*GATE: Phase 0 前必须评估；Phase 1 后复检。*

| 门禁 | 结果 | 说明 |
|------|------|------|
| I. 中文优先 | PASS | 计划与设计产物简体中文 |
| II. 规格驱动 | PASS | 以 003 spec + Clarifications 为边界 |
| III. 简洁优先 | PASS（有意取舍） | Web 编辑器服务「写作」；定时用惰性可见而非调度基础设施；不做社交 CMS |
| IV. 可验证交付 | PASS | quickstart 覆盖主路径与预约/撤回/删除 |
| V. 一致性 / 目录 | PASS | `apps/frontEnd`、`apps/backEnd`；UI 图在 `docs/ui/` |
| VI. 性能优先 | PASS | 编辑器隔离在 `/author/*`；公开查询保持轻量过滤 |
| VII. 内容与可发现性 | PASS | 仍以 Markdown 为正文；导入共存；公开 URL 基于 slug |
| 产品定位 | PASS | 作者写作工具，非平台化后台；视觉跟阅读站 |

**Phase 1 后复检**: 模型仅扩展 Post 预约字段与作者 API；无评论/点赞扩大。**门禁保持 PASS**。

## Project Structure

### Documentation (this feature)

```text
specs/003-author-write-post/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api.md
└── tasks.md              # /speckit-tasks 生成
```

### Source Code (repository root)

```text
apps/
  frontEnd/src/
    app/author/
      page.tsx                 # 作者入口：链到列表/新建（扩展既有）
      posts/page.tsx           # 我的文章列表
      posts/new/page.tsx       # 新建编辑器
      posts/[id]/edit/page.tsx # 编辑既有
    features/author/
      post-list.tsx
      post-editor.tsx          # 三栏布局（墨色风格）
      slug-suggest.ts
      post-preview.tsx
    lib/
      author-posts.ts          # 作者侧 API 封装（credentials）
  backEnd/src/
    modules/posts/             # 扩展：作者 CRUD、可见性、撤回、预约
    modules/uploads/           # 封面上传改用 JWT（或双鉴权）
    common/guards/             # 复用 JwtAuthGuard
  backEnd/prisma/
    schema.prisma              # Post.scheduledAt 等
    migrations/
docs/ui/003-author-write-post-layout.png
```

**Structure Decision**: 不新建应用；作者写作 UI 挂在 `/author/*`；后端扩展既有 posts/uploads。

## Complexity Tracking

| 项 | Why Needed | Simpler Alternative Rejected Because |
|----|------------|-------------------------------------|
| 定时发布（规格已选） | Clarify 明确要求预约公开 | 仅立即发布无法满足已澄清验收 |
| 查询惰性可见（非 Cron） | 满足预约且不引入 Redis/队列 | 独立调度器对个人站过重 |
| Web Markdown 编辑器 | 规格要求撰写页 | 仅保留仓库导入无法满足「登录后网页写作」 |
