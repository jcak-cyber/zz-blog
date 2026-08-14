# Data Model: 个人中心资料（005）

**Feature**: `005-author-profile` | **Date**: 2026-08-14  
**存储**: PostgreSQL + Prisma；头像文件 = 本地 `uploads/`；会话 = JWT Cookie（002/004）

---

## 实体关系

```text
User ──(可选)avatarUrl──▶ /uploads/{file}（文件系统，非 FK）
  │
  └──1:N──▶ Post（公开投影使用 User.nickname）
```

---

## User（扩展）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String (cuid) | PK | JWT `sub` |
| username | String | 唯一、必填 | **登录标识**；本功能不可改 |
| nickname | String | **必填**、非唯一 | 展示名；默认 = username；禁止空 |
| avatarUrl | String? | 可空 | 相对路径如 `/uploads/...`；null = 无头像 |
| bio | String? | 可空；长度 ≤ 500 | 个人简介；空/null 均表示未填写 |
| email / passwordHash / role / … | （既有） | | 本功能不改语义 |

**校验规则**:
- `nickname`：trim 后非空；长度 2–32；允许中文、字母、数字、下划线、连字符（与用户名展示习惯对齐，可略宽但仍须拒绝纯空白）
- `bio`：可选；trim 后空则存 null；长度 ≤ **500**
- `avatarUrl`：null 或本站 `/uploads/` 路径；禁止任意外链（第一版，降低 SSRF/混用风险）；写入前可再校验文件存在（可选）

**迁移**:
1. 增加列：`nickname`（先可空）→ 回填 `nickname = username` → 改 NOT NULL  
2. 增加可空 `avatarUrl`、`bio`  
3. seed：显式写 `nickname`（与 username 相同或可读展示名）

**注册路径**:
- `POST /auth/register` 创建用户时 MUST 同时写入 `nickname = username`

---

## 头像资源（非独立表）

| 概念 | 说明 |
|------|------|
| 当前头像 | `User.avatarUrl` 指向的一张图 |
| 上传 | `POST /uploads` → 得 url → `PATCH /auth/profile` |
| 更换 | 上传新文件 → PATCH 新 url → 尽力删除旧 uploads 文件 |
| 删除 | PATCH `avatarUrl: null` → 尽力删除旧文件 |

无独立 `Avatar` 实体；`Upload` 表若现网有记录可沿用或不强制关联（与封面图一致即可）。

---

## 公开投影变更

`Post` 公开 Summary / Detail 的 `author`：

| 字段 | 说明 |
|------|------|
| id | 作者 id |
| username | 登录名（可下发） |
| nickname | **UI 展示用**（必有） |

---

## 状态与生命周期

```text
昵称:  (注册/迁移) = username ──修改──▶ 新合法昵称
                 └──清空──▶ 拒绝（保持原值）

头像:  无 ──上传──▶ 有 ──更换──▶ 有(新)
              └──删除──▶ 无

简介:  空 ──显式保存非空──▶ 有 ──显式保存空──▶ 空
```
