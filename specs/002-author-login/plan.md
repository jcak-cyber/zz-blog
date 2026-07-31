# Implementation Plan: 作者登录

**Branch**: `002-author-login` | **Date**: 2026-07-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-author-login/spec.md`

**Note**: 本计划由 `/speckit-plan` 生成；实现任务见后续 `/speckit-tasks`（本命令不创建 `tasks.md`）。

## Summary

在既有 `apps/frontEnd` + `apps/backEnd` 上交付**作者专用登录**：邮箱/密码校验、HttpOnly Cookie 会话、登出、极简作者入口页；读者列表与详情保持免登录。复用已有 `User` 表与 seed 作者账号，落地 001 合同中预留、但未实现的 Auth API，并补齐前端 `/login` 与受保护 `/author` 页面。

## Technical Context

**Language/Version**: TypeScript 5.x（与 001 一致）

**Primary Dependencies**:
- 前端：Next.js 14 App Router、React 18、Tailwind、既有样式体系；登录表单用受控组件或轻量表单校验（Zod 已在依赖中，可选用）
- 后端：NestJS、Prisma、`bcryptjs`（已有）、新增 JWT 签发/校验（如 `@nestjs/jwt`）、Cookie 读写、既有 `@nestjs/throttler` 用于登录限流
- 通信：RESTful JSON；跨域 Cookie（`credentials: true`，CORS 已开）

**Storage**: PostgreSQL 中既有 `User`；会话状态以 JWT Cookie 承载，**不**新增 Redis / 服务端 Session 表（简洁优先）

**Testing**: 后端 Jest/Supertest 覆盖 login/logout/me 合同；前端以 quickstart 手工走查为主；可选 Playwright 冒烟登录成功/失败

**Target Platform**: 本地 Docker Compose（postgres）+ 浏览器；前后端分端口（默认 3000 / 4000）

**Project Type**: Monorepo Web（`apps/frontEnd` + `apps/backEnd`）

**Performance Goals**: 登录页不得拖慢公开首页首屏；认证相关脚本仅加载于登录/作者路径；Cookie 体积保持小（短 JWT claims）

**Constraints**:
- 无公众注册、无 OAuth、无找回密码
- 无阅读路径登录墙
- 无完整 CMS / 在线编辑器（作者入口极简）
- 不引入 Redis、消息队列
- 文案简体中文；目录仍用 `frontEnd`/`backEnd`

**Scale/Scope**: 单一作者账号；个人站低频登录

## Constitution Check

*GATE: Phase 0 前必须评估；Phase 1 后复检。*

| 门禁 | 结果 | 说明 |
|------|------|------|
| I. 中文优先 | PASS | 本计划与设计产物使用简体中文 |
| II. 规格驱动 | PASS | 以 `002-author-login/spec.md` 为验收边界；显式扩展 001「不做登录」 |
| III. 简洁优先 | PASS | 仅作者登录 + Cookie JWT + 极简入口；不做会员体系/CMS |
| IV. 可验证交付 | PASS | 用户故事与 quickstart 可独立验收 |
| V. 一致性 / 目录布局 | PASS | 代码落在 `apps/frontEnd`、`apps/backEnd`；UI 示意若有则 `docs/ui/` |
| VI. 性能优先 | PASS | 公开阅读路径不增加强制鉴权；登录资源局部化 |
| VII. 内容与可发现性 | PASS | 不改变 Markdown 发文主路径；登录页可 `noindex` |
| 产品定位 | PASS | 作者工具入口，非社交/复杂后台 |

**Phase 1 后复检**: 数据模型仅强化既有 User 用法；合同限定 auth + me + 作者页；无评论/注册扩大。**门禁保持 PASS**。

## Project Structure

### Documentation (this feature)

```text
specs/002-author-login/
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
        login/page.tsx          # 登录页
        author/page.tsx         # 作者入口（受保护）
        # 可选 middleware.ts    # 保护 /author
      features/
        auth/                   # 登录表单、会话展示、登出
      lib/
        auth.ts                 # 登录/登出/me 客户端或服务端调用
        api.ts                  # 扩展 credentials / Cookie 请求
  backEnd/
    src/
      modules/
        auth/                   # login / logout / refresh / me
        users/                  # 可选：按 email 查用户（可内嵌 auth）
      common/
        guards/                 # JwtAuthGuard（Cookie）
        decorators/             # @Public / @CurrentUser
    prisma/                     # 沿用 User；seed 已有作者
```

**Structure Decision**: 延续宪章 monorepo；本功能主要新增 `auth` 后端模块与前端 `login`/`author` 路由及 `features/auth`，不新建应用。

## Complexity Tracking

> 本功能无宪章门禁违规，无需强制填写。下列仅记录相对「纯静态站」的必要复杂度。

| 项 | Why Needed | Simpler Alternative Rejected Because |
|----|------------|-------------------------------------|
| JWT Access + Refresh（HttpOnly Cookie） | 与 001 合同预留一致；刷新页面保持登录；降低 XSS 读 token 风险 | localStorage 存 token 易被 XSS 窃取；纯服务端 Session+Redis 违反「不引入 Redis」 |
| 登录 Throttle | 规格允许防滥用；降低撞库 | 无限制在公网暴露风险更高 |
