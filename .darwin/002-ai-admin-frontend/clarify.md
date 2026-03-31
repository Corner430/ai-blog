# 需求澄清文档

## 项目概览

- **仓库**：/data/workspace/blog
- **技术栈**：Next.js 15 (App Router), TypeScript, Tailwind CSS 4, MDX (Contentlayer2), React 19, Vercel AI SDK (ai ^6.x, @ai-sdk/openai ^3.x, @ai-sdk/react ^3.x), OpenAI SDK (^6.x), Jest + Testing Library
- **现有模块**：
  - `app/api/ai/` — 7 个 AI API 路由（summary, chat, search, tags, cover/submit, cover/query, writing）
  - `components/ai/` — 3 个前端 AI 组件（AiSummary, AiChat, AiSearch）
  - `lib/` — 3 个封装库（hunyuan.ts, hunyuan-image.ts, embeddings.ts）
  - `layouts/` — 3 个文章布局（PostLayout, PostSimple, PostBanner）
  - `data/blog/` — MDX 文章目录
  - `scripts/` — 构建脚本（postbuild.mjs, generate-embeddings.mjs, rss.mjs）
  - `docs/plan.md` — 项目实施方案文档
  - `.darwin/001-ai-blog-development/` — 第一轮开发的 darwin 产出（clarify, spec, design, tasks, test-report, review-report）

## 原始需求

> 1. AI 封面图生成 — 前端管理界面
>    - 当前状态：API 已完成（/api/ai/cover/submit 和 /api/ai/cover/query），但没有前端界面
>    - 需要：创建一个页面或组件，输入文章标题和摘要，点击按钮生成封面图，显示生成进度（processing），完成后展示图片并提供下载/复制 URL 功能
>    - 注意：生图 API 已从腾讯云 SDK 改为 OpenAI 兼容接口（api.cloudai.tencent.com），使用 HUNYUAN_API_KEY 认证，模型为 HY-Image-V3.0
> 2. AI 自动标签 — 集成到发布流程
>    - 当前状态：API 已完成（/api/ai/tags），但未集成到任何界面
>    - 需要：创建一个 CLI 脚本或管理页面，读取 MDX 文章内容，调用标签 API 获取建议标签，支持一键写入文章 frontmatter
> 3. AI 写作助手 — 前端界面
>    - 当前状态：API 已完成（/api/ai/writing，支持 polish 和 continue），但没有前端界面
>    - 需要：创建一个写作辅助页面（/admin/writing 或类似路径），提供文本输入区域，支持选择"润色"或"续写"操作，流式展示 AI 返回结果
> 4. 更新设计文档
>    - docs/plan.md 和 .darwin/001 中的 design.md 中关于生图的描述需要同步更新（已从 tencentcloud SDK 改为 OpenAI 兼容接口）
> 5. 修复 review-report.md 中的 5 个 Minor 建议
>
> 约束：
>
> - 复用现有的 lib/hunyuan.ts 和 lib/hunyuan-image.ts
> - 保持现有的代码风格和架构（Next.js App Router, TypeScript, Tailwind CSS）
> - 新页面需要有对应的测试
> - 管理类页面不需要对外公开，可以放在 /admin 路径下

## 澄清后的需求

### 功能需求

