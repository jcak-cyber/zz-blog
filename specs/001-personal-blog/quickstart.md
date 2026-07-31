# Quickstart: 极简个人博客（001 验收）

**目的**: 用最短路径验证规格内端到端行为（非完整实现教程）。  
**前置**: Docker / Node 20+；已按 `plan.md` 初始化 `apps/frontEnd`、`apps/backEnd`。

---

## 1. 启动依赖

```bash
# 仓库根目录
docker compose up -d postgres
# 或一次性：
docker compose up --build
```

预期：PostgreSQL 健康；后端 `/api/v1/health` 返回 ok；前端可打开。

环境变量（示例名，以实现为准）：`DATABASE_URL`、`JWT_*`、`NEXT_PUBLIC_API_BASE_URL`、上传目录路径。

---

## 2. 数据库

```bash
cd apps/backEnd
npx prisma migrate deploy
npx prisma db seed   # 若有：管理员与示例数据
```

---

## 3. 准备至少 3 篇已发布文章

任选其一：

**A. Markdown 导入**（对齐作者工作流）  
在 `content/posts/` 放置 3 个含 `title/slug/published/date/excerpt/cover?` 的 Markdown，执行导入命令或 `POST /api/v1/posts/import`。

**B. 管理 API**  
用 Swagger 调用 `POST /api/v1/posts` 创建 3 篇 `published=true` 且含唯一 slug 的文章。

另备：1 篇 `published=false`、1 篇缺 slug——用于负向验收。

---

## 4. 规格验收剧本

| # | 操作 | 预期 |
|---|------|------|
| 1 | 打开前端首页 | 1 秒内可见列表标题等主要内容；列出全部已发布文；含封面者显示封面 |
| 2 | 点击一篇 | 进入 `/posts/{slug}`；正文可读；有封面则详情顶栏显示 |
| 3 | 禁用 JS 查看详情 | 仍可见正文要点（SSR HTML） |
| 4 | 查看浏览器标题与 meta | 含文章标题；描述反映摘要 |
| 5 | 打开 `/sitemap.xml`、`/robots.txt` | 站点地图含已发布 slug；robots 合理 |
| 6 | 访问不存在 slug | 中文「未找到」+ 回首页入口 |
| 7 | 确认草稿/无 slug 文 | 不出现在首页；详情不可作为已发布访问 |
| 8 | 改标题不改 slug 后刷新 | 原 URL 仍打开同一篇，标题已更新 |
| 9 | 空库或无已发布文时打开首页 | 中文空状态，非崩溃 |
| 10 | 详情页 | 无评论区、无登录墙、无社交强制模块（001） |

合同细节见 [contracts/api.md](./contracts/api.md)；模型见 [data-model.md](./data-model.md)。

---

## 5. 规格外（可选冒烟，不计入 001 必过）

- `POST /auth/login` Cookie 签发  
- `GET /posts/:slug/comments` 树形数据  
- 前端搜索框（FlexSearch）延迟加载  

若要将以上纳入正式验收，先修订 `spec.md`。

---

## 6. 工程化抽查

- `eslint` / `prettier` 通过  
- commit 符合 Conventional Commits（若已装 Husky）  
- Compose 再起一次仍可完成第 4 节第 1–2 步  

---

## 完成定义（对接 Success Criteria）

- SC-001～SC-006：由第 4 节剧本覆盖  
- SC-007（封面/正文图）：第 4 节含封面与 MD 图样例各至少 1 篇
