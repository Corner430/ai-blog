<p align="center">
  <a href="README.md">English</a> | <a href="README_zh.md">中文</a>
</p>

# Corner430 AI 博客

一个基于 [Next.js](https://nextjs.org/) 和 [Tailwind CSS](https://tailwindcss.com/) 构建的现代博客，集成了[腾讯混元大模型](https://cloud.tencent.com/document/product/1729) AI 能力。

基于 [tailwind-nextjs-starter-blog](https://github.com/timlrx/tailwind-nextjs-starter-blog) v2 开发。包含 48 篇博文（从 Hexo 迁移并整合为综合指南），以及一套完整的 AI 工具。

## AI 功能

- **AI 摘要** — 自动生成文章摘要，支持流式输出。结果缓存在 localStorage 中（以 `slug + contentHash` 为键），避免重复调用 API。
- **AI 问答** — 文章页面的浮动聊天面板。读者可以就当前文章提问，AI 基于文章内容回答，支持多轮对话。
- **语义搜索** — 替代默认的 KBar 搜索。构建时生成 embedding 索引（`public/embedding-index.json`），运行时通过余弦相似度进行查询匹配。
- **自动标签** — AI 为文章推荐标签，通过管理后台以复选框方式选择，支持直接回写到 frontmatter。
- **封面图生成** — 异步任务模型（提交任务 → 轮询状态 → 预览/下载）。基于混元图像生成 API。
- **写作助手** — AI 驱动的润色和续写功能，支持流式输出、复制和替换到编辑器。

所有 AI 功能在未配置 `HUNYUAN_API_KEY` 时均可优雅降级 — API 返回 `503`，前端组件正常处理错误，不会影响页面。

所有 AI API 端点均受**速率限制**保护（每 IP 每分钟 20 次请求）。详见下方[速率限制](#速率限制)。

## UI 与阅读体验

- **阅读进度条** — 文章页面顶部固定显示滚动进度。
- **浮动目录** — 2xl+ 屏幕侧边栏目录，基于 IntersectionObserver 高亮当前章节。
- **阅读时间与字数** — 在文章列表和文章页面显示（如 "1234 字 · 5 分钟"）。
- **文章置顶** — `sticky` frontmatter 字段，支持将重要文章固定在列表顶部，并显示图钉图标。
- **版权声明** — 每篇文章底部显示 CC BY-NC-SA 4.0 许可声明（中英双语）。
- **页面浏览计数** — 显示来自 Umami 分析 API 的单页浏览量。
- **Live2D 看板娘** — 可切换的动漫角色小部件，从 CDN 加载，状态持久化到 localStorage。
- **点击动画** — 页面任意位置点击时，彩色爱心向上飘浮。
- **图片灯箱** — 基于 medium-zoom 的文章图片点击放大全屏查看。
- **中文本地化** — 所有 UI 文本已翻译为中文（zh-CN），涵盖布局、导航和组件。
- **资源页面** — 按分类整理的精选学习资源（通过导航栏 `/resources` 访问）。
- **项目展示** — 项目卡片包含封面图、描述和 GitHub 链接（`/projects`）。

## 写作博文

在 `data/blog/` 下创建 `.mdx` 文件：

```mdx
---
title: '我的文章标题'
date: '2026-03-24'
tags: ['javascript', 'ai']
draft: false
summary: '在列表页显示的简短描述。'
sticky: 1
---

在此编写文章内容。支持标准 Markdown 和嵌入式 React 组件 (MDX)。
```

| 字段      | 说明                                                               |
| --------- | ------------------------------------------------------------------ |
| `title`   | 文章标题                                                           |
| `date`    | 发布日期（决定排序顺序）                                           |
| `tags`    | 标签数组（也可通过 `/admin/tags` 由 AI 生成）                      |
| `draft`   | 设为 `true` 则在生产环境中隐藏                                     |
| `summary` | 文章列表页的简短描述                                               |
| `sticky`  | 置顶顺序（数字越小优先级越高，如 `1` 排在 `2` 前面）；省略则不置顶 |

写完后，`git push` 到 `main` 分支，Vercel 会自动部署。

## 管理后台

通过直接访问 URL 进入 `/admin`（如 `http://localhost:3000/admin` 或 `https://your-site.vercel.app/admin`）。该入口不在公开导航栏中显示。

- **封面图生成** (`/admin/cover`) — 输入标题和摘要，提交生成任务，轮询进度，预览结果，下载图片或复制 URL。
- **自动标签** (`/admin/tags`) — 浏览文章列表，生成 AI 标签建议，选择/取消标签，将所选标签写入 MDX frontmatter。
- **写作助手** (`/admin/writing`) — 输入文本，选择润色或续写，查看流式结果，复制或替换回编辑器。

## 技术栈

| 层级     | 技术                         | 备注                                   |
| -------- | ---------------------------- | -------------------------------------- |
| 框架     | Next.js 15 (App Router)      | React Server Components                |
| 语言     | TypeScript                   | 类型安全                               |
| 样式     | Tailwind CSS 4               | 深色/浅色主题支持                      |
| 内容     | MDX + Contentlayer           | Markdown 嵌入 React 组件               |
| AI 文本  | 腾讯混元（OpenAI 兼容）      | `ai` v6 (Vercel AI SDK) + `openai` v6  |
| AI 图像  | 混元图像生成（OpenAI 兼容）  | 异步任务式 API                         |
| 速率限制 | 内存级 per-IP 限流           | 所有 AI 端点 20 次/分钟                |
| E2E 测试 | Playwright                   | 16 个测试文件，`page.route()` API mock |
| 单元测试 | Jest + React Testing Library | 30 个测试套件，146 个测试用例          |
| CI       | GitHub Actions               | Lint + Build + Jest                    |
| 部署     | Vercel                       | Git push 自动部署                      |
| 评论     | Giscus                       | 基于 GitHub Discussions                |
| 分析     | Umami                        | 页面浏览追踪与计数显示                 |

## 项目结构

```
app/
├── api/
│   ├── ai/
│   │   ├── summary/route.ts       # AI 摘要（流式）
│   │   ├── chat/route.ts          # AI 问答（流式）
│   │   ├── search/route.ts        # 语义搜索
│   │   ├── tags/route.ts          # 自动标签生成
│   │   ├── cover/submit/route.ts  # 封面图任务提交
│   │   ├── cover/query/route.ts   # 封面图任务轮询
│   │   └── writing/route.ts       # 写作助手（流式）
│   ├── admin/
│   │   ├── articles/route.ts      # 从 data/blog/ 读取文章列表
│   │   ├── cover/write/route.ts   # 写入封面图到 public/
│   │   ├── login/route.ts         # 管理后台认证
│   │   └── tags/write/route.ts    # 写入标签到 MDX frontmatter
│   ├── pageviews/route.ts         # Umami 页面浏览代理
│   └── newsletter/route.ts        # 邮件订阅
├── admin/
│   ├── page.tsx                   # 管理后台首页
│   ├── cover/page.tsx             # 封面图管理
│   ├── tags/page.tsx              # 标签管理
│   └── writing/page.tsx           # 写作助手
├── resources/
│   └── page.tsx                   # 精选学习资源页面
components/
├── ai/
│   ├── AiSummary.tsx              # 流式摘要（含 localStorage 缓存）
│   ├── AiChat.tsx                 # 浮动问答面板
│   └── AiSearch.tsx               # 语义搜索弹窗
├── ReadingProgressBar.tsx         # 滚动进度条
├── FloatingTOC.tsx                # 浮动目录侧边栏
├── CopyrightDeclaration.tsx       # CC BY-NC-SA 4.0 版权声明
├── PageViewCounter.tsx            # Umami 页面浏览显示
├── Live2DWidget.tsx               # Live2D 看板娘
├── ImageZoom.tsx                   # 图片点击放大灯箱（medium-zoom）
├── ClickAnimation.tsx             # 点击爱心动画
├── ClientGlobalWidgets.tsx        # 客户端小部件容器（Live2D + ClickAnimation）
data/
├── resourcesData.ts               # 精选资源数据（按分类）
└── projectsData.ts                # 项目展示数据
lib/
├── hunyuan.ts                     # 混元文本 API 封装（OpenAI SDK）
├── hunyuan-image.ts               # 混元图像 API 封装（OpenAI 兼容）
├── embeddings.ts                  # Embedding 索引和余弦相似度工具
├── rate-limit.ts                  # 内存级 API 路由限流器
└── utils.ts                       # 工具函数（sortPostsWithSticky 等）
scripts/
├── generate-embeddings.mjs        # 构建时 embedding 索引生成
├── migrate-hexo.mjs               # Hexo → MDX 迁移脚本（HTML→Markdown via turndown）
├── postbuild.mjs                  # 构建后处理
└── rss.mjs                        # RSS 订阅生成
docs/
└── setup-guide.md                 # 统一配置指南（Giscus、Umami、GitHub Token）
e2e/
├── helpers/mock-api.ts            # 共享 API mock 工具
└── *.spec.ts                      # 16 个 E2E 测试文件
```

## API 路由

| 方法 | 端点                         | 说明                                       |
| ---- | ---------------------------- | ------------------------------------------ |
| POST | `/api/ai/summary`            | 生成文章摘要（流式）                       |
| POST | `/api/ai/chat`               | 文章问答，支持对话历史（流式）             |
| POST | `/api/ai/search`             | 通过 embedding 余弦相似度进行语义搜索      |
| POST | `/api/ai/tags`               | 为文章内容生成标签建议                     |
| POST | `/api/ai/cover/submit`       | 提交封面图生成任务，返回 `jobId`           |
| GET  | `/api/ai/cover/query?jobId=` | 轮询封面图任务状态                         |
| POST | `/api/ai/writing`            | 润色或续写文章文本（流式）                 |
| GET  | `/api/admin/articles`        | 列出所有 MDX 文章（含 frontmatter 和内容） |
| POST | `/api/admin/tags/write`      | 将标签写入 MDX 文件的 frontmatter          |
| POST | `/api/admin/cover/write`     | 将封面图文件写入 public 目录               |
| POST | `/api/admin/login`           | 管理后台认证                               |
| GET  | `/api/pageviews`             | 代理 Umami 分析 API 获取页面浏览量         |

## 速率限制

所有 7 个 AI API 端点（`/api/ai/*`）均受内存级速率限制器保护：

- **限制**：每 IP 每分钟 20 次请求
- **超限响应**：HTTP `429 Too Many Requests`，附带 `Retry-After` 头
- **实现**：`lib/rate-limit.ts` — 轻量级，无外部依赖

## 快速开始

### 1. 安装依赖

```bash
yarn install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

详细配置说明请参阅 [`docs/setup-guide.md`](docs/setup-guide.md)，涵盖：

- **混元 API Key** — 所有 AI 功能所需（文本、图像、embedding）
- **Giscus 评论** — 基于 GitHub Discussions 的评论系统
- **Umami 分析** — 页面浏览追踪与计数显示
- **GitHub Token** — 用于封面图回写

AI 功能无需配置即可运行 — 仅优雅降级（返回 503）。

### 3. 启动开发服务器

```bash
yarn dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## 博客迁移

博文最初从旧的 Hexo 博客（[corner430.github.io](https://github.com/corner430/corner430.github.io)）使用 `scripts/migrate-hexo.mjs` 迁移而来：

- 通过 [turndown](https://github.com/mixmark-io/turndown) 将 Hexo HTML 转换为 Markdown
- 将 Hexo frontmatter 转换为 MDX 格式（标签、置顶、日期规范化）
- 将文章关联图片复制到 `public/static/images/blog/`

迁移后，38 篇碎片化文章被整合为 13 篇综合指南，并移除了低价值文章，最终共计 48 篇。

## 部署

仓库已连接 [Vercel](https://vercel.com/)。每次推送到 `main` 分支都会自动触发生产环境部署。

在 Vercel 项目设置中配置环境变量（参见 [`docs/setup-guide.md`](docs/setup-guide.md)）以在生产环境启用所有功能。

## CI

GitHub Actions（`.github/workflows/ci.yml`）在每次推送和 Pull Request 时运行：

1. **Lint** — `yarn lint`
2. **构建** — `yarn build`
3. **单元测试** — `npx jest`

## 测试

### 单元测试 (Jest)

```bash
npx jest
```

30 个测试套件共 146 个测试用例，覆盖 lib 工具函数、API 路由和 React 组件。

### E2E 测试 (Playwright)

```bash
npx playwright install   # 仅首次需要
yarn e2e
```

16 个测试文件共 63 个测试用例，覆盖所有页面和交互。AI API 通过 `page.route()` 进行 mock — E2E 测试无需真实 API Key。

## 构建

```bash
yarn build
```

构建流程包含：

1. Next.js 生产构建（含 Contentlayer）
2. 构建后处理（`scripts/postbuild.mjs`）
3. Embedding 索引生成（`scripts/generate-embeddings.mjs`）— 未设置 `HUNYUAN_API_KEY` 时自动跳过

## 许可证

[MIT](LICENSE)
