# Data Model: 文章评论侧栏（006）

**Feature**: `006-post-comments` | **Date**: 2026-09-16  
**存储**: PostgreSQL + Prisma；会话为 JWT Cookie（002）

---

## 实体关系

```text
User ──1:N──▶ Post
  │              │
  │              └──1:N──▶ Comment ◀──N:1── User（评论作者）
  │                           │
  │                           └──1:N──▶ CommentReaction ◀──N:1── User
  │
  └──（ADMIN / 文作者）可删除该文下 Comment
```

---

## Comment（既有，用法约定）

| 字段 | 类型 | 约束 | 本功能约定 |
|------|------|------|------------|
| id | String (cuid) | PK | |
| content | String | 必填 | trim 后 1～1000 个 Unicode 码点 |
| postId | String | FK → Post，onDelete Cascade | 仅已发布可见文章可公开读写 |
| authorId | String | FK → User | 发表者 |
| parentId | String? | FK → Comment | **首版恒为 null** |
| createdAt | DateTime | | 列表按此 **DESC** |
| updatedAt | DateTime | | 首版不暴露编辑 |

**索引**: 保留/补充 `@@index([postId, createdAt])` 以支持按文倒序列表与 count。

**校验**:
- 空/纯空白 → 拒绝
- 长度 &gt; 1000 → 拒绝
- 同用户同 `postId`：若最近一条 `createdAt` 距今 &lt; 30s → 拒绝（过频）

**删除**: 物理删除；点赞行 Cascade。

**权限（删除）**:
- 评论作者；或
- 该 `Post.authorId`；或
- `User.role === ADMIN`

---

## CommentReaction（新建）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String (cuid) | PK | |
| commentId | String | FK → Comment，onDelete Cascade | |
| userId | String | FK → User，onDelete Cascade | |
| createdAt | DateTime | | |

**唯一**: `@@unique([commentId, userId])`

**状态**:
```text
无赞 ──点赞──▶ 有赞（插入行）
有赞 ──再点──▶ 无赞（删除行）
```

**投影**: `likeCount = COUNT(*)`；`likedByMe` 由当前用户是否存在行决定。

---

## 文章侧投影增量

| 字段 | 说明 |
|------|------|
| commentCount | 该文评论条数（公开详情可读） |

不在 Post 表强制缓存列；查询时 `count` 即可（个人站规模）。

---

## 公开评论列表项投影

| 字段 | 说明 |
|------|------|
| id | |
| content | |
| createdAt | |
| author.id / username / nickname / avatarUrl | 缺昵称回退 username；无头像 null |
| likeCount | ≥ 0 |
| likedByMe | boolean；未登录恒 false |
| canDelete | boolean；按当前用户权限计算 |

---

## 状态与生命周期

```text
[发表] → 可见评论
[点赞/取消] → 仅 CommentReaction 变化
[硬删除] → 评论与点赞消失，commentCount - 1
```

无「待审」「隐藏」状态。
