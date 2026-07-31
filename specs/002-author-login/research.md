# Research: 作者登录（002）

**Feature**: `002-author-login` | **Date**: 2026-07-30

---

## R-001 会话载体：JWT Cookie vs 服务端 Session

**Decision**: 使用 **JWT Access + Refresh**，经 **HttpOnly、Secure（生产）、SameSite=Lax** Cookie 下发；不引入 Redis / Session 表。

**Rationale**:
- 与 `001` 合同预留及 research R-003 一致，现规格已批准作者登录 UI。
- 个人站无水平扩展压力，无状态 JWT 足够。
- Cookie + HttpOnly 降低前端脚本直接读令牌的风险；前后端已 `credentials: true`。

**Alternatives considered**:
- 仅 Access Token 放 localStorage：实现简单，但 XSS 风险更高，拒绝。
- 服务端 Session + Redis：与宪章「不引入 Redis」及简洁优先冲突。
- 单一长期 Cookie 无 Refresh：实现更少，但无法短寿 Access 轮转；个人站可接受，但为对齐 001 合同仍采用双 Cookie。

---

## R-002 登录标识：邮箱 vs 用户名

**Decision**: 后端与数据库继续以 **email** 为唯一登录标识（既有 `User.email` + seed）；前端文案可用「账号」，占位提示填写邮箱。

**Rationale**: 已有 schema/seed（`author@zz.blog`），避免迁移与双标识；规格「账号」按产品文案理解即可。

**Alternatives considered**:
- 新增 username 字段：增加迁移与校验，对单作者站无收益。
- 仅环境变量硬编码管理员密码、无 User 表：与既有 Post.author 关系及 seed 冲突。

---

## R-003 Token 有效期

**Decision**:
- Access：`15m`（短寿）
- Refresh：`7d`（规格「数小时至数天」区间内的常见个人站惯例）
- 登出：清除两枚 Cookie；可选将 Refresh 视为作废（无服务端黑名单则依赖清除 Cookie + 短 Access）

**Rationale**: 平衡「刷新仍登录」与「失窃窗口」；数值可用环境变量覆盖。

**Alternatives considered**:
- Access 7d 无 Refresh：更简单，但长寿 Access 风险更大。
- Refresh 30d：对个人站偏长，非必须。

---

## R-004 前端路由与保护方式

**Decision**:
- 公开：`/login`（已登录访问则重定向至 `/author`）
- 受保护：`/author`（未登录重定向 `/login`）
- 保护手段：Next.js Middleware 或页面 Server Component 调用 `GET /auth/me`（带 Cookie）判定；阅读路径 `/`、`/posts/*` **不做**鉴权

**Rationale**: 满足 FR-005/FR-006；不污染沉浸阅读。

**Alternatives considered**:
- 仅客户端检查：首屏闪烁未登录内容，体验差。
- 全站 Middleware 默认鉴权再放行公开路由：易误伤阅读路径，拒绝作为默认。

---

## R-005 登录入口在 UI 中的位置

**Decision**: 页脚或页头提供**低调**「作者」文字链至 `/login`；不进 Hero、不弹窗、不挡首屏。

**Rationale**: 规格要求入口不得喧宾夺主。

**Alternatives considered**:
- 仅靠记忆 URL、无导航入口：可验收但可发现性过差。
- 显眼「登录」按钮在 Hero：破坏阅读气质，拒绝。

---

## R-006 防暴力破解

**Decision**: 对 `POST /auth/login` 使用既有 Nest Throttler（例如每 IP 短窗限制）；失败统一文案「账号或密码不正确」。

**Rationale**: 规格 Edge Case 允许；实现成本低。

**Alternatives considered**:
- 验证码：过重，单作者站第一版不做。
- 账号锁定：需额外状态字段，延后。

---

## R-007 与 Markdown 导入令牌的关系

**Decision**: `IMPORT_TOKEN` / `x-import-token` 继续用于内容导入脚本；**登录 Cookie 不替代**导入令牌，本功能也不要求把导入改为「必须先 Web 登录」。

**Rationale**: 保持 001 作者工作流轻量；避免把 CI 绑死浏览器会话。

**Alternatives considered**:
- 导入也改 JWT：增加自动化复杂度，非 002 范围。

---

## R-008 依赖增量

**Decision**: 后端新增 JWT 相关依赖（如 `@nestjs/jwt`、cookie-parser 若需要）；前端尽量用 `fetch` + `credentials: 'include'`，不强制上大型认证 SDK。

**Rationale**: 当前 `backEnd/package.json` 尚无 JWT 包，属实现必需；前端已有 zod，可选用做表单校验。

**Alternatives considered**:
- NextAuth / Auth.js：概念更重，与自建 Nest API Cookie 方案叠床架屋，个人站拒绝作为默认。
