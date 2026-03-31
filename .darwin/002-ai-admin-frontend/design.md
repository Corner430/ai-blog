# 技术设计文档

## 设计概述

在现有 AI 博客的基础上，新增 `/admin` 管理页面层，为已完成的 3 个后端 API（封面图生成、自动标签、写作助手）提供前端管理界面。同时新增 2 个辅助 API（文章列表读取、标签写入）以支持标签管理功能的服务端文件操作。此外修复第一轮 review 的 5 个 Minor 建议并同步更新过时的文档描述。所有管理页面遵循现有的 `'use client'` + Tailwind CSS + dark mode 模式，放置在 `app/admin/` 目录下。

## 方案对比

### 方案 A：Next.js App Router 页面方案

| 维度     | 描述                                                                                                                                               |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 核心思路 | 管理页面作为 `app/admin/` 下的 `page.tsx` 客户端组件，通过 fetch 调用现有 API 路由，标签文件操作通过新增 API 路由 `/api/admin/*` 在服务端完成      |
| 优点     | 与现有架构完全一致；复用 Next.js App Router 的路由、布局系统；管理页面自动获得 SectionContainer + Header + Footer 布局；标签文件操作安全（服务端） |
| 缺点     | 标签管理需要新增 2 个 API 路由（文章列表 + 标签写入）；管理页面在生产环境也可通过 URL 直接访问                                                     |

### 方案 B：独立 CLI 脚本方案

| 维度     | 描述                                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 核心思路 | 封面图和写作助手使用 Web 页面，标签管理使用 Node.js CLI 脚本（直接读写本地文件），通过 `yarn tag:generate` 等命令调用          |
| 优点     | 标签管理无需新增 API 路由，直接读写文件系统；CLI 脚本天然不暴露在生产环境                                                      |
| 缺点     | 交互体验差（命令行 vs 图形界面）；无法勾选/取消勾选标签；无法在浏览器中实时预览；混合方案（部分 Web + 部分 CLI）增加使用复杂度 |

**选定方案**：A（Next.js App Router 页面方案）

**理由**：用户明确要求"管理页面"而非 CLI 脚本，且标签管理的核心交互（勾选/取消勾选标签、实时预览）在 Web 界面中体验远优于命令行。虽然需要新增 2 个 API 路由，但代码量很小（读取文件列表 + gray-matter 写入），且与现有 `app/api/ai/` 的 Route Handler 模式完全一致。管理页面不加入导航栏即可满足"不对外公开"的需求。

## 架构设计

### 模块关系

```text
┌─────────────────────────────────────────────────────────────┐
│                    Admin Pages (Client)                       │
│                                                              │
│  app/admin/page.tsx           ── 管理中心首页（3 张卡片）     │
│  app/admin/cover/page.tsx     ── 封面图生成管理               │
│  app/admin/tags/page.tsx      ── 自动标签管理                 │
│  app/admin/writing/page.tsx   ── 写作助手                    │
│                                                              │
│  封面图: fetch /api/ai/cover/submit + /api/ai/cover/query   │
│  标签:   fetch /api/admin/articles + /api/ai/tags            │
│         + /api/admin/tags/write                               │
│  写作:   useCompletion → /api/ai/writing                     │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTP (JSON / SSE)
┌────────────────────────▼─────────────────────────────────────┐
│                 API Routes (Server)                            │
│                                                              │
│  [现有] app/api/ai/cover/submit/route.ts                     │
│  [现有] app/api/ai/cover/query/route.ts                      │
│  [现有] app/api/ai/tags/route.ts                             │
│  [现有] app/api/ai/writing/route.ts                          │
│  [新增] app/api/admin/articles/route.ts  ── 读取文章列表     │
│  [新增] app/api/admin/tags/write/route.ts ── 写入 frontmatter│
└────────────────────────┬─────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────┐
│                    Lib Layer                                  │
│                                                              │
│  [现有] lib/hunyuan.ts         ── OpenAI SDK wrapper         │
│  [现有] lib/hunyuan-image.ts   ── 生图 API 封装              │
│  [运行时] gray-matter           ── MDX frontmatter 解析/写入 │
│  [运行时] fs                    ── 文件系统读写               │
└──────────────────────────────────────────────────────────────┘
```

### 接口设计

```text
GET /api/admin/articles
  Description: 读取 data/blog/ 目录下所有 MDX 文章的元信息和内容
  Auth: 无
  Response 200:
    {
      "articles": [
        {
          "filename": "string — 文件名（如 hello-world.mdx）",
          "title": "string — 文章标题（来自 frontmatter）",
          "tags": ["string"] — 现有标签列表,
          "content": "string — 文章正文内容（不含 frontmatter）"
        }
      ]
    }
  Response 500:
    {
      "error": "string — 文件读取错误"
    }

---

POST /api/admin/tags/write
  Description: 将标签写入指定 MDX 文件的 frontmatter tags 字段（替换模式）
  Auth: 无
  Request Body:
    {
      "filename": "string — MDX 文件名（如 hello-world.mdx）",
      "tags": ["string"] — 要写入的标签列表
    }
  Response 200:
    {
      "success": true
    }
  Response 400:
    {
      "error": "string — 参数校验错误（filename 或 tags 缺失）"
    }
  Response 404:
    {
      "error": "string — 文件不存在"
    }
  Response 500:
    {
      "error": "string — 文件写入错误"
    }
```

