# 技术设计文档

## 设计概述

在 tailwind-nextjs-starter-blog v2.4.0 模板上增量集成 6 项 AI 功能。核心思路：通过 `lib/hunyuan.ts` 封装 OpenAI 兼容 SDK 调用腾讯云混元文本/Embedding 模型，通过 `lib/hunyuan-image.ts` 封装腾讯云 API 3.0 调用生图模型。所有 AI 功能通过 Next.js Route Handlers (`app/api/ai/`) 暴露为服务端 API，前端组件 (`components/ai/`) 以客户端组件方式调用这些 API。搜索功能替换现有 KBar，embedding 索引在构建阶段生成。

## 方案对比

### 方案 A：OpenAI SDK + Vercel AI SDK 流式方案

| 维度     | 描述                                                                                                                            |
| -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 核心思路 | 使用 `openai` SDK 连接混元兼容接口，`ai` (Vercel AI SDK) 的 `streamText` 处理流式响应，前端用 `useChat`/自定义 hook 消费 SSE 流 |
| 优点     | Vercel AI SDK 原生支持 Next.js App Router；流式处理开箱即用；`useChat` hook 自带多轮对话状态管理；社区广泛使用，文档完善        |
| 缺点     | 新增 2 个依赖（openai + ai）；Vercel AI SDK 有一定学习曲线                                                                      |

### 方案 B：原生 fetch + ReadableStream 方案

| 维度     | 描述                                                                                                                                |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 核心思路 | 直接使用 `fetch` 调用混元 OpenAI 兼容接口，手动解析 SSE 流（`text/event-stream`），前端用 `ReadableStream` + `TextDecoder` 逐块读取 |
| 优点     | 零额外依赖；完全控制流式解析逻辑                                                                                                    |
| 缺点     | 需要手动实现 SSE 解析、错误处理、重连逻辑；多轮对话状态管理需自行实现；代码量大、易出错；缺少 TypeScript 类型支持                   |

**选定方案**：A（OpenAI SDK + Vercel AI SDK）

**理由**：混元 API 明确兼容 OpenAI 接口协议，使用 openai SDK 是最标准的接入方式。Vercel AI SDK 专为 Next.js 流式 AI 场景设计，`streamText` 和 `useChat` 大幅减少样板代码。虽然增加了依赖，但这些是 plan.md 中明确指定的依赖（openai、ai），且博客部署在 Vercel 上，生态高度匹配。

## 架构设计

### 模块关系

```text
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Client)                     │
│                                                         │
│  components/ai/AiSummary.tsx  ──┐                       │
│  components/ai/AiChat.tsx     ──┤── fetch /api/ai/*     │
│  components/ai/AiSearch.tsx   ──┘                       │
│                                                         │
│  layouts/PostLayout.tsx  ── imports AiSummary, AiChat   │
│  layouts/PostSimple.tsx  ── imports AiSummary, AiChat   │
│  layouts/PostBanner.tsx  ── imports AiSummary, AiChat   │
│                                                         │
│  SearchButton.tsx  ── replaced → AiSearch integration   │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP (SSE / JSON)
┌────────────────────────▼────────────────────────────────┐
│                 API Routes (Server)                      │
│                                                         │
│  app/api/ai/summary/route.ts  ─┐                        │
│  app/api/ai/chat/route.ts     ─┤                        │
│  app/api/ai/search/route.ts   ─┤── uses lib/*           │
│  app/api/ai/tags/route.ts     ─┤                        │
│  app/api/ai/cover/submit/route.ts ─┤                    │
│  app/api/ai/cover/query/route.ts  ─┤                    │
│  app/api/ai/writing/route.ts  ─┘                        │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                    Lib Layer                             │
│                                                         │
│  lib/hunyuan.ts          ── OpenAI SDK wrapper          │
│  lib/hunyuan-image.ts    ── OpenAI 兼容生图 API 封装    │
│  lib/embeddings.ts       ── Embedding index utils       │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              External Services                          │
│                                                         │
│  api.hunyuan.cloud.tencent.com/v1  (OpenAI compat)     │
│  api.cloudai.tencent.com           (Image generation)   │
└─────────────────────────────────────────────────────────┘
```

