# k6 压测说明

## 安装

- 官网：https://grafana.com/docs/k6/latest/set-up/install-k6/
- Windows：`winget install Grafana.k6` 或 [下载安装包](https://github.com/grafana/k6/releases)

验证：

```bash
k6 version
```

## 脚本

| 文件 | 用途 |
|------|------|
| `smoke.js` | 低并发冒烟，确认首页 + 列表 API 可用 |
| `read-path.js` | 读路径压测（首页 / 列表 / health，可选详情） |

## 对本机

```bash
# 先启动本地前后端与数据库

k6 run -e SITE_URL=http://127.0.0.1:3000 -e API_URL=http://127.0.0.1:4000/api/v1 scripts/loadtest/smoke.js

k6 run -e SITE_URL=http://127.0.0.1:3000 -e API_URL=http://127.0.0.1:4000/api/v1 scripts/loadtest/read-path.js
```

## 对生产（请控制力度）

服务器为 2C2G，且后端约 **120 次/分钟/IP** 限流，高并发会出现 `429`（脚本已视为可接受）。

```bash
# 冒烟
k6 run -e SITE_URL=http://121.40.40.46:3000 -e API_URL=http://121.40.40.46:4000/api/v1 scripts/loadtest/smoke.js

# 读路径压测（约 2 分钟，峰值 10 VU）
k6 run -e SITE_URL=http://121.40.40.46:3000 -e API_URL=http://121.40.40.46:4000/api/v1 scripts/loadtest/read-path.js

# 带文章详情（把 slug 换成真实已发布文章）
k6 run -e SITE_URL=http://121.40.40.46:3000 -e API_URL=http://121.40.40.46:4000/api/v1 -e POST_SLUG=your-slug scripts/loadtest/read-path.js
```

压测时在服务器另开终端观察：

```bash
docker stats
sudo docker compose logs -f --tail=30 backend
```

## 看结果

关注 k6 摘要里的：

- `http_req_failed`：失败率  
- `http_req_duration`：尤其 **p(95)**  
- `checks`：断言通过率  
- 自定义指标 `throttle_429`：被限流比例  

若几乎全是 429，说明先撞上限流，不是机器一定撑不住；要测应用极限需在**独立测试环境**临时调高/关闭 Throttler，勿长期在生产关闭。
