# Research: 作者撰写文章（003）

**Feature**: `003-author-write-post` | **Date**: 2026-07-30

---

## R-001 定时发布如何生效（无 Redis / 无队列）

**Decision**: **查询时惰性可见**。公开列表/详情过滤条件为：`published === true` 且（`scheduledAt` 为空 **或** `scheduledAt <= now`）。到达预约点后无需后台 Job；可选在读取时把「已到期预约」规范化（例如确保 `publishedAt` 已写入），但不依赖定时扫表。

**Rationale**: 宪章禁止默认引入 Redis/消息队列；个人站流量低，惰性规则足够正确且可测。

**Alternatives considered**:
- Nest `@Cron` 每分钟扫描：可做，但多一份运维与时钟依赖；非必需。
- 外部队列/延迟任务：过重，拒绝。

---

## R-002 文章状态如何表达

**Decision**: 沿用 `published: boolean`，新增 `scheduledAt: DateTime?`。派生状态：

| 派生状态 | 条件 |
|----------|------|
| 草稿 | `published === false` 且无有效未来预约（`scheduledAt` 空或已清空） |
| 预约中 | `published === true` 且 `scheduledAt > now` |
| 已发布（公开可见） | `published === true` 且（`scheduledAt` 空或 `scheduledAt <= now`） |

立即发布：`published=true`，`scheduledAt=null`，`publishedAt=now`。  
预约：`published=true`，`scheduledAt=未来`，`publishedAt=scheduledAt`（展示用）。  
撤回草稿：`published=false`，`scheduledAt=null`，可保留 `publishedAt` 历史或清空（实现选清空公开时间戳以免误导）。

**Rationale**: 少改既有布尔字段；公开查询只加时间条件。

**Alternatives considered**:
- 独立 `Status` 枚举：更清晰但迁移与全站查询改动更大；可后续再演进。

---

## R-003 Markdown 编辑与预览

**Decision**: 编辑区为 **Markdown 文本** + 常用插入工具栏（标题/粗体/列表/链接/代码块等）；预览区渲染 Markdown（复用前端既有 MDX/渲染能力或轻量 markdown 渲染）。不做 TipTap/ProseMirror 富文本默认方案。

**Rationale**: 对齐宪章与 FR-003；保持与仓库 `.md` 导入同构。

**Alternatives considered**:
- WYSIWYG：与 Markdown 源真相冲突，复杂度高，拒绝作为默认。

---

## R-004 Slug 建议生成

**Decision**: 前端（或前后端皆可）根据标题生成建议 slug：拉丁字母/数字/连字符；中文标题优先转写为拼音或退化为「可读短随机 + 手工改」。保存前可编辑；`published` 且已对公众可见后默认只读，修改需显式确认警告。冲突返回 409。

**Rationale**: 满足 Clarify「自动建议 + 可改 + 发布后锁定」。

**Alternatives considered**:
- 纯手填：摩擦大。
- 完全不可编辑自动 slug：与作者自定义 URL 习惯冲突。

---

## R-005 封面上传鉴权

**Decision**: 作者封面上传走既有 uploads，**鉴权改为 JWT Cookie（ADMIN|AUTHOR）**；保留 `IMPORT_TOKEN` 仅给导入脚本（若当前上传只认 import token，则扩展为「JWT 或 import token」）。

**Rationale**: Web 作者不应依赖 CI 导入令牌。

**Alternatives considered**:
- 仅填外链 URL、不上传：可作为补充，但不能替代本地封面上传能力（规格要求上传或地址）。

---

## R-006 作者路由与列表

**Decision**:
- `/author`：入口（链到列表 / 新建）
- `/author/posts`：我的文章（草稿 / 预约中 / 已发布）
- `/author/posts/new`、`/author/posts/[id]/edit`：编辑器
- 未登录访问 → `/login`

**Rationale**: 对齐 Clarify 的列表 + 新建；与 002 作者区衔接。

---

## R-007 与 Markdown 导入共存

**Decision**: 导入继续写同一 `Post` 表；Web 编辑同一行。slug 冲突时导入/保存均失败并提示。不自动双向同步回 `content/posts` 文件（避免复杂）；文件导入仍是可选工作流。

**Rationale**: FR-011；YAGNI 不做文件往返同步。

---

## R-008 分类 UI

**Decision**: 第一版 **可选**：若有 Category 数据则编辑器提供简单下拉；无则可不展示。标签以名称/slug 列表维护（创建或不存在则 upsert）。

**Rationale**: FR-007 软性；不阻塞 P1。