- FR-1: 创建 `/admin/cover` 页面，包含标题输入框（必填）和摘要输入框（选填），点击"生成封面"按钮后调用 `/api/ai/cover/submit` 提交生成任务，获取 jobId
- FR-2: 封面图生成页面在提交任务后，每 3 秒轮询 `/api/ai/cover/query?jobId=xxx`，在页面上显示当前状态（"生成中..."），生成完成后展示图片预览
- FR-3: 封面图生成完成后，提供两个操作按钮：(a) "下载图片"按钮触发浏览器下载；(b) "复制 URL"按钮将图片 URL 复制到剪贴板并显示复制成功提示
- FR-4: 创建 `/admin/tags` 页面，展示 `data/blog/` 目录下所有 MDX 文章列表（文件名 + 标题 + 现有标签），每篇文章旁有"生成标签"按钮
- FR-5: 标签管理页面点击"生成标签"后，读取该文章 MDX 内容并调用 `/api/ai/tags` 获取建议标签，在界面上展示建议标签列表，支持勾选/取消勾选单个标签
- FR-6: 标签管理页面提供"写入 frontmatter"按钮，将用户选定的标签写入对应 MDX 文件的 frontmatter `tags` 字段（通过新增 API 端点 `/api/admin/tags/write` 实现服务端文件写入）
- FR-7: 创建 `/admin/writing` 页面，包含一个多行文本输入区域，用户可在其中粘贴或输入文章内容
- FR-8: 写作助手页面提供"润色"和"续写"两个操作按钮，点击后调用 `/api/ai/writing`（分别传 action="polish" 和 action="continue"），以流式方式在结果区域逐字展示 AI 返回内容
- FR-9: 写作助手页面的结果区域提供"复制结果"按钮和"替换原文"按钮：复制按钮将 AI 返回的完整文本复制到剪贴板，替换按钮将 AI 结果回填到输入区域（方便迭代操作，如润色后续写）
- FR-10: 更新 `docs/plan.md` 中关于生图的描述：将"生图接口域名：`hunyuan.tencentcloudapi.com`"改为 `api.cloudai.tencent.com`，将"认证方式：腾讯云API 3.0签名"改为"Bearer Token (HUNYUAN_API_KEY)"，将依赖 `tencentcloud-sdk-nodejs-hunyuan` 改为通过 HUNYUAN_API_KEY 认证的 OpenAI 兼容 fetch 调用
- FR-11: 更新 `.darwin/001-ai-blog-development/design.md` 中关于封面图的描述：将 `lib/hunyuan-image.ts` 的职责说明从"TencentCloud SDK wrapper"改为"OpenAI 兼容生图 API 封装 (api.cloudai.tencent.com)"，将 cover/submit 接口的 Auth 说明从"TENCENT_SECRET_ID/KEY"改为"HUNYUAN_API_KEY"，将外部服务域名从 `hunyuan.tencentcloudapi.com` 改为 `api.cloudai.tencent.com`
- FR-12: 移除 `app/api/ai/summary/route.ts` 中未使用的 `getHunyuanClient` import
- FR-13: 消除 4 个 API 路由文件中重复创建 `createOpenAI` 实例的问题，统一使用 `lib/hunyuan.ts` 已导出的 `getHunyuanProvider` 函数
- FR-14: 移除 `components/ai/AiSearch.tsx` 中冗余的 Cmd+K 事件监听器（保留 Escape 处理）
- FR-15: 移除 `lib/embeddings.ts` 中未使用的 `loadEmbeddingIndex` 函数及其关联的 `cachedIndex` 变量
- FR-16: 创建 `/admin` 首页作为管理中心入口，展示三个功能入口卡片（封面图生成、自动标签、写作助手），每个卡片链接到对应的管理页面

### 非功能需求

- NFR-1: 所有 `/admin` 页面仅在开发环境或通过直接 URL 访问时可用，不在公开导航栏中展示链接
- NFR-2: 封面图轮询间隔 3 秒，最大轮询次数 60 次（即最长等待 3 分钟），超时后显示"生成超时，请重试"
- NFR-3: 所有新增管理页面必须有对应的 Jest + Testing Library 单元测试，覆盖主要交互流程
- NFR-4: 管理页面使用与现有组件一致的 Tailwind CSS 类名风格，支持亮色/暗色主题切换（遵循现有 `dark:` 前缀模式）

### 约束条件

- C-1: 复用现有的 `lib/hunyuan.ts`（文本 AI 客户端）和 `lib/hunyuan-image.ts`（生图客户端），不创建新的 AI SDK 封装
- C-2: 遵循 Next.js App Router 约定，管理页面放在 `app/admin/` 目录下，每个页面为 `page.tsx`
- C-3: 使用项目现有测试框架（Jest 30 + @testing-library/react 16 + ts-jest），测试文件放在对应模块的 `__tests__/` 目录下
- C-4: 标签写入 frontmatter 通过服务端 API 完成（`/api/admin/tags/write`），因为浏览器无法直接写入本地文件系统
- C-5: 写作助手的流式渲染使用 Vercel AI SDK 的 `useCompletion` hook（与现有 AiChat 使用 `useChat` 的模式一致）

### 推断与假设

