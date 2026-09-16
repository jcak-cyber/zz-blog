# Implementation Plan: 文章评论侧栏

**Branch**: `006-post-comments` | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-post-comments/spec.md`

**Note**: 本计划由 `/speckit-plan` 生成；实现任务见后续 `/speckit-tasks`（本命令不创建 `tasks.md`）。

## Summary

在已发布文章详情页，于既有赞/踩旁增加**评论入口 + 总数**；点击后打开右侧**评论侧栏**，支持浏览（较新在前）、登录发表（≤1000 字、同文约 30 秒 1 条）、评论点赞（含数字）、有权限者**硬删除**。技术上复用已有 Prisma `Comment`（首版扁平、`parentId` 恒空），新增 `CommentReaction`；评论列表按需在打开侧栏后拉取；详情首屏仅附加轻量 `commentCount`。前端沿用阅读页墨色气质，信息架构对齐设计图。

## Technical Context

**Language/Version**: TypeScript 5.x（与现网一致）

**Primary Dependencies**:
- 前端：Next.js 14 App Router、React 18、Tailwind、lucide-react、既有 `PostReactions` / JWT Cookie 会话
- 后端：NestJS、Prisma、JWT Cookie、`Throttler`（全局 + 评论发表业务限频）
- 通信：RESTful JSON；`credentials: include`

**Storage**: PostgreSQL；既有 `Comment`；新建 `CommentReaction`；删除为物理删除（Cascade 清点赞）

**Testing**: 以 [quickstart.md](./quickstart.md) 手工走查为主；可选后端对限频 / 删除权限补轻量单测

**Target Platform**: 本地 Docker Compose（postgres）+ 浏览器；默认端口 3000 / 4000

**Project Type**: Monorepo Web（`apps/frontEnd` + `apps/backEnd`）

**Performance Goals**: 详情首屏不拉评论列表；打开侧栏后再取列表；`commentCount` 为轻量聚合

**Constraints**:
- 无楼中楼 UI；无图片评论；无审核后台；无评论编辑
- 删除：本人 / 文章作者 / ADMIN；硬删除不可恢复
- 发表：登录用户；同用户同文约 30s 一条；正文 1～1000 字符
- 文案简体中文；目录 `apps/frontEnd` / `apps/backEnd`

**Scale/Scope**: 个人站；单文评论量通常数百内；首版列表可分页或单次上限（见 research）

## Constitution Check

*GATE: Phase 0 前必须评估；Phase 1 后复检。*

| 门禁 | 结果 | 说明 |
|------|------|------|
| I. 中文优先 | PASS | 本计划与设计产物使用简体中文 |
| II. 规格驱动 | PASS | 以 `006-post-comments/spec.md`（含 Clarifications）为边界 |
| III. 简洁优先 | PASS | 复用 `Comment`；扁平列表；图片/楼中楼/审核均不做 |
| IV. 可验证交付 | PASS | 用户故事与 quickstart 可独立验收 |
| V. 一致性 / 目录布局 | PASS | 代码落在 `apps/*`；互动区扩展既有详情页 |
| VI. 性能优先 | PASS | 列表延迟加载；首屏仅 count |
| VII. 内容与可发现性 | PASS | 不改变 Markdown 写作主路径 |
| 产品定位 | PASS | 评论服务阅读讨论，不做社交堆砌 |

**Phase 1 后复检**: 合同限定公开文章评论 API；模型仅增 `CommentReaction` 与必要索引；侧栏按需加载。**门禁保持 PASS**。

## Project Structure

### Documentation (this feature)

```text
specs/006-post-comments/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api.md
└── tasks.md              # 由 /speckit-tasks 生成，本阶段不创建
```

### Source Code (repository root)

```text
apps/
  frontEnd/
    src/
      app/posts/[slug]/page.tsx          # 详情 SSR：可读 commentCount
      features/posts/
        post-detail.tsx                    # 挂载评论入口
        post-reactions.tsx                 # 既有赞/踩旁并列评论按钮
        post-comments-drawer.tsx           # 侧栏：列表 / 发表 / 点赞 / 删除
        post-comment-composer.tsx          # 可选拆分：输入区
      lib/
        comments.ts                        # fetch/create/like/delete 封装
  backEnd/
    prisma/
      schema.prisma                        # Comment 沿用；CommentReaction 新建
      migrations/
    src/modules/
      comments/                            # 新建 CommentsModule
        comments.controller.ts
        comments.service.ts
        dto/
      posts/                               # 公开详情可选带 commentCount
```

**Structure Decision**: 沿用 monorepo；评论独立 `comments` 模块（对标 `reactions`）；前端侧栏组件挂在详情互动区，不引入第三方评论服务。

## Complexity Tracking

> 无宪章门禁违规，本表留空。
