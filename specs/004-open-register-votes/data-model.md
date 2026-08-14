# Data Model: 开放注册与文章表态（004）

**Feature**: `004-open-register-votes` | **Date**: 2026-08-14  
**存储**: PostgreSQL + Prisma；会话仍为 JWT Cookie（002）

---

## 实体关系

```text
User ──1:N──▶ Post
  │              │
  │              └──1:N──▶ PostReaction ◀──N:1── User
  │
  └──签发──▶ Login Session（JWT Cookie，非表）
```

---

## User（扩展）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String (cuid) | PK | JWT `sub` |
| username | String | **唯一、必填** | 登录与展示用；全站唯一 |
| email | String | 唯一、必填 | 兼容列；新注册可为合成占位，**不作登录输入** |
| passwordHash | String | 必填 | bcrypt；不回传 |
| role | Role | 默认 `AUTHOR` | 注册发放 `AUTHOR`；种子可 `ADMIN` |
| createdAt / updatedAt | DateTime | 必填 | |

**校验规则**:
- 用户名：非空；建议 `[a-zA-Z0-9_\u4e00-\u9fa5-]{2,32}`（实现可收紧为 ASCII；须在界面说明）
- 密码：长度 ≥ **8**；第一版无复杂度其它规则
- 注册：用户名冲突 → 占用提示；不创建会话

**迁移**:
- 既有用户：回填 `username`（可由 email 本地部分生成；冲突则加后缀）
- seed：为种子作者设置明确 `username`（如 `author`）

---

## Post（用法变更，无强制新列）

| 既有关键字段 | 本功能约束 |
|--------------|------------|
| slug | 继续 **全站唯一** |
| authorId | 创建/更新必须等于当前登录用户 id |
| published / publishedAt / scheduledAt | 可见性规则同 003 |

公开投影新增：

| 字段 | 说明 |
|------|------|
| author.username | 必填展示 |
| author.id | 可选 |

---

## PostReaction（新建）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String (cuid) | PK | |
| postId | String | FK → Post，onDelete Cascade | |
| userId | String | FK → User，onDelete Cascade | |
| value | enum `LIKE` \| `DISLIKE` | 必填 | |
| createdAt / updatedAt | DateTime | 必填 | 改选时更新 |

**唯一**: `@@unique([postId, userId])` — 保证一人一文一种表态。

**状态转换**:

```text
无表态 ──设赞──▶ LIKE
无表态 ──设踩──▶ DISLIKE
LIKE ──再点赞──▶ 无表态（删除行）
DISLIKE ──再点踩──▶ 无表态
LIKE ──点踩──▶ DISLIKE（更新 value）
DISLIKE ──点赞──▶ LIKE
```

**聚合**:
- `likeCount` = 行数 where value=LIKE
- `dislikeCount` = 行数 where value=DISLIKE
- `myReaction` = 当前用户该文的 value 或 `null`（未登录恒为 null）

**规则**:
- 仅对**公开可见**文章允许写表态；草稿/未到期预约 → 404
- 未登录写 → 401
- 可对自己的文章表态

---

## Login Session

沿用 002：Access + Refresh HttpOnly Cookie。JWT claims 建议含 `sub`, `role`, `username`（替代或并列原 email 展示字段）。

---

## 明确不在本模型

- 邮箱验证状态、OAuth 绑定
- 评论、关注、通知
- 文章级冗余 likeCount 列（第一版用聚合查询）
