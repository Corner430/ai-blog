# 需求澄清文档

## 项目概览

- **仓库**：/data/workspace/blog
- **技术栈**：Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, MDX (Contentlayer2), AI SDK (@ai-sdk/openai + @ai-sdk/react), Tencent Hunyuan AI (OpenAI-compatible), Jest (已有单元测试)
- **现有模块**：
  - `app/` — 页面路由 (首页、博客列表、博客详情、标签、项目、关于、管理后台、API 路由)
  - `components/` — UI 组件 (Header, MobileNav, ThemeSwitch, SearchButton, AiChat, AiSearch, AiSummary, ScrollTopAndComment 等)
  - `layouts/` — 页面布局 (PostLayout, ListLayout, ListLayoutWithTags, AuthorLayout 等)
  - `lib/` — 工具函数
  - `data/` — 站点配置、导航数据、文章内容

## 原始需求

> 帮我配置Playwright并写几个E2E测试，不仅仅是这些，是所有的交互逻辑，所有的点击，都要测，来决定是否符合预期

## 澄清后的需求

### 功能需求

- FR-1: 配置 Playwright 测试框架，包括安装依赖、创建 `playwright.config.ts`，配置 `webServer` 自动启动 Next.js 开发服务器
- FR-2: 为首页编写 E2E 测试：验证页面加载、文章列表渲染、"Read more" 链接点击跳转、"All Posts" 链接跳转
- FR-3: 为 Header 导航编写 E2E 测试：验证 Home/Blog/Tags/Projects/About 五个导航链接的点击跳转
- FR-4: 为移动端导航 (MobileNav) 编写 E2E 测试：验证汉堡菜单按钮点击打开侧边栏、侧边栏内导航链接点击跳转并关闭侧边栏、关闭按钮点击关闭侧边栏
- FR-5: 为搜索功能编写 E2E 测试：验证搜索按钮点击打开搜索弹窗、输入关键词显示搜索结果、点击结果跳转到对应文章、ESC 键关闭弹窗、Ctrl/Cmd+K 快捷键打开搜索
- FR-6: 为主题切换 (ThemeSwitch) 编写 E2E 测试：验证主题按钮点击弹出菜单、选择 Light/Dark/System 主题切换生效
- FR-7: 为博客列表页编写 E2E 测试：验证搜索过滤输入框的文章过滤功能、分页 Previous/Next 点击跳转、文章标题点击跳转、Tag 点击跳转
- FR-8: 为博客详情页编写 E2E 测试：验证页面加载显示文章标题和内容、AI 摘要组件渲染、AI 问答按钮点击展开聊天面板、上一篇/下一篇链接点击跳转、Tag 点击跳转、"Back to the blog" 链接点击
- FR-9: 为 AI 问答 (AiChat) 编写 E2E 测试：验证浮动按钮点击打开/关闭聊天面板、输入问题并发送（mock API 响应）、消息列表渲染用户和 AI 消息、关闭按钮关闭面板、加载状态和错误状态处理
- FR-10: 为 AI 搜索 (AiSearch) 编写 E2E 测试：验证搜索输入后触发 debounce 搜索（mock API）、搜索中状态显示、结果列表渲染、无结果状态显示、点击结果关闭弹窗并跳转
- FR-11: 为 AI 摘要 (AiSummary) 编写 E2E 测试：验证组件加载时的 loading 骨架屏、AI 摘要流式完成后内容展示（mock API）、缓存命中时直接显示
- FR-12: 为标签页面编写 E2E 测试：验证标签列表渲染、标签点击跳转到对应标签的文章列表
- FR-13: 为管理后台首页编写 E2E 测试：验证三个功能卡片（封面图生成、自动标签、写作助手）的渲染和点击跳转
- FR-14: 为封面图生成页编写 E2E 测试：验证标题输入、摘要输入、生成按钮点击提交（mock API）、加载状态显示、生成完成后图片预览、下载按钮和复制 URL 按钮的交互
- FR-15: 为自动标签页编写 E2E 测试：验证文章列表加载（mock API）、生成标签按钮点击（mock API）、标签复选框勾选/取消、写入 frontmatter 按钮点击（mock API）、成功/错误状态显示
- FR-16: 为写作助手页编写 E2E 测试：验证文本输入、润色按钮和续写按钮的点击提交（mock API）、AI 结果区域渲染、复制结果按钮点击、替换原文按钮点击将结果回填到输入框
- FR-17: 为 ScrollTopAndComment 组件编写 E2E 测试：验证页面滚动后出现回到顶部按钮、点击后滚动到顶部
- FR-18: 为 404 页面编写 E2E 测试：验证访问不存在的路径显示 404 页面内容

