# 需求澄清文档

## 项目概览

- **仓库**：/data/workspace/blog（本地路径）
- **技术栈**：Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + MDX (Contentlayer2) + Pliny 0.4.1
- **现有模块**：
  - `app/` — 页面路由（首页、博客列表、博客详情、标签、关于、项目）
  - `components/` — UI 组件（Header, Footer, SearchButton, Comments, Tag, ThemeSwitch 等）
  - `layouts/` — 文章布局（PostLayout 双栏、PostSimple 简化、PostBanner 大图）
  - `data/` — 内容数据（MDX 文章、作者、站点配置、导航链接）
  - `css/` — 样式（Tailwind + Prism 代码高亮）
  - `public/` — 静态资源（favicon、图片）
  - `scripts/` — 构建脚本
- **当前搜索方案**：KBar（客户端关键词搜索，基于 search.json）
- **当前评论方案**：Giscus（基于 GitHub Discussions）
- **包管理器**：Yarn 3.6.1

## 原始需求

> @docs/plan.md 开发 blog

（完整需求见 `docs/plan.md`，核心目标：基于 tailwind-nextjs-starter-blog v2.4.0 模板，集成腾讯云混元 AI 的 6 项功能，搭建现代博客。）

## 澄清后的需求

### 功能需求

- FR-1: 创建 AI 文章摘要功能 — 在文章详情页（PostLayout、PostSimple、PostBanner 三种布局）顶部区域展示一段由 LLM 生成的流式文章摘要，调用 `/api/ai/summary` 接口，使用腾讯云混元 HY 2.0 Think 模型，将文章全文作为输入，流式返回 2-3 句中文摘要
- FR-2: 创建 AI 文章问答功能 — 在文章详情页右下角添加浮窗聊天组件，用户输入问题后调用 `/api/ai/chat` 接口，以当前文章内容为 context 进行 RAG 模式问答，流式返回 AI 回答
- FR-3: 创建 AI 语义搜索功能 — 替换现有 KBar 关键词搜索，在构建阶段使用 hunyuan-embedding 模型为所有文章生成 1024 维向量索引（存为 JSON 文件），运行时通过 `/api/ai/search` 接口计算用户查询与文章向量的余弦相似度，返回排序后的相关文章列表
- FR-4: 创建 AI 自动标签功能 — 提供 `/api/ai/tags` 接口，接收文章内容，使用 HY 2.0 Think 模型分析后返回建议的分类标签列表（JSON 数组）
- FR-5: 创建 AI 封面图生成功能 — 提供 `/api/ai/cover` 接口，接收文章标题和摘要，调用混元生图 API（SubmitHunyuanImageJob）提交异步任务，轮询 QueryHunyuanImageJob 获取结果，返回生成的 1280x720 封面图 URL
- FR-6: 创建 AI 写作助手功能 — 提供 `/api/ai/writing` 接口，接收文章内容片段和操作指令（润色/续写），使用 HY 2.0 Think 模型流式返回处理后的文本

### 非功能需求

- NFR-1: AI 摘要和问答接口采用 Server-Sent Events (SSE) 流式传输，首 token 延迟不超过 3 秒（取决于上游 API 响应时间）
- NFR-2: AI 相关 API Key 仅在服务端使用，不暴露给客户端；所有 AI API 路由通过 Next.js Route Handlers 实现，环境变量通过 `.env.local` 管理
- NFR-3: embedding 索引在 `next build` 阶段生成，运行时直接从 JSON 文件加载到内存，搜索接口响应时间不超过 500ms（不含 embedding 计算时间）
- NFR-4: 所有 AI 功能在 API Key 未配置时优雅降级（隐藏 AI 组件或显示友好提示），不阻塞博客正常浏览功能

### 约束条件

- C-1: 使用腾讯云混元 API（OpenAI 兼容接口 `https://api.hunyuan.cloud.tencent.com/v1`），文本模型使用 HY 2.0 Think，Embedding 模型使用 hunyuan-embedding
- C-2: 生图功能使用腾讯云 API 3.0 签名认证（TC3-HMAC-SHA256），需要 TENCENT_SECRET_ID 和 TENCENT_SECRET_KEY，地域 ap-guangzhou，API 版本 2023-09-01
- C-3: 新增依赖限定为 `openai` (OpenAI 兼容 SDK)、`tencentcloud-sdk-nodejs-hunyuan`（生图 SDK）、`ai`（Vercel AI SDK，用于流式处理）
- C-4: 部署目标为 Vercel，需兼容 Vercel Serverless Functions 的执行时间限制（免费版 10 秒，Pro 版 60 秒）
- C-5: 现有模板功能（主题切换、评论、RSS、SEO）保持不变，AI 功能作为增量添加

### 推断与假设

