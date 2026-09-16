# API Contracts: 文章评论侧栏（006）

**Base URL**: `/api/v1`  
**格式**: JSON  
**认证**: Cookie JWT；浏览器 `credentials: include`  
**错误体**: `{ "statusCode", "message", "error" }`（简体中文 message）

本文件在既有 posts / reactions / auth 之上增量约定。

---

## 评论作者投影

```json
{
  "id": "clx...",
  "username": "alice",
  "nickname": "阿丽",
  "avatarUrl": "/uploads/….webp"
}
```

- `avatarUrl` 可为 `null`。
- `nickname` 若缺失，客户端可用 `username` 展示。

---

## 评论条目投影

```json
{
  "id": "clx...",
  "content": "写得真好",
  "createdAt": "2026-08-19T00:00:00.000Z",
  "author": { "id": "...", "username": "ha_lydns", "nickname": "ha_lydns", "avatarUrl": null },
  "likeCount": 0,
  "likedByMe": false,
  "canDelete": false
}
```

---

## GET `/posts/:slug/comments`

- **Auth**: 可选（有 Cookie 则填充 `likedByMe` / `canDelete`）  
- **Query**: `page`（默认 1）、`pageSize`（默认 20，最大 50）  
- **200**:
  ```json
  {
    "items": [ "/* 评论条目投影 */" ],
    "page": 1,
    "pageSize": 20,
    "total": 12
  }
  ```
  - 排序：`createdAt DESC`（较新在前）  
  - 仅 `parentId IS NULL`  
  - 文章须公开可见，否则 **404**「未找到文章」  
- **404**: 文章不存在或未公开  

---

## GET `/posts/:slug/comments/count`

- **Auth**: 无  
- **200**: `{ "count": 12 }`  
- **404**: 文章不存在或未公开  

> 若公开文章详情已内嵌 `commentCount`，本接口可作前端刷新对齐用；实现可二选一合并，但合同保留 count 语义。

---

## POST `/posts/:slug/comments`

- **Auth**: 必填（AUTHOR | ADMIN，与现网登录角色一致）  
- **Body**:
  ```json
  { "content": "说说你的看法" }
  ```
- **201/200**: 新建后的评论条目投影（含 `likeCount: 0`、`likedByMe: false`、`canDelete: true`）  
- **400**: 空内容 / 超 1000 字符  
- **401**: 未登录  
- **404**: 文章不存在或未公开  
- **429**: 同用户同文约 30 秒内重复发表（文案如「请稍后再试」）  

---

## DELETE `/posts/:slug/comments/:id`

- **Auth**: 必填  
- **204**: 硬删除成功  
- **401**: 未登录  
- **403**: 无删除权限  
- **404**: 评论不存在或不属于该文 / 文章不可见  

---

## PUT `/posts/:slug/comments/:id/like`

- **Auth**: 必填  
- **200**:
  ```json
  { "likeCount": 3, "likedByMe": true }
  ```
  - 若已赞则保持赞（幂等）或实现为「确保已赞」；推荐：未赞则插入，已赞保持。  
- **401 / 403 / 404**: 同惯例  

## DELETE `/posts/:slug/comments/:id/like`

- **Auth**: 必填  
- **200**: `{ "likeCount": 2, "likedByMe": false }`  
- 取消点赞；无赞时幂等返回未赞态。  

> 前端「再点取消」：已赞则 `DELETE`，未赞则 `PUT`。

---

## 公开文章详情增量（可选但推荐）

### GET `/posts/:slug`（既有）

响应增加：

```json
{ "commentCount": 12 }
```

- 非负整数；无评论为 `0`。  
- 便于详情页入口展示，无需额外请求。

---

## 错误与限流

| 场景 | 状态码 | message 示例 |
|------|--------|--------------|
| 未登录写操作 | 401 | 请先登录 |
| 无删除权 | 403 | 无权删除该评论 |
| 空评论 | 400 | 评论不能为空 |
| 超长 | 400 | 评论不能超过 1000 个字符 |
| 发表过频 | 429 | 请稍后再试 |
| 文章/评论不存在 | 404 | 未找到文章 / 未找到评论 |

全局 Throttler 仍可返回 429；业务 30 秒限频优先用明确文案区分。
