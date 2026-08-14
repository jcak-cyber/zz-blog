# Implementation Plan: 开放注册与文章表态

**Branch**: `004-open-register-votes` | **Date**: 2026-08-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-open-register-votes/spec.md`

**Note**: 本计划由 `/speckit-plan` 生成；实现任务见后续 `/speckit-tasks`（本命令不创建 `tasks.md`）。

## Summary

在既有登录与撰写台之上开放**公众自助注册**（用户名 + 密码 ≥8；注册成功不自动登录），使每位登录用户可管理**本人**文章；公开列表/详情展示**作者用户名**；详情正文下方提供需登录的**点赞/点踩**（互斥可取消）。技术上扩展 `User`（用户名）、收紧作者写 API 的归属校验、新增表态实体与公开计数/本人状态 API，前端补注册页与详情表态控件。

## Technical Context

**Language/Version**: TypeScript 5.x（与现网一致）

**Primary Dependencies**:
- 前端：Next.js 14 App Router、React 18、Tailwind、既有墨色样式；Zod 表单校验（可选）
- 后端：NestJS、Prisma、bcryptjs、既有 JWT Cookie 会话、`@nestjs/throttler`（注册/登录/表态限流）
- 通信：RESTful JSON；`credentials: include`

**Storage**: PostgreSQL；`User` 增加 `username`；新增 `PostReaction`；slug 继续全站 `@unique`

**Testing**: 后端 Jest/Supertest 覆盖 register / 归属隔离 / 表态互斥；前端以 quickstart 手工走查为主

**Target Platform**: 本地 Docker Compose（postgres）+ 浏览器；默认端口 3000 / 4000

**Project Type**: Monorepo Web（`apps/frontEnd` + `apps/backEnd`）

**Performance Goals**: 公开详情表态控件客户端轻量；计数查询避免 N+1；不拖慢首页首屏（表态脚本仅详情页加载）

**Constraints**:
- 无邮箱验证、无 OAuth、无找回密码
- 无评论/关注/转发等其它社交
- 注册成功不自动登录
- 表态必须登录；slug 全站唯一
- 文案简体中文；目录 `apps/frontEnd` / `apps/backEnd`

**Scale/Scope**: 个人站小流量多作者；表态按「用户×文章」一行

## Constitution Check

*GATE: Phase 0 前必须评估；Phase 1 后复检。*

| 门禁 | 结果 | 说明 |
|------|------|------|
| I. 中文优先 | PASS | 本计划与设计产物使用简体中文 |
| II. 规格驱动 | PASS | 以 `004-open-register-votes/spec.md`（含 Clarifications）为边界 |
| III. 简洁优先 | PASS | 仅注册 + 归属写 + 赞踩；不引入会员体系/Feed/通知 |
| IV. 可验证交付 | PASS | 用户故事与 quickstart 可独立验收 |
| V. 一致性 / 目录布局 | PASS | 代码落在 `apps/*`；UI 参照 `docs/ui/` 若落盘 |
| VI. 性能优先 | PASS | 阅读路径免登录；表态局部于详情；无重型第三方脚本 |
| VII. 内容与可发现性 | PASS | 不改变 Markdown/撰写主路径；公开 URL 仍按全站唯一 slug |
| 产品定位 | PASS（有边界） | 开放写作与轻量表态服务「写作/阅读」；规格显式排除社交堆砌（FR-010） |

**Phase 1 后复检**: 模型仅增 `username` + `PostReaction`；合同扩展 auth register、公开 author 字段、reactions；作者写 API 加归属。**门禁保持 PASS**。

## Project Structure

### Documentation (this feature)

```text
specs/004-open-register-votes/
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
      app/
        login/page.tsx              # 链到注册；字段改为用户名
        register/page.tsx           # 新增注册页
        posts/[slug]/page.tsx       # 挂载表态区；展示作者名
        page.tsx                    # 列表展示作者名
      features/
        auth/                       # 注册表单、登录字段对齐
        posts/
          post-reactions.tsx        # 赞/踩控件（客户端）
          post-detail.tsx / list    # 展示 author.username
      lib/
        auth.ts                     # register API
        posts.ts                    # 摘要/详情含 author；reactions API
  backEnd/
    prisma/
      schema.prisma                 # User.username；PostReaction
      seed.ts                       # 种子账号补 username
    src/modules/
      auth/                         # POST /auth/register；login 按 username
      posts/                        # 公开 DTO 含 author；写操作按 JWT.sub 归属
      reactions/                    # 新增：计数、本人状态、赞/踩/取消
```

**Structure Decision**: 延续 monorepo；不新建应用。表态独立 `reactions` 模块，避免继续膨胀 posts 控制器。

## Complexity Tracking

| 项 | Why Needed | Simpler Alternative Rejected Because |
|----|------------|-------------------------------------|
| User 增加 username（保留 email 列） | 规格要求用户名登录；兼容既有 email 唯一列与 seed | 直接删 email 破坏 002 数据与迁移成本高 |
| PostReaction 表 | 互斥赞踩、可取消、按用户去重 | 仅文章上 likeCount 无法表达本人状态与改选 |
| 作者写 API 强制 authorId=JWT.sub | 多作者后必须防越权 | 继续 firstAuthor() 会让所有人改同一作者稿 |
| 注册/登录/表态 Throttle | 开放注册后防刷号与刷票 | 无限流在公网风险更高 |
