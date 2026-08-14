# API Contracts: 开放注册与文章表态（004）

**Base URL**: `/api/v1`  
**格式**: JSON  
**认证**: Cookie JWT；浏览器 `credentials: include`  
**错误体**: `{ "statusCode", "message", "error" }`（简体中文 message）

本文件在 002/003 之上增量约定。公开读仍免登录；作者写须 Auth 且**仅本人稿件**。

---

## 认证

### POST `/auth/register`

- **Auth**: Public  
- **Throttle**: 按 IP  
- **Body**:
  ```json
  { "username": "alice", "password": "••••••••" }
  ```
- **201**:
  ```json
  { "user": { "id": "clx...", "username": "alice", "role": "AUTHOR" } }
  ```
  **不**设置登录 Cookie。  
- **400**: 缺字段 / 用户名格式非法 / 密码短于 8  
- **409**: 用户名已占用  
- **429**: 限流  

### POST `/auth/login`

- **Auth**: Public  
- **Body**（相对 002 变更）:
  ```json
  { "username": "alice", "password": "••••••••" }
  ```
- **200**: 设置 Access + Refresh Cookie；body 含 `user: { id, username, role }`  
- **401**: 「账号或密码不正确」  
- 说明：不再接受以 email 字段登录（种子用户使用其 `username`）。

### GET `/auth/me`

- **200**: `{ "id", "username", "role" }`（相对 002：以 username 替代 email 对外字段）

`refresh` / `logout`：语义同 002。

---

## 公开文章（增量）

### GET `/posts` / `GET /posts?all=true`

- **Auth**: Public  
- **200**: `items[]` 每项在既有 Summary 上增加：
  ```json
  "author": { "id": "clx...", "username": "alice" }
  ```

### GET `/posts/:slug`

- **Auth**: Public  
- **200**: Detail 同样含 `author`；并建议附带表态摘要（可选同响应或分接口）：
  ```json
  "reactions": {
    "likeCount": 12,
    "dislikeCount": 3,
    "myReaction": null
  }
  ```
  - 未登录：`myReaction` 恒为 `null`  
  - 已登录：`LIKE` | `DISLIKE` | `null`

若实现选择分接口，则详情可不嵌套 `reactions`，但前端须在同页调用下方 GET。

---

## 表态

### GET `/posts/:slug/reactions`

- **Auth**: Public（有 Cookie 则解析 myReaction）  
- **200**:
  ```json
  { "likeCount": 12, "dislikeCount": 3, "myReaction": "LIKE" }
  ```
- **404**: 文章不存在或未公开可见  

### PUT `/posts/:slug/reactions`

- **Auth**: Auth（AUTHOR | ADMIN）  
- **Body**:
  ```json
  { "value": "LIKE" }
  ```
  或 `{ "value": "DISLIKE" }`  
- **200**: 最新 `{ likeCount, dislikeCount, myReaction }`  
- **401**: 未登录  
- **404**: 文章不可见  
- **429**: 限流  

行为：无行则创建；有行则更新 `value`（实现赞↔踩切换）。

### DELETE `/posts/:slug/reactions`

- **Auth**: Auth  
- **204** 或 **200**（返回计数且 `myReaction: null`）  
- **401** / **404** 同上  

行为：删除当前用户对该文的表态行；幂等（无行也成功）。

---

## 作者写（归属强化）

下列相对 003 **追加强制规则**（路径不变）：

| 方法 | 路径 | 追加规则 |
|------|------|----------|
| GET | `/author/posts` | 仅 `authorId = 当前用户` |
| POST | `/author/posts` | `authorId` 固定为当前用户；slug 冲突 409 |
| GET/PATCH/DELETE | `/author/posts/:id` | 非本人 → **404** |
| 上传等 | 若关联作者 | 归属当前用户 |

---

## 前端页面合同

| 路径 | 访问 | 行为 |
|------|------|------|
| `/register` | Public | 用户名+密码（≥8）+确认密码（建议）；成功 → `/login` 并提示去登录；可预填 username |
| `/login` | Public | 用户名+密码；链到注册；成功 → 作者入口或 `next` |
| `/`、列表 | Public | 展示作者用户名；无登录墙 |
| `/posts/[slug]` | Public | 正文下、页脚前：赞/踩+计数；未登录点击 → 引导登录/注册；展示作者用户名 |
| `/author/**` | Auth | 仅本人稿件 |

---

## 明确不在 004 合同

- OAuth、邮箱验证、找回密码  
- 评论、关注、转发、打赏  
- 匿名表态  
- 管理他人文章  
