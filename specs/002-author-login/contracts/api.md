# API Contracts: 作者登录（002）

**Base URL**: `/api/v1`  
**格式**: JSON  
**文档**: Swagger 与本文件同构  
**认证**: Cookie JWT（Access / Refresh）；标注 `Public` 或 `Auth`

约定：
- 错误体：`{ "statusCode": number, "message": string | string[], "error": string }`
- 浏览器调用须 `credentials: "include"`
- Cookie 建议名：`access_token`、`refresh_token`（实现可配置，合同语义不变）
- 对外登录失败文案统一：**「账号或密码不正确」**（简体中文）

本文件为 **002 验收合同**；公开文章读写合同仍以 `specs/001-personal-blog/contracts/api.md` 为准，且 **不得** 因本功能改为需登录。

---

## POST `/auth/login`

- **Auth**: Public
- **Throttle**: 建议启用（按 IP）
- **Body**:
  ```json
  { "email": "author@zz.blog", "password": "••••••••" }
  ```
- **200**: 设置 Access + Refresh HttpOnly Cookie  
  Body（示例）:
  ```json
  {
    "user": {
      "id": "clx...",
      "email": "author@zz.blog",
      "role": "ADMIN"
    }
  }
  ```
- **400**: 缺字段 / 格式非法（校验信息简体中文）
- **401**: 凭证无效（笼统文案，不区分账号是否存在）
- **429**: 触发限流（中文说明可重试）

---

## POST `/auth/refresh`

- **Auth**: Refresh Cookie
- **200**: 轮转 Access Cookie（及策略允许时 Refresh）；可返回当前 `user` 摘要或空 body
- **401**: Refresh 缺失/无效

---

## POST `/auth/logout`

- **Auth**: Auth（有 Access）或允许仅持 Cookie 调用以便清理
- **204**: 清除 Access / Refresh Cookie  
  （若实现返回 200，须同等完成清 Cookie）

---

## GET `/auth/me`

- **Auth**: Auth（Access；过期时可先由客户端/BFF 调 refresh）
- **200**:
  ```json
  {
    "id": "clx...",
    "email": "author@zz.blog",
    "role": "ADMIN"
  }
  ```
- **401**: 未登录或令牌无效

---

## 前端页面合同（非 REST，验收用）

| 路径 | 访问规则 | 行为 |
|------|----------|------|
| `/login` | Public | 中文登录表单；成功 → `/author`；已登录访问 → 重定向 `/author` |
| `/author` | Auth | 展示已登录身份 + 登出；未登录 → `/login` |
| `/`、`/posts/[slug]` | Public | **禁止**强制登录 |

---

## 明确不在 002 合同

- `POST /auth/register` 及任何自我注册
- OAuth / 魔法链接 / 找回密码
- 管理端文章 CRUD UI（API 若已存在也不纳入本 feature 验收）