### 接口设计

```text
POST /api/ai/summary
  Description: 为指定文章生成 AI 摘要（流式）
  Auth: 无（服务端使用 HUNYUAN_API_KEY）
  Request Body:
    {
      "content": "string — 文章 Markdown 全文",
      "slug": "string — 文章 slug，用于日志"
    }
  Response 200 (text/event-stream):
    data: {"text": "摘要文本片段"}
    data: {"text": "..."}
    data: [DONE]
  Response 400:
    {
      "error": "string — 参数校验错误"
    }
  Response 503:
    {
      "error": "string — AI 功能未启用"
    }
  Response 500:
    {
      "error": "string — 运行时错误描述"
    }

---

POST /api/ai/chat
  Description: 基于文章内容的 AI 问答（流式）
  Auth: 无（服务端使用 HUNYUAN_API_KEY）
  Request Body:
    {
      "messages": [
        {"role": "user|assistant", "content": "string"}
      ],
      "articleContent": "string — 当前文章 Markdown 全文"
    }
  Response 200 (text/event-stream):
    Vercel AI SDK 标准流式格式
  Response 400:
    {
      "error": "string — 参数校验错误"
    }
  Response 503:
    {
      "error": "string — AI 功能未启用"
    }
  Response 500:
    {
      "error": "string — 运行时错误描述"
    }

---

POST /api/ai/search
  Description: 语义搜索文章
  Auth: 无（服务端使用 HUNYUAN_API_KEY）
  Request Body:
    {
      "query": "string — 用户搜索查询"
    }
  Response 200:
    {
      "results": [
        {
          "slug": "string",
          "title": "string",
          "summary": "string",
          "score": "number — 相似度分数"
        }
      ]
    }
  Response 400:
    {
      "error": "string — 参数校验错误"
    }
  Response 503:
    {
      "error": "string — AI 功能未启用"
    }
  Response 500:
    {
      "error": "string — 运行时错误描述"
    }

---

POST /api/ai/tags
  Description: 为文章内容生成标签建议
  Auth: 无（服务端使用 HUNYUAN_API_KEY）
  Request Body:
    {
      "content": "string — 文章 Markdown 全文"
    }
  Response 200:
    {
      "tags": ["string", "string", ...]
    }
  Response 400:
    {
      "error": "string — 参数校验错误"
    }
  Response 503:
    {
      "error": "string — AI 功能未启用"
    }
  Response 500:
    {
      "error": "string — 运行时错误描述"
    }

---

POST /api/ai/cover/submit
  Description: 提交封面图生成任务
  Auth: 无（服务端使用 HUNYUAN_API_KEY）
  Request Body:
    {
      "title": "string — 文章标题",
      "summary": "string — 文章摘要"
    }
  Response 200:
    {
      "jobId": "string — 异步任务 ID"
    }
  Response 400:
    {
      "error": "string — 参数校验错误"
    }
  Response 503:
    {
      "error": "string — AI 生图功能未启用"
    }
  Response 500:
    {
      "error": "string — 运行时错误描述"
    }

---

GET /api/ai/cover/query?jobId={jobId}
  Description: 查询封面图生成任务状态
  Auth: 无（服务端使用 HUNYUAN_API_KEY）
  Response 200 (processing):
    {
      "status": "processing"
    }
  Response 200 (done):
    {
      "status": "done",
      "imageUrl": "string — 生成图片 URL"
    }
  Response 200 (failed):
    {
      "status": "failed",
      "error": "string — 失败原因"
    }
  Response 400:
    {
      "error": "string — 参数校验错误（缺少 jobId）"
    }
  Response 503:
    {
      "error": "string — AI 生图功能未启用"
    }
  Response 500:
    {
      "error": "string — 运行时错误描述"
    }

---

POST /api/ai/writing
  Description: AI 写作助手（润色/续写，流式）
  Auth: 无（服务端使用 HUNYUAN_API_KEY）
  Request Body:
    {
      "content": "string — 文章内容片段",
      "action": "polish|continue — 操作类型"
    }
  Response 200 (text/event-stream):
    Vercel AI SDK 标准流式格式
  Response 400:
    {
      "error": "string — 参数校验错误"
    }
  Response 503:
    {
      "error": "string — AI 功能未启用"
    }
  Response 500:
    {
      "error": "string — 运行时错误描述"
    }
```

