# Data Model: 作者登录（002）

**Feature**: `002-author-login` | **Date**: 2026-07-30  
**存储**: PostgreSQL + Prisma（沿用既有模型）+ JWT Cookie（无状态会话）

---

## 实体关系（本功能范围）

```text
User（既有）──签发──▶ Login Session（JWT Cookie，非表）
                 │
                 └──访问──▶ Author Entry（前端受保护页，非表）
```

本功能 **不** 新增 Prisma model；**不** 引入 Comment/注册相关变更。

---

## User（作者账号）— 既有，本功能用法

| 字段 | 类型 | 约束 | 本功能用法 |
|------|------|------|------------|
| id | String (cuid) | PK | JWT `sub` |
| email | String | 唯一、必填 | 登录标识（UI 称「账号」） |
| passwordHash | String | 必填 | bcrypt 校验；永不回传客户端 |
| role | Role | `ADMIN` \| `AUTHOR` \| `USER` | 允许登录作者入口：`ADMIN` 或 `AUTHOR` |
| createdAt / updatedAt | DateTime | 必填 | 展示可选 |

**校验规则**:
- 登录请求：email 非空且格式合法；password 非空
- 密码比对失败与「用户不存在」对外同一错误文案
- `role === USER`（若存在）**不得**进入作者入口（本站 seed 为 ADMIN，预留边界）

**预置数据**: `prisma/seed.ts` 已 upsert 作者（默认 `author@zz.blog` / `ChangeMe123!`，可用环境变量覆盖）。本功能依赖该账号存在，**不**提供注册 API。

---

## Login Session（登录会话）— 逻辑实体

非数据库表；由两枚 Cookie 表达：

| 概念 | 载体 | 声明（建议） | 寿命 |
|------|------|--------------|------|
| Access Session | HttpOnly Cookie（如 `access_token`） | `sub`, `role`, `email`（可选）, `type=access` | 15 分钟 |
| Refresh Session | HttpOnly Cookie（如 `refresh_token`） | `sub`, `type=refresh` | 7 天 |

**状态转换**:

```text
未登录 ──login 成功──▶ 已登录（写入 Access + Refresh Cookie）
已登录 ──refresh──▶ 已登录（轮转 Access；策略允许时轮转 Refresh）
已登录 ──logout──▶ 未登录（清除 Cookie）
已登录 ──Access 过期且 Refresh 有效──▶ 可静默刷新后仍已登录
已登录 ──二者皆失效──▶ 未登录（访问 /author 须重登）
```

**校验规则**:
- 受保护 API / 作者页：有效 Access（或经 Refresh 换发后的 Access）且 role ∈ {ADMIN, AUTHOR}
- 登出后携带旧 Cookie 访问受保护资源 → 401 / 前端重定向登录

---

## Author Entry（作者入口）— 产品实体

非持久化实体；前端路由 `/author` 的展示约定：

| 属性 | 说明 |
|------|------|
| 身份展示 | 至少显示当前邮箱或「已登录作者」 |
| 操作 | 登出 |
| 范围外 | 发文编辑器、评论管理、用户管理 |

---

## 与 001 模型关系

- `Post.authorId` 等关系不变。
- 001 中「规格外」的 Auth 合同，由本功能升级为**规格内必交付**（见 `contracts/api.md`）。
- Comment / 读者 USER 注册仍不在本功能范围。
