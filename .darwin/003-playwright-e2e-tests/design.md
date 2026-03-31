# 技术设计文档

## 设计概述

在 Next.js 15 博客项目中引入 Playwright E2E 测试框架，通过 `webServer` 配置自动启动 `next dev` 开发服务器，使用 `page.route()` 拦截所有 AI API 调用实现 mock，按功能模块组织测试文件到 `e2e/` 目录，覆盖全站所有交互逻辑。

## 方案对比

| 方案                                    | 描述                                                                                               | 优点                                                                                                                | 缺点                                                                                                                              |
| --------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| A: Playwright + next dev                | 通过 Playwright webServer 启动 `next dev`，测试直接访问开发服务器，使用 `page.route()` mock AI API | 配置简单；不需要 build 步骤；HMR 不影响测试；`page.route()` 在浏览器层拦截请求，mock 精确可控；Next.js 官方推荐方案 | 开发服务器启动较慢；每次测试需等待 Turbopack 编译                                                                                 |
| B: Playwright + next build + next start | 先执行 `next build` 产出生产构建，再通过 `next start` 启动生产服务器进行测试                       | 测试环境更接近生产；页面加载更快；服务器行为更稳定                                                                  | 需要完整 build 流程（contentlayer + embeddings），耗时长；`HUNYUAN_API_KEY` 未配置时 build 可能有差异；增加 CI 复杂度；开发迭代慢 |

**选定方案**：A（Playwright + next dev）
**理由**：项目当前处于开发阶段，E2E 测试主要用于验证交互逻辑而非生产环境行为。`next dev` 启动速度虽然比 `next start` 慢首次编译，但避免了完整 build 流程（包括 contentlayer 处理和 embeddings 生成）。`page.route()` 在两种模式下行为一致，mock 策略不受影响。此外，开发者在本地可边开发边运行测试，反馈循环更短。

## 架构设计

### 模块关系

```text
playwright.config.ts          ← Playwright 主配置（webServer、项目、全局设置）
│
├── e2e/
│   ├── helpers/
│   │   └── mock-api.ts       ← 共享的 API mock 工具函数
│   │
│   ├── homepage.spec.ts      ← 首页交互测试 (FR-2)
│   ├── navigation.spec.ts    ← Header 桌面端导航测试 (FR-3)
│   ├── mobile-nav.spec.ts    ← 移动端导航测试 (FR-4)
│   ├── search.spec.ts        ← 搜索功能测试 (FR-5, FR-10)
│   ├── theme-switch.spec.ts  ← 主题切换测试 (FR-6)
│   ├── blog-list.spec.ts     ← 博客列表页测试 (FR-7)
│   ├── blog-post.spec.ts     ← 博客详情页测试 (FR-8)
│   ├── ai-chat.spec.ts       ← AI 问答测试 (FR-9)
│   ├── ai-summary.spec.ts    ← AI 摘要测试 (FR-11)
│   ├── tags-page.spec.ts     ← 标签页测试 (FR-12)
│   ├── admin.spec.ts         ← 管理后台首页测试 (FR-13)
│   ├── admin-cover.spec.ts   ← 封面图生成测试 (FR-14)
│   ├── admin-tags.spec.ts    ← 自动标签管理测试 (FR-15)
│   ├── admin-writing.spec.ts ← 写作助手测试 (FR-16)
│   ├── scroll-top.spec.ts    ← 滚动回顶测试 (FR-17)
│   └── not-found.spec.ts     ← 404 页面测试 (FR-18)
│
└── Next.js Dev Server (localhost:3000)
    ├── app/page.tsx           ← 首页
    ├── app/blog/              ← 博客列表和详情
    ├── app/tags/              ← 标签页
    ├── app/admin/             ← 管理后台
    └── app/api/ai/            ← AI API 路由（被 page.route mock 拦截）
```

### 数据模型

本需求不涉及新的数据模型。E2E 测试使用项目已有的 MDX 文章（`data/blog/hello-world.mdx`）和 contentlayer 生成的数据。

### 接口设计

本需求不新增 API 接口。需要 mock 的现有 API 接口清单：

```text
POST /api/ai/chat           ← AI 问答（streaming response, AI SDK 格式）
POST /api/ai/search         ← AI 语义搜索（JSON response: { results: [...] }）
POST /api/ai/summary        ← AI 文章摘要（text streaming response）
POST /api/ai/tags           ← AI 标签生成（JSON response: { tags: [...] }）
POST /api/ai/writing        ← AI 写作助手（text streaming response）
POST /api/ai/cover/submit   ← 封面图提交（JSON response: { jobId: "..." }）
GET  /api/ai/cover/query    ← 封面图轮询（JSON response: { status, imageUrl }）
GET  /api/admin/articles     ← 文章列表（JSON response: { articles: [...] }）
POST /api/admin/tags/write   ← 标签写入（JSON response: { success: true }）
```

