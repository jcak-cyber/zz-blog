# Tasks: 作者登录

**Input**: Design documents from `/specs/002-author-login/`

**Prerequisites**: plan.md（必需）、spec.md（必需）、research.md、data-model.md、contracts/、quickstart.md

**Tests**: 规格未要求 TDD；本清单**不包含**强制自动化测试任务。验收以 `quickstart.md` 与规格场景为准。

**Organization**: 按用户故事分阶段；路径遵循宪章 `apps/frontEnd` + `apps/backEnd`。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行（不同文件、无未完成依赖）
- **[Story]**: 仅用户故事阶段使用（如 [US1]）
- 描述须含明确文件路径

## Path Conventions

- 前端：`apps/frontEnd/`
- 后端：`apps/backEnd/`
- 规格：`specs/002-author-login/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 为本功能补齐依赖与环境变量（工程已存在，无需重建 monorepo）

- [x] T001 在 `apps/backEnd/package.json` 增加 JWT/Cookie 依赖（如 `@nestjs/jwt`、`cookie-parser`、`@types/cookie-parser`），并安装
- [x] T002 [P] 更新 `apps/backEnd/.env.example`：补充 `JWT_ACCESS_SECRET`、`JWT_REFRESH_SECRET`、`JWT_ACCESS_TTL`（默认 15m）、`JWT_REFRESH_TTL`（默认 7d）、确认 `CORS_ORIGIN=http://localhost:3000`
- [x] T003 [P] 更新 `apps/frontEnd/.env.example`：确认 `NEXT_PUBLIC_API_BASE_URL`；如需可注明 Cookie 跨域依赖后端 CORS
- [x] T004 确认 `apps/backEnd/prisma/seed.ts` 可 seed 作者账号，并在 `specs/002-author-login/quickstart.md` 或根说明中保持默认邮箱/密码一致

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 所有用户故事开始前必须完成的认证基础设施

**⚠️ CRITICAL**: 未完成本阶段前不得开始 US1–US4 实现

- [x] T005 实现 Cookie 解析接入：在 `apps/backEnd/src/main.ts` 注册 `cookie-parser`，Swagger 增加 Cookie 安全方案说明
- [x] T006 实现 JWT 配置模块：`apps/backEnd/src/modules/auth/auth.constants.ts`（Cookie 名、TTL）、`apps/backEnd/src/modules/auth/auth.module.ts`（注册 JwtModule / Config）
- [x] T007 [P] 实现登录 DTO：`apps/backEnd/src/modules/auth/dto/login.dto.ts`（email + password，class-validator，中文校验文案）
- [x] T008 [P] 实现用户摘要 DTO：`apps/backEnd/src/modules/auth/dto/auth-user.dto.ts`（id、email、role）
- [x] T009 实现 AuthService 骨架：`apps/backEnd/src/modules/auth/auth.service.ts`（签发/校验 Access+Refresh、清 Cookie 辅助、按 email 查 User + bcrypt 比对接口形状）
- [x] T010 [P] 实现 JwtAuthGuard（读 Access Cookie）：`apps/backEnd/src/common/guards/jwt-auth.guard.ts`
- [x] T011 [P] 实现 `@Public()` 与 `@CurrentUser()`：`apps/backEnd/src/common/decorators/public.decorator.ts`、`current-user.decorator.ts`
- [x] T012 将 AuthModule 挂入 `apps/backEnd/src/app.module.ts`；确认全局 Throttler 可作用于后续 login 路由
- [x] T013 扩展前端 API 客户端：`apps/frontEnd/src/lib/api.ts` 支持 `credentials: 'include'` 的请求辅助（如 `apiPost` / `apiGet` 可选参数），不破坏现有 posts 调用
- [x] T014 新增前端认证类型与调用封装：`apps/frontEnd/src/lib/auth.ts`（login / logout / me / refresh 函数签名，对齐 `contracts/api.md`）

**Checkpoint**: 后端可编译启动；Guard/DTO/Service 骨架就绪；前端 `lib/auth.ts` 可被页面引用（端点可先 501/未接完，但结构齐）

---

## Phase 3: User Story 1 - 作者完成登录 (Priority: P1) 🎯 MVP

**Goal**: 作者打开登录页，用正确凭证登录后进入作者入口，刷新仍保持已登录

**Independent Test**: 使用 seed 作者凭证，仅打开 `/login` 完成一次登录并进入 `/author`，刷新仍已登录

### Implementation for User Story 1

