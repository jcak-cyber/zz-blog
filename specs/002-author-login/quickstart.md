# Quickstart: 作者登录（002 验收）

**目的**: 最短路径验证作者登录 / 登出 / 读者免登录。  
**前置**: 001 已可跑通（postgres、后端、前端、至少可选的一篇已发布文章）。

---

## 1. 环境

仓库根目录确保：

- `docker compose up -d postgres`
- `apps/backEnd`：`DATABASE_URL`、新增 `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`（或等价名）、`CORS_ORIGIN=http://localhost:3000`
- `apps/frontEnd`：`NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:4000/api/v1`
- Seed 作者（默认）：`author@zz.blog` / `ChangeMe123!`（或你在 `SEED_AUTHOR_*` 中覆盖的值）

```bash
cd apps/backEnd
pnpm prisma:migrate
pnpm prisma:seed
pnpm start:dev

# 另一终端
cd apps/frontEnd
pnpm dev
```

---

## 2. 合同冒烟（可选，Swagger 或 curl）

```bash
# 登录（应 Set-Cookie）
curl -i -c cookies.txt -X POST http://127.0.0.1:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"author@zz.blog\",\"password\":\"ChangeMe123!\"}"

# 当前用户
curl -i -b cookies.txt http://127.0.0.1:4000/api/v1/auth/me

# 错误密码 → 401，笼统中文错误
curl -i -X POST http://127.0.0.1:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"author@zz.blog\",\"password\":\"wrong\"}"

# 登出
curl -i -b cookies.txt -c cookies.txt -X POST http://127.0.0.1:4000/api/v1/auth/logout
```

合同细节见 [contracts/api.md](./contracts/api.md)；数据约定见 [data-model.md](./data-model.md)。

---

## 3. 规格验收剧本

| # | 操作 | 预期 |
|---|------|------|
| 1 | 未登录打开 `http://localhost:3000/login` | 见中文账号/密码表单与提交 |
| 2 | 提交正确凭证 | 进入 `/author`，可见已登录身份 |
| 3 | 在 `/author` 刷新页面 | 仍保持已登录 |
| 4 | 提交错误密码 | 笼统失败提示；不进入 `/author` |
| 5 | 空账号或空密码提交 | 前端或接口提示需填写；不假装成功 |
| 6 | 已登录再打开 `/login` | 重定向至 `/author`（或等价已登录引导） |
| 7 | 在 `/author` 登出 | 会话结束；再访 `/author` 回到登录 |
| 8 | 未登录打开首页 `/` | 列表正常，无登录墙 |
| 9 | 未登录打开一篇 `/posts/{slug}` | 正文可读，无登录墙 |
| 10 | 阅读路径上的作者入口链 | 低调，不挡 Hero/正文 |

---

## 4. 回归 001（抽查）

| # | 操作 | 预期 |
|---|------|------|
| A | 首页列表与详情 | 与 001 一致可用 |
| B | Markdown 导入（若使用 IMPORT_TOKEN） | 仍可用，不依赖 Web 登录 Cookie |

---

## 5. 完成判定

上表 1–10 全部通过，且合同冒烟关键路径（login / me / 错误登录 / logout）行为符合 `contracts/api.md`，即本 feature 可视为验收通过（实现任务完成以 `/speckit-tasks` 清单为准）。