### 文件变更清单

| 操作 | 文件路径                                                | 职责说明                                                                    |
| ---- | ------------------------------------------------------- | --------------------------------------------------------------------------- |
| 新建 | app/admin/page.tsx                                      | 管理中心首页，展示 3 张功能入口卡片                                         |
| 新建 | app/admin/cover/page.tsx                                | 封面图生成管理页面（输入 → 提交 → 轮询 → 预览 → 下载/复制）                 |
| 新建 | app/admin/tags/page.tsx                                 | 自动标签管理页面（文章列表 → 生成标签 → 勾选 → 写入）                       |
| 新建 | app/admin/writing/page.tsx                              | 写作助手页面（输入 → 润色/续写 → 流式结果 → 复制/替换）                     |
| 新建 | app/api/admin/articles/route.ts                         | 文章列表读取 API，使用 fs + gray-matter 读取 data/blog/\*.mdx               |
| 新建 | app/api/admin/tags/write/route.ts                       | 标签写入 API，使用 gray-matter 解析并重写 MDX 文件 frontmatter              |
| 新建 | app/admin/**tests**/admin-page.test.tsx                 | 管理中心首页测试                                                            |
| 新建 | app/admin/**tests**/cover-page.test.tsx                 | 封面图生成页面测试                                                          |
| 新建 | app/admin/**tests**/tags-page.test.tsx                  | 自动标签页面测试                                                            |
| 新建 | app/admin/**tests**/writing-page.test.tsx               | 写作助手页面测试                                                            |
| 新建 | app/api/admin/**tests**/articles.test.ts                | 文章列表 API 测试                                                           |
| 新建 | app/api/admin/**tests**/tags-write.test.ts              | 标签写入 API 测试                                                           |
| 修改 | app/api/ai/summary/route.ts:3                           | 移除未使用的 getHunyuanClient import（Minor #1）                            |
| 修改 | app/api/ai/tags/route.ts:3                              | 使用 getHunyuanProvider 替代内联 createOpenAI（Minor #2）                   |
| 修改 | app/api/ai/chat/route.ts:3                              | 使用 getHunyuanProvider 替代内联 createOpenAI（Minor #2）                   |
| 修改 | app/api/ai/writing/route.ts:3                           | 使用 getHunyuanProvider 替代内联 createOpenAI（Minor #2）                   |
| 修改 | components/ai/AiSearch.tsx:58-66                        | 移除冗余 Cmd+K 事件监听（Minor #3，但查看代码发现已修复——仅有 Escape 监听） |
| 修改 | lib/embeddings.ts                                       | 移除未使用的 loadEmbeddingIndex 和 cachedIndex（Minor #5）                  |
| 修改 | docs/plan.md:57-58                                      | 更新生图接口域名和认证方式描述                                              |
| 修改 | .darwin/001-ai-blog-development/design.md:64-73,192-194 | 更新 hunyuan-image.ts 职责、cover API Auth、外部服务域名                    |

## 决策记录

### DR-1: 写作助手使用 useCompletion 而非自定义 fetch + ReadableStream

- **上下文**：写作助手需要调用 `/api/ai/writing` 并流式展示结果。可以使用 Vercel AI SDK 的 `useCompletion` hook 或手动实现 fetch + stream 解析。
- **决策**：使用 `useCompletion` hook
- **理由**：`useCompletion` 专为单次 prompt → streaming completion 场景设计，与 `/api/ai/writing` 的请求/响应模式完美匹配。现有项目已使用 `useChat`（AiChat.tsx），风格一致。内置 isLoading、error 状态管理，减少样板代码。
- **备选方案**：手动 fetch + ReadableStream 解析（如 AiSummary.tsx 中的模式）——代码量更大，需手动管理 loading/error 状态。
- **后果**：依赖 `@ai-sdk/react` 的 `useCompletion` 导出（已在 dependencies 中）；需要在 `/api/ai/writing` 路由中确保 `toDataStreamResponse()` 格式兼容。

### DR-2: 标签管理通过 2 个新增 API 实现文件操作而非直接使用 Server Actions

- **上下文**：标签管理需要在服务端读取 MDX 文件列表和写入 frontmatter。Next.js 提供 Server Actions 和 Route Handler 两种服务端操作方式。
- **决策**：使用 Route Handler（`/api/admin/articles` 和 `/api/admin/tags/write`）
- **理由**：现有项目的所有服务端操作均通过 `app/api/` 下的 Route Handler 实现（7 个 AI API 路由），使用 Server Actions 会引入不一致的模式。Route Handler 更易测试（标准 HTTP 请求/响应），且与前端 fetch 调用模式一致。
- **备选方案**：Server Actions（`'use server'` 函数）——代码更简洁但与现有模式不一致，且不便于独立测试。
- **后果**：新增 2 个 API 路由文件；标签页面需要通过 fetch 调用而非直接调用服务端函数。