**Mock 策略**：

AI SDK v6 的 streaming API 使用特定的响应格式：

- `useChat` (AI 问答) 使用 AI SDK v6 UI Message Stream Protocol，响应为 SSE 格式（`data: {"type":"text-delta","delta":"..."}\n\n`），需设置 `x-vercel-ai-ui-message-stream: v1` header
- `useCompletion` (摘要、写作助手) 使用 `streamProtocol: 'text'`，响应为纯文本流

mock 需要模拟这些格式，通过 `page.route()` 在浏览器网络层拦截并返回预构造的响应。

### 文件变更清单

| 操作 | 文件路径                  | 职责说明                                                      |
| ---- | ------------------------- | ------------------------------------------------------------- |
| 修改 | package.json              | 添加 `@playwright/test` 到 devDependencies，添加 `"e2e"` 脚本 |
| 新建 | playwright.config.ts      | Playwright 主配置文件（webServer、浏览器、viewport 等）       |
| 新建 | e2e/helpers/mock-api.ts   | 共享的 API mock 工具函数（拦截 AI API 请求并返回预设响应）    |
| 新建 | e2e/homepage.spec.ts      | 首页交互 E2E 测试                                             |
| 新建 | e2e/navigation.spec.ts    | Header 桌面端导航 E2E 测试                                    |
| 新建 | e2e/mobile-nav.spec.ts    | 移动端导航 E2E 测试（viewport: 390x844）                      |
| 新建 | e2e/search.spec.ts        | 搜索功能 E2E 测试（含 AI 搜索 mock）                          |
| 新建 | e2e/theme-switch.spec.ts  | 主题切换 E2E 测试                                             |
| 新建 | e2e/blog-list.spec.ts     | 博客列表页 E2E 测试                                           |
| 新建 | e2e/blog-post.spec.ts     | 博客详情页 E2E 测试                                           |
| 新建 | e2e/ai-chat.spec.ts       | AI 问答 E2E 测试（mock streaming）                            |
| 新建 | e2e/ai-summary.spec.ts    | AI 摘要 E2E 测试（mock streaming）                            |
| 新建 | e2e/tags-page.spec.ts     | 标签页 E2E 测试                                               |
| 新建 | e2e/admin.spec.ts         | 管理后台首页 E2E 测试                                         |
| 新建 | e2e/admin-cover.spec.ts   | 封面图生成 E2E 测试（mock submit + polling）                  |
| 新建 | e2e/admin-tags.spec.ts    | 自动标签管理 E2E 测试（mock articles + tags API）             |
| 新建 | e2e/admin-writing.spec.ts | 写作助手 E2E 测试（mock streaming）                           |
| 新建 | e2e/scroll-top.spec.ts    | 滚动回顶 E2E 测试                                             |
| 新建 | e2e/not-found.spec.ts     | 404 页面 E2E 测试                                             |
| 修改 | .gitignore                | 添加 Playwright 产出目录（test-results/、playwright-report/） |

## 决策记录

### DR-1: 使用 page.route() 而非 MSW 进行 API Mock

- **上下文**：E2E 测试中需要 mock AI API 响应，有两种主流方案：Playwright 原生的 `page.route()` 拦截和 MSW (Mock Service Worker)
- **决策**：使用 Playwright 原生的 `page.route()` 拦截
- **理由**：`page.route()` 是 Playwright 内置能力，不需要额外安装依赖；在浏览器网络层直接拦截，对 Next.js API Routes 和客户端 fetch 都生效；可以精确控制响应时序（模拟延迟、分块 streaming）；与 Playwright 测试生命周期天然集成
- **备选方案**：MSW — 需要额外配置 service worker，在 Next.js App Router 的 SSR 环境中配置较复杂，且 streaming mock 支持不如 `page.route()` 灵活
- **后果**：mock 逻辑与 Playwright 强耦合，不能在非 Playwright 测试中复用，但这是可接受的，因为 mock 仅用于 E2E 测试

### DR-2: 测试文件按功能模块分离，而非按页面合并

- **上下文**：可以将所有测试写在少数几个大文件中（按页面），也可以按功能模块拆分为多个小文件
- **决策**：按功能模块拆分为独立的 `.spec.ts` 文件
- **理由**：每个文件关注单一功能领域，易于维护和定位问题；Playwright 支持并行运行不同 spec 文件，拆分有利于并行化；文件名直观映射到功能，开发者能快速找到需要修改的测试
- **备选方案**：按页面合并（如所有 admin 测试放一个文件）— 文件更少但单文件更长，不利于并行执行
- **后果**：e2e 目录下文件数量较多（约 18 个），但每个文件短小聚焦

