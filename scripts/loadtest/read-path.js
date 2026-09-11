/* global __ENV */
/**
 * zz-blog 读路径压测（k6）
 *
 * 安装 k6：https://grafana.com/docs/k6/latest/set-up/install-k6/
 * Windows 示例：winget install k6  或  choco install k6
 *
 * 用法：
 *   k6 run -e SITE_URL=http://121.40.40.46:3000 -e API_URL=http://121.40.40.46:4000/api/v1 scripts/loadtest/read-path.js
 *   k6 run -e SITE_URL=http://localhost:3000 -e API_URL=http://localhost:4000/api/v1 scripts/loadtest/read-path.js
 *
 * 可选：
 *   -e POST_SLUG=某篇文章slug   额外打详情 API
 *   -e VUS=10 -e DURATION=1m    覆盖默认阶段（需改脚本时更灵活；当前用 stages）
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const siteUrl = (__ENV.SITE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const apiUrl = (__ENV.API_URL || 'http://127.0.0.1:4000/api/v1').replace(/\/$/, '');
const postSlug = (__ENV.POST_SLUG || '').trim();

const throttleRate = new Rate('throttle_429');

export const options = {
  stages: [
    { duration: '20s', target: 5 },
    { duration: '40s', target: 10 },
    { duration: '30s', target: 10 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    // 允许少量失败（含限流）；真正打挂时再收紧
    http_req_failed: ['rate<0.15'],
    http_req_duration: ['p(95)<1500'],
  },
};

export default function () {
  const home = http.get(`${siteUrl}/`, {
    tags: { name: 'home' },
  });
  check(home, {
    'home status ok': (r) => r.status === 200 || r.status === 304,
  });
  throttleRate.add(home.status === 429);

  const list = http.get(`${apiUrl}/posts?all=true`, {
    tags: { name: 'posts_list' },
    headers: { accept: 'application/json' },
  });
  check(list, {
    'posts list ok or throttled': (r) => r.status === 200 || r.status === 429,
  });
  throttleRate.add(list.status === 429);

  const health = http.get(`${apiUrl}/health`, {
    tags: { name: 'health' },
    headers: { accept: 'application/json' },
  });
  check(health, {
    'health ok or throttled': (r) => r.status === 200 || r.status === 429,
  });
  throttleRate.add(health.status === 429);

  if (postSlug) {
    const detail = http.get(`${apiUrl}/posts/${encodeURIComponent(postSlug)}`, {
      tags: { name: 'post_detail' },
      headers: { accept: 'application/json' },
    });
    check(detail, {
      'post detail ok or throttled': (r) => r.status === 200 || r.status === 429,
    });
    throttleRate.add(detail.status === 429);
  }

  sleep(1);
}