### 数据模型

```text
Entity: EmbeddingIndex (JSON file at public/embedding-index.json)
  Fields:
    - articles: Array
      - slug: string — 文章 slug
      - title: string — 文章标题
      - summary: string — 文章摘要
      - embedding: number[1024] — 1024 维向量
  Generated: build time via scripts/generate-embeddings.mjs
  Loaded: runtime, read from JSON into memory

Entity: SummaryCacheEntry (localStorage)
  Fields:
    - key: "ai-summary-{slug}-{contentHash}" — 缓存 key
    - value: string — 完整摘要文本
  Lifecycle: 客户端写入/读取，文章内容 hash 变化时自动失效
```

### 文件变更清单

| 操作 | 文件路径                          | 职责说明                                                      |
| ---- | --------------------------------- | ------------------------------------------------------------- |
| 新建 | lib/hunyuan.ts                    | 封装 OpenAI SDK，创建混元客户端实例，导出 chat/embedding 方法 |
| 新建 | lib/hunyuan-image.ts              | 封装腾讯云 SDK，导出 submitImageJob/queryImageJob 方法        |
| 新建 | lib/embeddings.ts                 | Embedding 索引加载/余弦相似度计算工具                         |
| 新建 | app/api/ai/summary/route.ts       | AI 摘要 API，流式调用 HY 2.0 Think                            |
| 新建 | app/api/ai/chat/route.ts          | AI 问答 API，流式调用 HY 2.0 Think，接收 messages 数组        |
| 新建 | app/api/ai/search/route.ts        | AI 语义搜索 API，计算查询向量与索引的余弦相似度               |
| 新建 | app/api/ai/tags/route.ts          | AI 自动标签 API，调用 HY 2.0 Think 返回 JSON                  |
| 新建 | app/api/ai/cover/submit/route.ts  | 封面图提交任务 API                                            |
| 新建 | app/api/ai/cover/query/route.ts   | 封面图查询任务状态 API                                        |
| 新建 | app/api/ai/writing/route.ts       | AI 写作助手 API，流式调用 HY 2.0 Think                        |
| 新建 | components/ai/AiSummary.tsx       | AI 摘要客户端组件（流式展示 + localStorage 缓存）             |
| 新建 | components/ai/AiChat.tsx          | AI 问答浮窗客户端组件（多轮对话）                             |
| 新建 | components/ai/AiSearch.tsx        | AI 语义搜索组件（替换 KBar 搜索）                             |
| 新建 | scripts/generate-embeddings.mjs   | 构建脚本，为所有文章生成 embedding 索引                       |
| 修改 | layouts/PostLayout.tsx:1-12,32-57 | 导入并集成 AiSummary、AiChat 组件                             |
| 修改 | layouts/PostSimple.tsx:1-10,19-41 | 导入并集成 AiSummary、AiChat 组件                             |
| 修改 | layouts/PostBanner.tsx:1-11,20-41 | 导入并集成 AiSummary、AiChat 组件                             |
| 修改 | components/SearchButton.tsx       | 替换 KBar/Algolia 为 AiSearch 触发                            |
| 修改 | app/layout.tsx:7,101              | 移除或条件化 SearchProvider（KBar），集成 AiSearch            |
| 修改 | data/siteMetadata.js:87-100       | search.provider 配置调整为支持 AI 搜索                        |
| 修改 | package.json                      | 新增 openai、tencentcloud-sdk-nodejs-hunyuan、ai 依赖         |
| 修改 | .env.example                      | 新增 HUNYUAN_API_KEY、TENCENT_SECRET_ID、TENCENT_SECRET_KEY   |
| 修改 | package.json scripts              | 在 build 脚本中添加 embedding 索引生成步骤                    |
| 修改 | tsconfig.json paths               | 添加 @/lib/\* 路径别名                                        |

