# Quickstart: 作者撰写文章（003 验收）

**目的**: 验证撰写、草稿、预约、撤回、删除与公开可见性。  
**前置**: 001 可读站可用；002 可登录；Postgres + 前后端已启动。

---

## 1. 准备

```bash
docker compose up -d postgres
cd apps/backEnd && pnpm prisma:migrate && pnpm prisma:seed && pnpm start:dev
# 另开终端
cd apps/frontEnd && pnpm dev
```

登录：http://localhost:3000/login（默认 seed 账号，见 README）。

---

## 2. 验收剧本

| # | 操作 | 预期 |
|---|------|------|
| 1 | 登录后打开 `/author/posts`，点新建 | 进入墨色风格三栏撰写页（非浅色后台皮） |
| 2 | 填标题与正文，保存草稿 | 提示已保存；未登录首页**看不到**该文 |
| 3 | 「我的文章」打开该草稿继续编辑 | 内容恢复 |
| 4 | 立即发布 | 未登录首页可见；详情 URL 基于 slug |
| 5 | 新建一文，设未来 `scheduledAt` 并预约 | 到期前未登录不可见；改系统时间或等到点后可见（或调 API 把时间设为近未来再等） |
| 6 | 对已发布文撤回为草稿（确认） | 公开侧立即不可见；列表中仍为草稿可编辑 |
| 7 | 对已发布文删除（确认） | 列表与公开详情均不可用 |
| 8 | 改标题时观察 slug | 新建可自动建议且可改；已公开后默认锁定 |
| 9 | 未登录访问 `/author/posts` | 跳转登录 |
| 10 | 读者路径 | 首页/详情无登录墙 |

合同细节：[contracts/api.md](./contracts/api.md)；状态规则：[data-model.md](./data-model.md)。

---

## 3. 与导入共存（抽查）

```bash
cd apps/backEnd && pnpm import:content
```

导入文仍出现在公开列表；Web 编辑勿与导入 slug 故意冲突。

---

## 4. 完成判定

上表 1–10 通过，即 003 主验收通过（实现任务以 `/speckit-tasks` 清单为准）。
