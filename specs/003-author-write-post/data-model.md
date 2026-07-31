# Data Model: 作者撰写文章（003）

**Feature**: `003-author-write-post` | **Date**: 2026-07-30  
**存储**: PostgreSQL + Prisma（扩展既有 `Post`）

---

## 变更概览

```text
User 1──* Post
Post *──* Tag
Post *──? Category

Post 新增：scheduledAt（可空）
公开可见性规则更新（见下）
```

---

## Post（扩展）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PK | |
| title | String | 必填 | |
| slug | String | 唯一、必填（公开/预约前） | 可读 URL；建议自标题生成 |
| content | String | 必填（发布时）；草稿可允许暂空但发布须非空 | Markdown |
| excerpt | String? | 可选 | 摘要 |
| coverImageUrl | String? | 可选 | 封面 URL |
| published | Boolean | 默认 false | 见状态派生 |
| scheduledAt | DateTime? | 可选 | **新增**；未来时刻表示预约 |
| publishedAt | DateTime? | 公开可见时用于排序 | 立即发布=now；预约=计划时刻 |
| authorId | FK → User | 必填 | |
| categoryId | FK? | 可选 | |
| createdAt / updatedAt | DateTime | | |

**公开可见（读者）**：

```text
published === true
AND (scheduledAt == null OR scheduledAt <= now)
AND slug 非空
```

**作者列表派生状态**：

| 状态 | 条件 |
|------|------|
| 草稿 | `published === false` |
| 预约中 | `published === true` AND `scheduledAt > now` |
| 已发布 | `published === true` AND (`scheduledAt` 空或 `<= now`) |

---

## 状态转换

```text
（空）──保存草稿──▶ 草稿
草稿 ──立即发布──▶ 已发布
草稿 ──预约未来时间──▶ 预约中
预约中 ──时间到达（查询可见）──▶ 已发布（逻辑上）
预约中 ──取消/改草稿──▶ 草稿
已发布 ──撤回（确认）──▶ 草稿
已发布 / 草稿 / 预约中 ──删除（确认）──▶ （记录删除）
已发布 ──编辑保存──▶ 已发布（内容更新；slug 默认锁定）
```

**校验规则**:
- 发布（立即）：title、content、slug 非空
- 预约：title、content、slug 非空；`scheduledAt > now`（否则按立即发布或拒绝并提示，实现须固定一种并文档化；**建议**：`scheduledAt <= now` 视为立即发布）
- slug 唯一；冲突 409
- 已对公众可见后改 slug：须显式确认；默认 UI 锁定
- 撤回：`published=false`，清空 `scheduledAt`（及按需清空 `publishedAt`）
- 删除：硬删除 Post（级联 PostTag）；公开立即 404

---

## Tag / Category

- **Tag**: 按名称维护；写入时 upsert slug（可由名称生成）
- **Category**: 可选关联；无 UI 亦可空

---

## 与 001/002 关系

- 001 公开阅读继续免登录；可见性规则收紧为「含预约条件」
- 002 登录后才能访问作者列表/编辑 API
- 导入脚本写入的 Post 默认可保持 `scheduledAt=null`（与今日行为一致）