## 决策记录

### DR-1: 使用 Vercel AI SDK streamText 而非手动 SSE 解析

- **上下文**：需要在 Next.js Route Handler 中返回流式文本响应，前端逐字展示
- **决策**：使用 `ai` 包的 `streamText()` 生成流式响应，前端用 `useChat` hook 或自定义 fetch + ReadableStream 消费
- **理由**：streamText 自动处理 OpenAI 兼容接口的 SSE 格式，内置错误处理和中断逻辑；与 Next.js App Router 深度集成
- **备选方案**：手动 fetch + SSE 解析（方案 B，代码量大且易出错）
- **后果**：新增 `ai` 依赖（~50KB gzipped）；锁定 Vercel AI SDK 的流式协议格式

### DR-2: 封面图采用双接口客户端轮询而非单接口长等待

- **上下文**：混元生图是异步任务（30-120 秒），Vercel Serverless 免费版超时 10 秒
- **决策**：拆分为 `/api/ai/cover/submit`（提交，秒级返回 jobId）和 `/api/ai/cover/query`（查询状态，秒级返回），前端每 3 秒轮询
- **理由**：每次请求耗时仅 1-2 秒，完全在 Serverless 超时限制内；兼容 Vercel 免费版和 Pro 版
- **备选方案**：单接口内轮询等待完成后返回（会超时）；WebSocket 推送（Vercel 不原生支持）
- **后果**：前端需实现轮询逻辑；多了一个 API 路由文件；用户可以看到进度状态

### DR-3: AI 摘要使用 localStorage 缓存而非每次实时生成

- **上下文**：每次打开文章都调用 LLM 生成摘要，费用和延迟都不理想
- **决策**：客户端以 `ai-summary-{slug}-{contentHash}` 为 key 缓存摘要到 localStorage
- **理由**：相同文章内容的摘要是确定性的（近似），缓存后重复访问秒出；文章更新时 contentHash 变化自动失效；实现简单（10 行代码）
- **备选方案**：服务端 Redis/文件缓存（需额外基础设施）；不缓存（费用高，体验差）
- **后果**：首次访问仍需等待流式生成；不同浏览器/设备缓存不共享；localStorage 有 5MB 限制（单篇摘要约 500 字节，可存 ~10000 篇）

### DR-4: 语义搜索索引使用 JSON 文件而非向量数据库

- **上下文**：需要存储和检索文章 embedding 向量
- **决策**：构建时生成 `public/embedding-index.json`，运行时加载到内存计算余弦相似度
- **理由**：个人博客文章数量有限（通常 < 500 篇），JSON 文件足够；无需额外部署向量数据库（Pinecone/Weaviate 等）；与现有模板的 `search.json` 模式一致
- **备选方案**：Pinecone/Weaviate 等向量数据库（运维成本高，个人博客不需要）；SQLite + 向量扩展（需额外依赖）
- **后果**：文章数量极大（>1000）时 JSON 文件可能较大；每次搜索需遍历所有向量（O(n) 复杂度，500 篇约 1ms）

### DR-5: 搜索组件替换策略 — 保留 SearchButton 入口，替换内部实现

