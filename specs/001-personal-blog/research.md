# Research: 极简个人博客（第一版）

**Feature**: `001-personal-blog` | **Date**: 2026-07-30

本文件消解 Technical Context 中的选型与冲突，供 `data-model.md` / `contracts/` / 实现参照。

---

## R-001 仓库目录命名

**Decision**: 使用 `apps/frontEnd` 与 `apps/backEnd`。

**Rationale**: 宪章「仓库目录布局」已强制该命名；计划输入中的 `apps/web` / `apps/server` 与宪章冲突。

**Alternatives considered**:
- `apps/web` + `apps/server`：符合部分社区习惯，但需先修订宪章，本计划不采用。
- 根目录平铺 `frontend/`：违背「统一放在 apps/」约定。

---

## R-002 内容真相来源（Markdown vs 数据库）

**Decision**: **双轨、以可版本管理为准**——作者主路径仍为仓库内 Markdown（建议 `content/posts/*.md` + frontmatter）；通过导入/同步写入 PostgreSQL `Post`，公开站点只读 API。管理端写 API 可并存，但不取代「无复杂 CMS 也能发文」的规格路径。

**Rationale**: 规格要求仓库 Markdown + 显式 published/slug；计划要求 Nest+Prisma。同步层调和两者。

**Alternatives considered**:
- 仅 DB + 后台编辑：违背轻量 Markdown 发文与 FR-004。
- 仅静态文件无 API：违背「后端仅 JSON API」的计划输入。
- Git-based CMS（如直接读文件系统无 DB）：难满足评论/用户等扩展模型与统一分页过滤。

**Frontmatter 最小约定**（字段名可在实现时微调，语义固定）:
- `title`（必填）
- `slug`（必填方可公开）
- `published` 或 `draft`（显式发布标记）
- `date` / `publishedAt`（必填方可公开排序）
- `excerpt`（可选）
- `tags`（可选字符串数组）
- `cover` / `coverImage`（可选）
- `category`（可选；第一版可不展示筛选）

---

## R-003 认证与规格冲突

**Decision**: 后端实现 JWT（Access + Refresh，HttpOnly Cookie）与 `User` 模型；**001 规格验收不要求、也不默认开启读者登录或强制作者 Web 登录墙**。作者 Markdown 同步可用本地/CI 脚本（服务账号或受保护管理令牌），避免把「注册登录」做成公开产品能力，除非规格修订。

**Rationale**: FR-010 明确禁止第一版用户注册登录；计划又要求 JWT 栈——模块可建，验收边界不扩。

**Alternatives considered**:
- 完全不做 Auth 模块：后续加评论/后台成本高，且违背计划输入。
- 第一版就做完整登录 UI：直接违反现行规格与宪章产品定位。

---

## R-004 评论

**Decision**: 数据模型与 REST 合同预留嵌套评论（`parentId`）；**公开阅读 UI 默认不渲染评论树**，直至规格修订。若提前实现 API，须不影响详情页沉浸阅读（不注入强制模块）。

**Rationale**: 计划要求嵌套评论；规格与宪章要求反社交干扰。

**Alternatives considered**:
- 第三方评论（Giscus 等）：计划要求后端存储。
- 第一版强行上评论 UI：违反 FR-010 / SC-005。

---

## R-005 列表分页 vs「全部已发布」

**Decision**: 后端统一分页/排序/过滤封装；**公开首页列表接口提供「返回全部已发布」模式**（如 `pageSize=-1` 或不分页专用 query，需在合同写死一种），以满足澄清结论。管理端列表走常规分页。

**Rationale**: 规格澄清选 A（全部展示）；计划要求统一分页封装——两者用「公开全量 + 管理分页」并存。

**Alternatives considered**:
- 强制所有接口分页：违背已澄清规格。
- 无分页封装：违背计划输入与管理端可扩展性。

---

## R-006 Markdown 渲染

**Decision**: 前端使用 `next-mdx-remote` 渲染正文（代码高亮 + 有限自定义组件）；服务端/构建期获取 API 中的 Markdown/MDX 字符串再渲染，保证禁用脚本仍可读正文（SSR 输出 HTML）。

**Rationale**: 计划指定；且满足 FR-009 SEO/无脚本可读。

**Alternatives considered**:
- 纯 `react-markdown`：可行，但计划指定 next-mdx-remote。
- 后端渲染 HTML 入库：增加 XSS 治理面，前后端职责更重。

---

## R-007 搜索

**Decision**: 采用 **FlexSearch** 做客户端全文搜索；索引由已发布文章列表在空闲时构建，搜索 UI 延迟加载，避免阻塞首屏。Pagefind 作为静态导出场景备选，本架构以 API 动态内容为主故不首选。

**Rationale**: 计划允许 FlexSearch 或 Pagefind；动态 Nest API 内容更贴合 FlexSearch。

**Alternatives considered**:
- Pagefind：更适合全静态导出站点。
- 服务端搜索 + DB：需额外复杂度；MVP 禁止 Redis，PG `tsvector` 可远期考虑但不进 001 必做。

---

## R-008 图片与上传

**Decision**: 封面与正文图经后端上传至本地磁盘（MVP），URL 由 API 返回；预留 S3 适配接口。Next.js `<Image />` 优化 AVIF/WebP。设计稿仍只放 `docs/ui/`，与文章配图分离。

**Rationale**: 计划明确；符合 FR-005b。

**Alternatives considered**:
- 图片只放 `public/` 无上传 API：作者友好度差，难统一鉴权与未来 S3。
- 直接上 S3：超出 MVP「本地磁盘」要求。

---

## R-009 主题与 UI

**Decision**: Tailwind + shadcn/ui；`next-themes` 支持暗黑模式。视觉以 `docs/ui/` 为准；无稿时保持低干扰阅读版式。

**Rationale**: 计划指定；暗黑模式不违背规格（属表现层）。

---

## R-010 状态与表单

**Decision**: Zustand 管理轻量客户端状态；React Hook Form + Zod 用于（预留）管理/认证表单。公开阅读页尽量无重状态。

**Rationale**: 计划指定；避免 Redux 复杂度，符合简洁原则。

---

## R-011 部署与工程化

**Decision**: Docker + Compose 启动 `frontEnd`、`backEnd`、`postgres`；ESLint + Prettier；Husky + lint-staged；Conventional Commits。

**Rationale**: 计划指定；本地/生产一致降低环境漂移。

---

## R-012 禁止项确认

**Decision**: 不引入 Firebase、Supabase、tRPC、MongoDB、Redux、MobX、GraphQL、Redis、消息队列、微服务。

**Rationale**: 计划约束与简洁门禁一致。

---

## 残留风险

1. 「全量列表 + 列表封面」可能冲击 SC-002 → 实现时封面缩略图、优先级加载、尺寸限制写入任务。
2. 规格未修订前实现评论/登录 UI 会导致验收争议 → tasks 须拆「规格内 / 规格外」标签。
3. Markdown 同步与 DB 编辑冲突 → 约定 001 以同步覆盖同 slug 内容，后台编辑策略留待修订规格后定义。
