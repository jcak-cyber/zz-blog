# zz-blog

极简、高性能的个人博客（前后端分离）。

## 目录

- `apps/frontEnd`：Next.js（App Router）+ Tailwind + shadcn/ui（墨色主题）
- `apps/backEnd`：NestJS + Prisma + PostgreSQL
- `content/posts`：Markdown 文章源
- `docs/ui`：页面设计稿

## 本地启动

### 1. 安装依赖

```bash
pnpm install
```

### 2. 启动数据库

```bash
docker compose up -d postgres
```

### 3. 配置环境变量

```bash
cp apps/backEnd/.env.example apps/backEnd/.env
cp apps/frontEnd/.env.example apps/frontEnd/.env.local
```

### 4. 迁移与种子

```bash
cd apps/backEnd
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
```

### 5. 启动服务

```bash
# 终端 1
pnpm run dev:back

# 终端 2
pnpm run dev:front
```

- 前端：http://localhost:3000
- 后端 API：http://localhost:4000/api/v1/health
- Swagger：http://localhost:4000/docs

### 6. 导入示例文章

```bash
cd apps/backEnd
pnpm import:content
```

## 作者登录（002）

- 登录页：http://localhost:3000/login
- 作者入口页：http://localhost:3000/author（需登录）
- 默认 seed 账号：`author@zz.blog` / `ChangeMe123!`（可用 `SEED_AUTHOR_EMAIL` / `SEED_AUTHOR_PASSWORD` 覆盖）
- 后端需配置 `JWT_ACCESS_SECRET`、`JWT_REFRESH_SECRET`（见 `apps/backEnd/.env.example`）；会话为 HttpOnly Cookie（Access 15m / Refresh 7d）
- 读者浏览列表与详情**无需**登录；首页右上角「作者入口」进入登录页（登录/作者页会隐藏该按钮）

验收剧本见 `specs/002-author-login/quickstart.md`。

## 作者撰写（003）

- 我的文章：http://localhost:3000/author/posts
- 写新文章：http://localhost:3000/author/posts/new
- 支持：**草稿**、**立即发布**、**预约发布**、**撤回为草稿**、删除（需确认）
- 预约未到期的文章不会出现在公开首页/详情；到期后按查询惰性可见（无需定时任务）
- 已公开文章默认锁定 slug；勾选确认后可改
- 封面可上传（`POST /uploads`，JWT）或填 URL；可与 `pnpm import:content` 并存（slug 冲突会提示）

验收剧本见 `specs/003-author-write-post/quickstart.md`。

## 作者发布流程（轻量）

1. **Web**：登录后打开「我的文章」撰写；或  
2. **Markdown 导入**：在 `content/posts/` 新建 Markdown，填写 `title` / `slug` / `published` / `date`，执行 `pnpm --filter @zz-blog/backend import:content`
3. 刷新站点首页查看

## Docker 一键（可选）

```bash
docker compose up --build
```

## CI/CD（GitHub Actions）

仓库已配置：

| Workflow | 触发 | 作用 |
|----------|------|------|
| `.github/workflows/ci.yml` | PR / push 到 `main` | 安装依赖、Lint、前后端 Build |
| `.github/workflows/cd.yml` | push 到 `main`、打 `v*` 标签、或手动 | 构建并推送镜像到 GHCR |

镜像地址（小写 owner）：

- `ghcr.io/<owner>/zz-blog-backend:latest`
- `ghcr.io/<owner>/zz-blog-frontend:latest`

可选仓库变量（Settings → Secrets and variables → Actions → Variables）：

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_SITE_URL`

服务器拉取部署示例见 `docker-compose.prod.yml`：

```bash
# 登录 GHCR（用有 read:packages 的 PAT）
echo $GHCR_TOKEN | docker login ghcr.io -u <github-user> --password-stdin

export POSTGRES_PASSWORD=...
export JWT_ACCESS_SECRET=...
export JWT_REFRESH_SECRET=...
export IMPORT_TOKEN=...
export GHCR_OWNER=jcak-cyber
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

首次推送后，若 GHCR 包为私有，可在 GitHub Packages 页面将包设为 Public，或继续用 PAT 拉取。

## 上线安全检查清单

本地开发用 `http://localhost` 时，浏览器 Network 里能看到登录请求中的密码字段，这是正常现象，**不要**为此在前端再做一层「自制加密」。真正要做的是通道与密钥安全：

1. **启用 HTTPS**  
   公网必须用 TLS（反向代理如 Nginx / Caddy，或云平台托管证书）。整段传输（含密码）由 HTTPS 加密。

2. **更换全部默认密钥与口令**（写入服务器环境变量，勿提交到 git）  
   - `SEED_AUTHOR_PASSWORD`：强密码，seed 后勿再使用文档里的默认值  
   - `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`：足够长的随机串  
   - `IMPORT_TOKEN`：导入接口令牌  
   - 数据库账号密码（`DATABASE_URL`）

3. **Cookie 已按环境区分**  
   生产（`NODE_ENV=production`）下登录 Cookie 会带 `Secure`；请保证站点以 HTTPS 访问，否则浏览器可能不保存 Cookie。

4. **密码存储**  
   库中只存 bcrypt 哈希（`passwordHash`），不会回传给前端。登录请求体传明文密码 + HTTPS，是业界常规做法。

5. **上线前自检**  
   - [ ] 已改 JWT / 导入令牌 / 作者密码  
   - [ ] 全站 HTTPS，HTTP 跳转 HTTPS  
   - [ ] `.env` 不在仓库中  
   - [ ] 能登录、能登出、未登录仍可阅读文章  

## 说明

- 001 阅读路径无登录墙；评论 UI、标签筛选仍未交付
- 003 作者可 Web 撰写（草稿 / 发布 / 预约 / 撤回）
- 设计稿放在 `docs/ui/`
