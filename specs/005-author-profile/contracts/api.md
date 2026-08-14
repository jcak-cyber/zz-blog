# API Contracts: 个人中心资料（005）

**Base URL**: `/api/v1`  
**格式**: JSON  
**认证**: Cookie JWT；浏览器 `credentials: include`  
**错误体**: `{ "statusCode", "message", "error" }`（简体中文 message）

本文件在 004 之上增量约定。

---

## 用户资料投影

```json
{
  "id": "clx...",
  "username": "alice",
  "nickname": "阿丽",
  "role": "AUTHOR",
  "avatarUrl": "/uploads/….webp",
  "bio": "写给慢慢读的人。"
}
```

- `avatarUrl` / `bio` 未设置时可为 `null` 或省略（实现二选一并在前后端统一；推荐显式 `null`）。
- `nickname` **始终**为非空字符串。

---

## 认证 / 资料

### GET `/auth/me`

- **Auth**: Auth  
- **200**: 上述用户资料投影（相对 004：新增 `nickname`、`avatarUrl`、`bio`）

### PATCH `/auth/profile`

- **Auth**: Auth（AUTHOR | ADMIN，与现网作者会话一致）  
- **Throttle**: 建议按用户限流（如 30/min）  
- **Body**（字段均可选，至少一项）：
  ```json
  {
    "nickname": "阿丽",
    "avatarUrl": "/uploads/….webp",
    "bio": "写给慢慢读的人。"
  }
  ```
  - 删除头像：`"avatarUrl": null`  
  - 清空简介：`"bio": null` 或 `""`（服务端归一为 null）  
  - **禁止**通过本接口修改 `username` / `password` / `role`  
- **200**: 更新后的完整用户资料投影  
- **400**: 昵称为空/超长/非法字符；简介超 500；`avatarUrl` 非法  
- **401**: 未登录  
- **429**: 限流  

### POST `/auth/register` / POST `/auth/login`（增量）

- 成功响应中的 `user` MUST 含 `nickname`（注册时 = username），`avatarUrl`/`bio` 初始为 `null`。

---

## 上传（复用，行为不变）

### POST `/uploads`

- **Auth**: Auth  
- **multipart** 字段名 `file`  
- **200**: `{ "id", "url" }`  
- 个人中心调用前 MUST 在客户端校验类型（JPEG/PNG/WebP）与大小（≤ 2 MiB）；服务端既有上限可仍为通用 12 MiB。

### DELETE `/uploads`

- **Auth**: Auth  
- **Body**: `{ "url": "/uploads/..." }`  
- **204**: 删除本地文件（不存在可忽略）  
- 更换/删除头像后客户端或服务端可调用以清理旧文件（推荐：profile 服务在更新成功后尽力删除旧 url）。

---

## 公开文章（增量）

### GET `/posts`、`GET /posts?all=true`、`GET /posts/:slug`

- **Auth**: Public  
- **author** 对象相对 004：
  ```json
  "author": {
    "id": "clx...",
    "username": "alice",
    "nickname": "阿丽"
  }
  ```
- 前端作者展示名使用 `nickname`。

---

## 错误文案（示例）

| 场景 | message 示例 |
|------|----------------|
| 昵称为空 | 昵称不能为空 |
| 昵称过长 | 昵称长度为 2–32 个字符 |
| 简介过长 | 简介最多 500 字 |
| 头像类型 | 请上传 JPEG、PNG 或 WebP 图片 |
| 头像过大 | 头像不能超过 2MB |
| 未登录 | 未登录 或既有 401 文案 |