- **上下文**：现有搜索通过 `SearchProvider`(KBar) + `SearchButton` 实现，需替换为 AI 语义搜索
- **决策**：保留 `SearchButton.tsx` 作为搜索入口，内部替换为触发 `AiSearch` 模态框；移除 `app/layout.tsx` 中的 `SearchProvider` 包裹
- **理由**：保持 Header 中搜索按钮的位置和样式不变；最小化对现有布局的侵入
- **备选方案**：完全重写 Header 中的搜索逻辑（改动范围大）；保留 KBar 作为降级方案（两套搜索混乱）
- **后果**：KBar 相关代码可在确认 AI 搜索稳定后清理；pliny/search 依赖仍保留但不使用其搜索功能

### DR-6: contentHash 使用简单字符串 hash 而非 crypto

- **上下文**：需要为摘要缓存生成文章内容的 hash，用于缓存失效判断
- **决策**：在客户端使用简单的 djb2 字符串 hash 算法（纯 JS，无依赖）
- **理由**：仅用于缓存 key 的唯一性判断，不需要密码学安全；djb2 性能好且碰撞率可接受；不依赖 Web Crypto API（兼容性更好）
- **备选方案**：Web Crypto API 的 SHA-256（异步，过于重量级）；直接用文章 lastmod 日期（粒度粗，同一天修改多次无法区分）
- **后果**：理论上可能有极低概率的 hash 碰撞（实际影响仅为多生成一次摘要，无害）

## 遵循的现有模式

- **API Route 模式**：遵循现有 `app/api/newsletter/route.ts` 的 Route Handler 导出模式（`export { handler as GET, handler as POST }` 或直接导出 `POST`/`GET` 函数）
- **客户端组件模式**：遵循 `components/ScrollTopAndComment.tsx` 的 `'use client'` + `useState`/`useEffect` 模式
- **布局集成模式**：遵循 `layouts/PostLayout.tsx` 中通过 props 传递 `content` 对象的模式，AI 组件从 `content` 中读取文章数据
- **路径别名模式**：遵循 `@/components/*`、`@/data/*` 的路径别名约定，新增 `@/lib/*`
- **配置集中管理**：遵循 `data/siteMetadata.js` 的集中配置模式，AI 相关配置可扩展到此文件
- **静态文件输出**：遵循 `contentlayer.config.ts` 中 `createSearchIndex()` 的模式，在构建阶段生成 `public/` 下的静态 JSON 文件
- **环境变量管理**：遵循 `.env.example` 的模式，新增 AI 相关环境变量

## 风险与对策

| 风险                                               | 可能性 | 影响                     | 对策                                                                                        |
| -------------------------------------------------- | ------ | ------------------------ | ------------------------------------------------------------------------------------------- |
| 混元 API 响应慢导致流式体验差                      | 中     | 用户等待时间长           | 摘要组件添加 loading 骨架屏动画；设置合理的超时时间（30 秒）                                |
| Vercel AI SDK 与混元 OpenAI 兼容接口存在微妙不兼容 | 低     | 流式解析失败             | 优先使用 openai SDK 直接调用，Vercel AI SDK 仅做流式转发；保留 fallback 到原生 fetch 的能力 |
| embedding 索引文件过大影响页面加载                 | 低     | 首次搜索慢               | 索引文件通过 API 按需加载，不随页面 bundle；500 篇文章 × 1024 维 × 4 字节 ≈ 2MB，可接受     |
| localStorage 在隐私模式下不可用                    | 低     | 摘要缓存失效             | 使用 try-catch 包裹 localStorage 操作，失败时回退到每次实时生成                             |
| 构建阶段 embedding API 调用失败                    | 中     | 构建中断                 | 脚本内添加重试逻辑（3 次重试）；embedding 索引生成失败时不阻塞构建，仅打印警告              |
| 腾讯云生图 API 并发限制（默认 1）                  | 中     | 多人同时生成封面图时排队 | 前端提示"当前有任务排队中"；单人博客场景影响有限                                            |