- [推断] `/admin` 路径不需要身份认证保护 — 依据：用户说明"管理类页面不需要对外公开"，结合个人博客场景和现有代码库中无认证机制，推断仅通过不在导航中暴露来隐藏即可
- [推断] 标签写入 frontmatter 使用 Node.js 的 `gray-matter` 库解析和重写 MDX 文件 — 依据：项目已有 `gray-matter` 依赖（package.json 第 28 行），且 MDX 文件的 frontmatter 使用 YAML 格式
- [推断] 封面图下载功能通过创建临时 `<a>` 标签并设置 `download` 属性实现 — 依据：这是浏览器端下载远程图片的标准方式，无需额外服务端代理
- [推断] 标签管理页面通过新增 API `/api/admin/articles` 在服务端读取 `data/blog/` 目录下的 MDX 文件列表和内容 — 依据：浏览器无法直接访问文件系统，需要服务端 API 提供文件读取能力
- [推断] review-report.md 中第 4 条"design.md 指定错误码 500，实现使用 503"已在实现中正确处理（503 是合理偏差），此次仅需更新 design.md 文档与实现保持一致 — 依据：review-report 自身标注为"合理偏差"

### 已确认项（原待确认，已决策）

- [已确认] Q1: 标签写入 frontmatter 采用**替换模式** — 用户在界面上勾选的标签完全替换原有标签。理由：标签管理页面已提供勾选/取消勾选交互，用户选定的就是最终完整列表，替换语义更清晰。
- [已确认] Q2: 封面图生成采用**单任务模式** — 每次只处理一个生成任务，不保留历史记录。理由：个人博客场景下一次生成一张封面图即可，保持界面简洁。
- [已确认] Q3: 写作助手提供**复制 + 替换原文**两个操作 — 结果区域同时提供"复制结果"和"替换原文"按钮，后者将 AI 结果回填到输入区域。理由：支持迭代工作流（润色后继续续写），提升使用连贯性。

## 验收标准

- AC-1: 当用户访问 `/admin` 时，应该看到包含三个功能卡片（封面图生成、自动标签、写作助手）的管理中心首页
- AC-2: 当用户在 `/admin/cover` 页面输入标题并点击"生成封面"时，应该显示"生成中..."状态，并在生成完成后展示图片预览
- AC-3: 当封面图生成完成后，用户点击"下载图片"时，应该触发浏览器下载；点击"复制 URL"时，应该将 URL 写入剪贴板并显示成功提示
- AC-4: 当封面图生成超过 3 分钟未完成时，应该停止轮询并显示"生成超时，请重试"
- AC-5: 当用户访问 `/admin/tags` 页面时，应该看到 `data/blog/` 下所有 MDX 文章的列表，每篇显示文件名、标题和现有标签
- AC-6: 当用户点击某篇文章的"生成标签"按钮时，应该调用 tags API 并在该文章下方展示建议标签，每个标签可勾选/取消勾选
- AC-7: 当用户选定标签并点击"写入 frontmatter"时，应该将选定的标签写入对应 MDX 文件，并在界面上显示成功提示
- AC-8: 当用户在 `/admin/writing` 页面输入文本并点击"润色"或"续写"时，应该在结果区域以流式方式逐字展示 AI 返回的内容
- AC-9: 当写作助手流式输出完成后，用户点击"复制结果"时，应该将完整文本写入剪贴板；点击"替换原文"时，应该将结果回填到输入区域
- AC-10: 当 `docs/plan.md` 和 `.darwin/001-ai-blog-development/design.md` 更新后，文档中关于生图的描述应该反映当前的 OpenAI 兼容接口实现（api.cloudai.tencent.com + HUNYUAN_API_KEY）
- AC-11: 当 review-report.md 中 5 个 Minor 建议全部修复后，相关代码中应该不再存在未使用的 import、重复的实例创建、冗余的事件监听器和未使用的函数
- AC-12: 所有新增的管理页面组件应该有对应的测试文件，且 `yarn jest` 全部通过

## 不在范围内

- 用户认证/鉴权系统（管理页面不做访问控制）
- 将管理页面加入公开导航栏
- 封面图上传到 GitHub 图床的自动化流程（生成后由用户手动处理）
- MDX 文件的在线编辑功能（写作助手仅做润色/续写，不直接编辑文章文件）
- 标签 API 的 prompt 优化或多语言标签支持
- 移动端管理界面的特殊优化（使用响应式布局但不做专门的移动端适配）