- [推断] AI 摘要在每次用户访问文章详情页时实时生成（非预渲染缓存） — 依据：plan.md 描述"用户打开文章详情页"时触发，且流式输出暗示实时生成
- [推断] AI 问答浮窗支持多轮对话，在当前页面会话内维持上下文 — 依据：plan.md 提到"AI基于当前文章内容回答"，聊天浮窗的常规交互模式支持多轮
- [推断] AI 语义搜索的 embedding 索引在每次 `next build` 时全量重新生成 — 依据：plan.md 说"build时生成所有文章的embedding索引"，且 Contentlayer 的 onSuccess 钩子已有类似的 tag 计数和搜索索引生成逻辑
- [推断] AI 封面图生成后需要手动下载或复制 URL，不自动上传到 GitHub 图床 — 依据：plan.md 在"图片方案"章节将 GitHub 图床作为独立步骤，且图床上传需要 GitHub Token 等额外配置
- [推断] AI 写作助手和自动标签功能仅提供 API 接口，不包含前端管理界面 — 依据：plan.md 对这两项功能描述较简略（"后台写作时手动触发""发布文章时"），且没有具体的 UI 组件规划
- [推断] 站点语言配置为中文博客，AI 输出语言默认为中文 — 依据：plan.md 全文为中文，且面向中文用户群体
- [推断] 使用 OpenAI Node.js SDK 的 `new OpenAI({ baseURL, apiKey })` 方式接入混元兼容接口 — 依据：plan.md 明确标注"OpenAI兼容接口"，这是最标准的接入方式
- [推断] CSP 中 `connect-src *` 已允许所有连接，无需额外修改 `next.config.js` 的 CSP 白名单 — 依据：现有 `next.config.js` 中 `connect-src *` 已覆盖所有域名

### 已决策项（原待确认）

- [已决策] Q1: AI 摘要采用**客户端 localStorage 缓存**。以文章 slug + 文章内容 hash 为 key，缓存摘要结果。首次访问实时生成并缓存，后续访问直接读取缓存。文章内容变更时 hash 变化自动失效。理由：降低 API 费用，提升重复访问体验，实现复杂度适中。
- [已决策] Q2: 封面图生成采用**客户端轮询方案**。`/api/ai/cover` 拆分为两个接口：(1) `/api/ai/cover/submit` 提交生图任务，返回 jobId；(2) `/api/ai/cover/query` 根据 jobId 查询任务状态。前端每 3 秒轮询一次，直到任务完成或超时（最长 120 秒）。理由：规避 Vercel Serverless 超时限制，兼容免费版。
- [已决策] Q3: 站点元数据**保持模板默认值**，不在本次开发范围内配置。理由：站点个性化配置与 AI 功能开发解耦，后续可随时修改。
- [已决策] Q4: 开发优先级按 plan.md 步骤顺序：**摘要 > 问答 > 语义搜索 > 封面图 > 自动标签 > 写作助手**。理由：前三项有前端组件，用户感知强；后三项仅 API，可后续补充。且摘要和问答共享底层 LLM 封装，先做可复用基础设施。

## 验收标准

- AC-1: 当用户打开任意文章详情页时，应该在文章标题下方看到一个 AI 摘要区域，摘要内容以流式逐字出现
- AC-2: 当用户点击文章详情页右下角的浮窗按钮并输入问题时，应该收到基于当前文章内容的 AI 回答，回答以流式方式展示
- AC-3: 当用户在搜索框输入自然语言查询时，应该返回按语义相关度排序的文章列表，结果与查询语义相关而非仅关键词匹配
- AC-4: 当向 `/api/ai/tags` 接口 POST 文章内容时，应该返回一个 JSON 数组，包含 3-5 个与文章内容相关的标签建议
- AC-5: 当向 `/api/ai/cover` 接口 POST 文章标题和摘要时，应该返回一张 1280x720 分辨率的生成图片的 URL
- AC-6: 当向 `/api/ai/writing` 接口 POST 文章片段和操作指令时，应该流式返回润色或续写后的文本内容
- AC-7: 当环境变量 `HUNYUAN_API_KEY` 未配置时，文章详情页应该正常显示文章内容，AI 摘要和问答组件不显示或显示"AI 功能未启用"提示
- AC-8: 当执行 `next build` 后，应该在输出目录中生成包含所有文章 embedding 向量的 JSON 索引文件
- AC-9: 当项目配置了正确的环境变量后，`yarn dev` 启动开发服务器，访问文章页面，AI 摘要功能正常工作（流式输出文本）

## 不在范围内

- GitHub 图床仓库的创建和配置
- 腾讯云 CDN 加速配置
- Vercel 部署配置和自定义域名绑定
- 站点元数据（名称、描述、URL）的个性化配置
- 文章内容的撰写和替换（保留模板示例文章）
- Giscus 评论系统的具体配置（repo ID 等）
- Newsletter 订阅服务的配置
- Google Analytics / Umami 等分析工具的配置
- AI 写作助手和自动标签的前端管理界面（仅提供 API）