- [x] T015 [US1] 实现 `POST /api/v1/auth/login`：`apps/backEnd/src/modules/auth/auth.controller.ts`（写 HttpOnly Cookie，返回 user；Throttle）
- [x] T016 [US1] 实现 `GET /api/v1/auth/me`：同 `auth.controller.ts`（JwtAuthGuard；返回当前用户）
- [x] T017 [US1] 实现 `POST /api/v1/auth/refresh`：同 `auth.controller.ts`（读 Refresh Cookie，轮转 Access）
- [x] T018 [US1] 完善 AuthService 登录成功路径：`apps/backEnd/src/modules/auth/auth.service.ts`（仅允许 role 为 ADMIN/AUTHOR）
- [x] T019 [P] [US1] 实现登录表单 UI：`apps/frontEnd/src/features/auth/login-form.tsx`（简体中文；账号=email、密码、提交）
- [x] T020 [P] [US1] 实现作者入口展示：`apps/frontEnd/src/features/auth/author-entry.tsx`（显示已登录邮箱/身份）
- [x] T021 [US1] 实现路由 `apps/frontEnd/src/app/login/page.tsx`（未登录展示表单；已登录重定向 `/author`）
- [x] T022 [US1] 实现路由 `apps/frontEnd/src/app/author/page.tsx`（服务端或中间件校验 `me`；未登录重定向 `/login`）
- [x] T023 [US1] 可选中间件保护：`apps/frontEnd/src/middleware.ts`（仅匹配 `/author`，或在 page 内完成等价校验）
- [x] T024 [US1] 打通前端 login → 写 Cookie → 跳转 `/author` → 刷新仍调用 `me` 成功

**Checkpoint**: US1 可独立验收（quickstart 场景 1–3、6）

---

## Phase 4: User Story 2 - 错误凭证与反馈 (Priority: P1)

**Goal**: 错误或空凭证时给出笼统中文失败提示，不进入作者入口，可立即重试

**Independent Test**: 在 `/login` 故意提交错误密码与空字段，仅验证提示与仍停留未登录态

### Implementation for User Story 2

- [x] T025 [US2] 后端统一登录失败为 401 + 文案「账号或密码不正确」：`apps/backEnd/src/modules/auth/auth.service.ts`（不区分账号是否存在）
- [x] T026 [US2] 登录 DTO 空值/格式错误返回 400 中文校验信息：`apps/backEnd/src/modules/auth/dto/login.dto.ts`
- [x] T027 [US2] 前端展示 API/校验错误于表单旁：`apps/frontEnd/src/features/auth/login-form.tsx`（失败不跳转；可再次提交）
- [x] T028 [US2] 确认 login 路由 Throttle 触发时有可理解中文提示（控制器或全局过滤器映射）：`apps/backEnd/src/modules/auth/auth.controller.ts` / `apps/backEnd/src/common/filters/`

**Checkpoint**: US2 可独立验收（quickstart 场景 4–5）

---

## Phase 5: User Story 4 - 读者阅读不受登录打扰 (Priority: P1)

**Goal**: 未登录读者可照常浏览列表与详情；登录入口低调不挡阅读

**Independent Test**: 无 Cookie 浏览器打开 `/` 与任意 `/posts/{slug}`，完整阅读且无登录墙

### Implementation for User Story 4

- [x] T029 [US4] 确认公开路由无鉴权强制：`apps/frontEnd/src/app/page.tsx`、`apps/frontEnd/src/app/posts/[slug]/page.tsx`、后端 `GET /posts` 保持 Public
- [x] T030 [US4] 在页头或页脚增加低调「作者」链至 `/login`：`apps/frontEnd/src/app/layout.tsx`（不进 Hero、不弹窗）
- [x] T031 [US4] 登录页 Metadata 建议 `robots: noindex`：`apps/frontEnd/src/app/login/page.tsx`（及 `/author` 按需 noindex）
- [x] T032 [US4] 回归走查：未登录首页/详情无跳转登录、无遮挡正文

**Checkpoint**: US4 可独立验收（quickstart 场景 8–10）

---

## Phase 6: User Story 3 - 登出 (Priority: P2)

**Goal**: 已登录作者可登出；之后访问作者入口需重新登录

**Independent Test**: 登录 → 登出 → 再访 `/author` 被要求登录

### Implementation for User Story 3