### 非功能需求

- NFR-1: 所有涉及外部 AI API 调用的测试必须通过 Playwright 的 `page.route()` 拦截 mock，不依赖真实 AI 服务，保证测试稳定性和可重复性
- NFR-2: 移动端交互测试通过 Playwright 的 viewport 配置模拟移动设备（如 iPhone 12 的 390x844），桌面端测试使用默认 1280x720
- NFR-3: 测试文件组织遵循 `e2e/` 目录结构，按功能模块分文件（如 `e2e/homepage.spec.ts`, `e2e/ai-chat.spec.ts`）

### 约束条件

- C-1: 使用 Playwright Test Runner（@playwright/test），不使用 Cypress 或其他框架
- C-2: 测试运行依赖 `next dev` 服务器启动，通过 Playwright 的 `webServer` 配置自动管理
- C-3: 项目使用 yarn 3.6.1 作为包管理器，安装和执行命令必须使用 yarn
- C-4: 不修改任何现有源代码，仅新增 Playwright 配置和测试文件

### 推断与假设

- [推断] AI 相关功能（AiChat, AiSearch, AiSummary）的 E2E 测试通过 mock API 响应实现，而非启用真实 AI 服务 — 依据：环境变量 `NEXT_PUBLIC_AI_ENABLED` 控制 AI 功能开关，且真实 AI API 调用不稳定、有成本，不适合自动化测试
- [推断] 测试仅覆盖 Chromium 单浏览器，不跨浏览器测试 — 依据：这是开发阶段的功能验证测试，非跨浏览器兼容性测试，且多浏览器测试会显著增加 CI 时间
- [推断] 博客文章数据使用项目已有的 MDX 文章（data/blog 目录下的文件），不创建专门的测试 fixture 文章 — 依据：现有文章足以验证交互逻辑，创建额外文件增加维护负担
- [推断] Playwright 浏览器依赖通过 `npx playwright install chromium` 安装，不安装全部浏览器 — 依据：仅测试 Chromium 即可满足功能验证需求

### 待确认项

- [待确认] Q1: 移动端 MobileNav 测试是否需要作为独立测试文件？还是合并到导航测试中通过 viewport 切换覆盖？（推荐：独立文件，通过 `test.use({ viewport })` 设置移动端 viewport）
- [待确认] Q2: 是否需要在 `package.json` 中添加 `e2e` 脚本命令（如 `"e2e": "playwright test"`），还是仅通过 `npx playwright test` 执行？

## 验收标准

- AC-1: 当运行 `npx playwright test` 时，应该所有测试用例通过，退出码为 0
- AC-2: 当访问首页时，应该能看到文章列表，点击 "Read more" 跳转到文章详情页
- AC-3: 当点击 Header 中的导航链接时，应该跳转到对应的页面（Blog -> /blog, Tags -> /tags 等）
- AC-4: 当在移动端视口下点击汉堡菜单时，应该展开侧边导航；点击导航链接后应该关闭侧边栏并跳转
- AC-5: 当点击搜索按钮或按 Ctrl+K 时，应该打开搜索弹窗；输入关键词后应该显示搜索结果
- AC-6: 当在博客详情页点击 AI 问答按钮时，应该展开聊天面板；输入问题后应该显示 AI 响应（mock）
- AC-7: 当在博客详情页加载时，AI 摘要组件应该先显示 loading 状态，然后显示摘要内容（mock）
- AC-8: 当在管理后台封面图生成页输入标题并点击生成时，应该显示加载状态，完成后显示图片预览（mock）
- AC-9: 当在管理后台写作助手页输入文本并点击润色时，应该显示 AI 结果；点击替换原文应该将结果回填到输入框
- AC-10: 当在管理后台自动标签页点击生成标签时，应该显示建议标签列表（mock）；勾选后点击写入应该显示成功状态
- AC-11: 当访问不存在的路径时，应该显示 404 页面

## 不在范围内

- 跨浏览器测试（Firefox、WebKit）
- 视觉回归测试 / 截图对比
- 性能测试 / Core Web Vitals 测试
- 真实 AI API 集成测试
- CI/CD 配置（GitHub Actions 等）
- 可访问性（a11y）专项测试
- 修改现有源代码或组件