### DR-3: 移动端测试独立文件而非 viewport 切换

- **上下文**：移动端导航（MobileNav）测试可以在导航测试文件中通过 `test.use({ viewport })` 切换，也可以作为独立文件
- **决策**：创建独立的 `e2e/mobile-nav.spec.ts` 文件，通过文件级 `test.use()` 设置移动端 viewport
- **理由**：移动端导航的 UI 和交互模式（汉堡菜单、侧边栏滑入）与桌面端完全不同，逻辑独立；独立文件使 viewport 配置集中，避免同一文件中频繁切换 viewport；也方便单独运行移动端测试子集
- **备选方案**：在 `navigation.spec.ts` 中通过 `test.describe` 块切换 viewport — 技术可行但文件会变长，关注点混合
- **后果**：`navigation.spec.ts` 专注桌面端，`mobile-nav.spec.ts` 专注移动端，职责清晰

### DR-4: AI SDK Streaming Mock 格式

- **上下文**：AI SDK 的 `useChat` 和 `useCompletion` 使用不同的 streaming 协议，mock 需要模拟正确的响应格式
- **决策**：在 `e2e/helpers/mock-api.ts` 中封装两类 mock 函数：(1) `mockChatStream` 模拟 AI SDK v6 UI Message Stream Protocol（SSE 格式，`data: {"type":"text-delta","delta":"..."}\n\n`）；(2) `mockTextStream` 模拟纯文本流
- **理由**：`useChat` 默认使用 AI SDK v6 UI Message Stream Protocol（SSE + JSON chunks）解析响应，如果 mock 格式不对会导致消息无法渲染；`useCompletion` 在 AiSummary 中配置了 `streamProtocol: 'text'`，需要纯文本响应；封装到 helper 中避免每个测试文件重复编写 mock 逻辑
- **备选方案**：每个测试文件独立编写 mock — 会导致大量重复代码，且格式一旦变化需要修改多处
- **后果**：所有 AI mock 逻辑集中在一个 helper 文件中，维护成本低

### DR-5: 添加 e2e 脚本命令到 package.json

- **上下文**：可以仅通过 `npx playwright test` 运行测试，或在 `package.json` 中添加便捷脚本
- **决策**：在 `package.json` 的 `scripts` 中添加 `"e2e": "playwright test"` 命令
- **理由**：与项目现有的 `start`/`dev`/`build`/`lint` 脚本风格一致；开发者通过 `yarn e2e` 即可运行，降低记忆成本；CI 配置中使用 `yarn e2e` 更规范
- **备选方案**：不添加脚本，使用 `npx playwright test` — 可行但不统一
- **后果**：package.json 增加一行 script

## 遵循的现有模式

- 遵循项目已有的 TypeScript 配置风格（tsconfig.json 中的路径别名模式）
- 遵循项目已有的测试组织模式（现有 Jest 测试使用 `__tests__/` 目录，E2E 测试使用独立的 `e2e/` 目录以区分层次）
- 遵循项目已有的 yarn 包管理器约定（yarn 3.6.1）
- 遵循现有组件的 `data-testid` 属性命名约定（如 `ai-chat-toggle`、`ai-chat-panel`、`ai-search-modal`、`ai-summary` 等已存在于源代码中）
- 遵循项目 `next.config.js` 中的环境变量传递模式（`NEXT_PUBLIC_AI_ENABLED` 通过 `HUNYUAN_API_KEY` 存在性控制）

## 风险与对策

| 风险                                       | 可能性 | 影响                            | 对策                                                                                                                        |
| ------------------------------------------ | ------ | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| next dev 启动慢导致测试超时                | 中     | 测试首次运行失败                | 在 playwright.config.ts 的 webServer 中设置足够的 timeout（如 120s）；配置 reuseExistingServer: true 允许复用已启动的服务器 |
| AI SDK streaming mock 格式与实际不匹配     | 中     | AI 组件测试收不到数据           | 在 mock-api.ts 中精确模拟 AI SDK Data Stream Protocol 格式；通过实际调试验证 mock 响应格式                                  |
| 项目仅有 1 篇文章导致列表/分页测试覆盖不足 | 低     | 分页 Previous/Next 按钮无法测试 | 首先验证单篇文章下的正确行为（无分页时按钮禁用）；分页测试标记为条件测试，仅在文章数量足够时执行                            |
| Playwright 浏览器安装在 CI/容器环境中失败  | 低     | 无法运行测试                    | 在 .gitignore 中排除 test-results 和 playwright-report；浏览器安装命令记录在文档中                                          |
| contentlayer 未生成导致 next dev 启动失败  | 中     | webServer 无法启动              | 确保测试运行前 `.contentlayer` 目录存在（通过 `next dev` 自动触发 contentlayer build）                                      |