- [x] T033 [US3] 实现 `POST /api/v1/auth/logout`：`apps/backEnd/src/modules/auth/auth.controller.ts` + `auth.service.ts`（清除 Access/Refresh Cookie，204 或 200）
- [x] T034 [US3] 作者入口增加登出按钮并调用前端 `logout`：`apps/frontEnd/src/features/auth/author-entry.tsx`、`apps/frontEnd/src/lib/auth.ts`
- [x] T035 [US3] 登出后跳转 `/login` 或首页，再访 `/author` 必须重定向登录：`apps/frontEnd/src/app/author/page.tsx`

**Checkpoint**: US3 可独立验收（quickstart 场景 7）

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 加固、文档与端到端验收

- [x] T036 [P] 更新根 `README.md`（或 `specs/002-author-login/quickstart.md`）补充 JWT 环境变量与默认 seed 账号说明（简体中文）
- [x] T037 核对 Swagger 中 auth 四端点与 Cookie 说明：`apps/backEnd/src/main.ts`、`auth.controller.ts`
- [x] T038 生产相关 Cookie 标志：`Secure` 在非本地启用（`apps/backEnd/src/modules/auth/auth.service.ts` 或 cookie 工具）
- [x] T039 确认 IMPORT_TOKEN 导入路径未改坏：`apps/backEnd/src/common/guards/import-token.guard.ts` 与导入脚本仍可用
- [x] T040 按 `specs/002-author-login/quickstart.md` 完整走查场景 1–10 与合同冒烟

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖，可立即开始
- **Foundational (Phase 2)**: 依赖 Setup；**阻塞**所有用户故事
- **US1 (Phase 3)**: 依赖 Foundational → MVP
- **US2 (Phase 4)**: 依赖 US1 登录主路径（在同一 login 表单上强化）
- **US4 (Phase 5)**: 依赖 Foundational；与 US1 UI 并存时注意不改阅读路径；可在 US1 后并行打磨入口链
- **US3 (Phase 6)**: 依赖 US1（需已登录态）
- **Polish (Phase 7)**: 依赖拟交付的用户故事完成

### User Story Dependencies

```text
Phase 2 Foundational
        │
        ├─▶ US1 登录 (P1) ──┬─▶ US2 错误反馈 (P1)
        │                   └─▶ US3 登出 (P2)
        │
        └─▶ US4 读者免打扰 (P1)（主要验证 + 低调入口）
```

- **US1**: Foundational 后即可；无其他故事依赖 → **建议 MVP**
- **US2**: 逻辑上可随 US1 同批，但单独可测
- **US4**: 不依赖登出；可与 US2 并行
- **US3**: 需要 US1 成功登录能力

### Within Each User Story

- 后端端点/服务 → 前端封装 → 页面组装
- 故事完成后再进入下一优先级（或按上方并行机会）

### Parallel Opportunities

- Phase 1: T002 / T003 可并行
- Phase 2: T007 / T008 / T010 / T011 可并行；T013 与后端 Guard 可并行
- Phase 3: T019 / T020 可并行；T015–T017 若拆文件可部分并行（实际多在同一 controller，建议串行）
- Phase 5 与 Phase 4：人员足够时可并行
- Phase 7: T036 可与 T037 并行

---

## Parallel Example: User Story 1

```bash
# 后端合同端点就绪后，前端 UI 可并行：
Task: "实现登录表单 UI：apps/frontEnd/src/features/auth/login-form.tsx"
Task: "实现作者入口展示：apps/frontEnd/src/features/auth/author-entry.tsx"
```

---

## Implementation Strategy

### MVP First (仅 User Story 1)

1. Complete Phase 1: Setup  
2. Complete Phase 2: Foundational  
3. Complete Phase 3: US1  
4. **STOP and VALIDATE**：seed 账号登录 → `/author` → 刷新仍登录  
5. 再补 US2（失败提示）与 US4（读者路径），最后 US3 登出  

### Incremental Delivery

1. Setup + Foundational → 认证骨架就绪  
2. US1 → 可演示「能登录」  
3. US2 → 失败体验合格  
4. US4 → 确认未破坏 001 阅读  
5. US3 → 会话可结束  
6. Polish → quickstart 全绿  

### Parallel Team Strategy

1. 一起完成 Phase 1–2  
2. A：US1 后端 + 路由保护；B：US1 登录/入口 UI  
3. 其后 A：US2/US3；B：US4 + Polish 文档  

---

## Notes

- [P] = 不同文件且无未完成依赖  
- 不新增 Prisma model；沿用 `User` + seed  
- 不做注册、OAuth、CMS、阅读登录墙  
- 每个任务完成后可提交；在 Checkpoint 停下来按规格验收  
- 下一命令：`/speckit-implement`（或按本清单手工实现）
