/* global __ENV */
/**
 * 短冒烟：低并发确认站点可达（部署后快速自检）
 *
 *   k6 run -e SITE_URL=http://121.40.40.46:3000 -e API_URL=http://121.40.40.46:4000/api/v1 scripts/loadtest/smoke.js
 */
import http from 'k6/http';
import { check } from 'k6';

const siteUrl = (__ENV.SITE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const apiUrl = (__ENV.API_URL || 'http://127.0.0.1:4000/api/v1').replace(/\/$/, '');

export const options = {
  vus: 3,
  duration: '15s',
  thresholds: {
    http_req_failed: ['rate<0.1'],
    http_req_duration: ['p(95)<2000'],
  },
};

export default function () {
  const home = http.get(`${siteUrl}/`);
  check(home, { 'home 200': (r) => r.status === 200 });

  const posts = http.get(`${apiUrl}/posts?all=true`, {
    headers: { accept: 'application/json' },
  });
  check(posts, { 'posts 200': (r) => r.status === 200 });
}