### DR-3: 封面图下载使用 fetch + Blob + Object URL 而非直接 \<a download\>

- **上下文**：需要实现封面图下载功能。跨域图片 URL 使用 `<a download>` 属性时，浏览器通常会忽略 download 属性而直接打开图片。
- **决策**：通过 fetch 获取图片 Blob，创建 Object URL，再通过 `<a download>` 触发下载
- **理由**：生图 API 返回的图片 URL 来自腾讯云 CDN（跨域），直接使用 `<a download>` 在大多数浏览器中无法触发下载。fetch + Blob 方案可绕过跨域限制。
- **备选方案**：服务端代理下载（通过新增 API 路由做中转）——增加服务端负载和代码复杂度。
- **后果**：下载过程中有短暂的网络请求延迟；需要处理 fetch 跨域（生图 CDN 需支持 CORS，如不支持则降级为新窗口打开图片 URL）。

### DR-4: 管理页面测试文件放在 app/admin/**tests**/ 而非各页面目录下

- **上下文**：需要为 4 个管理页面组件编写测试。可以放在每个页面目录的 `__tests__/` 下（如 `app/admin/cover/__tests__/`），也可以集中放在 `app/admin/__tests__/` 下。
- **决策**：集中放在 `app/admin/__tests__/` 下
- **理由**：现有项目的组件测试集中在 `components/ai/__tests__/`，API 测试集中在 `app/api/ai/__tests__/`，遵循"按模块集中放置"的现有模式。管理页面属于同一模块，集中放置更整洁。
- **备选方案**：分散到各页面目录——文件分散，不符合现有集中式测试目录的惯例。
- **后果**：测试文件路径较长但结构清晰；所有管理页面测试在同一目录下，方便批量运行。

### DR-5: gray-matter stringify 写回 MDX 文件而非手动拼接 frontmatter

- **上下文**：标签写入需要修改 MDX 文件的 frontmatter 中 tags 字段，同时保留其他 frontmatter 字段和正文内容不变。
- **决策**：使用 `gray-matter` 的 `matter(fileContent)` 解析后修改 `data.tags`，然后用 `matter.stringify(content, data)` 重新生成完整文件
- **理由**：项目已依赖 `gray-matter`（package.json），该库提供完整的 YAML frontmatter 解析和序列化能力，比手动正则替换更可靠，不会破坏其他 frontmatter 字段的格式。
- **备选方案**：正则匹配替换 `tags:` 行——脆弱，无法处理多行 tags 格式。
- **后果**：gray-matter stringify 可能微调 frontmatter 的缩进/引号风格，但不影响 Contentlayer 的解析。

## 遵循的现有模式

- **Route Handler 模式**：新增 API 路由遵循现有 `app/api/ai/` 的 `export async function POST/GET(request: Request)` 模式，使用 `NextResponse.json()` 返回
- **客户端组件模式**：管理页面遵循现有 `components/ai/AiChat.tsx` 的 `'use client'` + `useState`/`useEffect` + fetch 模式
- **Tailwind CSS 模式**：遵循现有组件的类名命名风格（`dark:bg-gray-900`、`text-gray-900 dark:text-gray-100`、`border-gray-200 dark:border-gray-700`）
- **错误处理模式**：API 路由使用 try-catch + `NextResponse.json({ error }, { status })` 模式，与现有 AI API 一致
- **测试模式**：遵循现有 `components/ai/__tests__/AiChat.test.tsx` 的测试风格——`@jest-environment jsdom` 注释、mock 外部依赖、`render` + `screen` + `fireEvent` 交互测试
- **路径别名模式**：使用 `@/lib/*`、`@/components/*` 路径别名，已在 `jest.config.ts` 中配置
- **布局继承**：管理页面自动继承 `app/layout.tsx` 的 Header + SectionContainer + Footer 布局

## 风险与对策

| 风险                                             | 可能性 | 影响                     | 对策                                                                                                |
| ------------------------------------------------ | ------ | ------------------------ | --------------------------------------------------------------------------------------------------- |
| 跨域图片 URL 无法通过 fetch 下载                 | 中     | 下载功能失败             | fetch 失败时降级为 `window.open(imageUrl)` 在新窗口打开图片                                         |
| gray-matter stringify 改变 frontmatter 格式      | 低     | MDX 文件格式微调         | Contentlayer 对 YAML frontmatter 格式宽容；写入后 lint-staged 会自动格式化                          |
| 管理页面在生产环境可通过 URL 直接访问            | 低     | 非授权用户可使用管理功能 | 个人博客场景下风险极低；标签写入仅在 dev 时实际有效（生产环境无 data/blog/ 源文件）                 |
| useCompletion 与 /api/ai/writing 返回格式不兼容  | 低     | 流式展示失败             | writing 路由已使用 `toDataStreamResponse()`，这是 Vercel AI SDK 标准格式，与 useCompletion 完全兼容 |
| data/blog/ 目录下文章数量增多时文章列表 API 变慢 | 低     | 页面加载慢               | 个人博客文章数量通常 < 500 篇，全量读取 frontmatter 仅需毫秒级；如需可加分页                        |
