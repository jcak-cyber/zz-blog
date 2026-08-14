# Implementation Plan: 个人中心资料（昵称 / 头像 / 简介）

**Branch**: `005-author-profile` | **Date**: 2026-08-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-author-profile/spec.md`

**Note**: 本计划由 `/speckit-plan` 生成；实现任务见后续 `/speckit-tasks`（本命令不创建 `tasks.md`）。

## Summary

在既有「手稿台 / 个人中心」扩展**必填昵称**（默认等于用户名、不可清空）、**头像上传/更换/删除**与**个人简介（显式保存）**。技术上扩展 `User` 资料字段；`GET/PATCH` 本人资料 API；复用既有 `/uploads`；公开文章作者展示改为**昵称**；前端改造 `author-entry` 双栏资料区并同步 `AuthUser` / 列表详情作者名。

## Technical Context

**Language/Version**: TypeScript 5.x（与现网一致）

**Primary Dependencies**:
- 前端：Next.js 14 App Router、React 18、Tailwind、既有墨色样式与上传封装（`uploadCover` / `deleteUpload`）
- 后端：NestJS、Prisma、JWT Cookie、既有 `UploadsModule`（multer 本地存储）
- 通信：RESTful JSON；`credentials: include`

**Storage**: PostgreSQL；`User` 增加 `nickname`、`avatarUrl`、`bio`；头像文件仍落本地 `uploads/`

**Testing**: 以 [quickstart.md](./quickstart.md) 手工走查为主；可选后端对 profile PATCH / 昵称校验补轻量单测

**Target Platform**: 本地 Docker Compose（postgres）+ 浏览器；默认端口 3000 / 4000

**Project Type**: Monorepo Web（`apps/frontEnd` + `apps/backEnd`）

**Performance Goals**: 资料编辑仅个人中心；公开列表只多读 `nickname` 字段，不拖慢首屏；头像图按需加载

**Constraints**:
- 不改密码 / 不改登录用户名 / 无作者公开主页 / 无关注私信
- 昵称必填、默认 = username、不可清空（Clarifications）
- 简介显式保存；头像可删回占位
- 文案简体中文；目录 `apps/frontEnd` / `apps/backEnd`

**Scale/Scope**: 个人站；每用户一份资料；头像当前生效一张

## Constitution Check

*GATE: Phase 0 前必须评估；Phase 1 后复检。*

| 门禁 | 结果 | 说明 |
|------|------|------|
| I. 中文优先 | PASS | 本计划与设计产物使用简体中文 |
| II. 规格驱动 | PASS | 以 `005-author-profile/spec.md`（含 Clarifications）为边界 |
| III. 简洁优先 | PASS | 仅资料三字段 + 复用上传；不建作者主页/社交 |
| IV. 可验证交付 | PASS | 用户故事与 quickstart 可独立验收 |
| V. 一致性 / 目录布局 | PASS | 代码落在 `apps/*`；手稿台页内扩展 |
| VI. 性能优先 | PASS | 阅读路径无重型脚本；公开侧仅多一个字段 |
| VII. 内容与可发现性 | PASS | 不改变 Markdown/撰写主路径 |
| 产品定位 | PASS | 资料服务作者身份展示，排除社交堆砌（FR-011） |

**Phase 1 后复检**: 模型仅增三列；合同扩展 `/auth/me` 与 `PATCH /auth/profile`；公开 `author.nickname`。**门禁保持 PASS**。

## Project Structure

### Documentation (this feature)

```text
specs/005-author-profile/
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
        author/page.tsx                 # 个人中心仍挂手稿台
      features/
        auth/
          author-entry.tsx              # 双栏：昵称 / 头像 / 简介 / 既有入口
          profile-nickname-form.tsx     # 可选拆分：修改昵称
          profile-avatar.tsx            # 可选拆分：上传/删除头像
          profile-bio-form.tsx          # 可选拆分：简介 + 保存按钮
        posts/
          post-list-item.tsx            # 作者显示 nickname
          post-detail.tsx               # 同上
      lib/
        auth.ts                         # me/profile 类型与 PATCH
        posts.ts                        # AuthorSummary 含 nickname
  backEnd/
    prisma/
      schema.prisma                     # User.nickname / avatarUrl / bio
      migrations/                       # 回填 nickname = username
      seed.ts                           # 种子账号写 nickname
    src/modules/
      auth/                             # me 扩展；PATCH /auth/profile；注册写 nickname
      posts/                            # 公开 author 投影含 nickname
```

**Structure Decision**: 沿用 monorepo `apps/frontEnd` + `apps/backEnd`；资料 API 挂在既有 `auth` 模块，头像文件复用 `uploads`，避免新服务。

## Complexity Tracking

> 无宪章门禁违规，本表留空。
