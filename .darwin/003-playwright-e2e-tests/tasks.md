# 任务列表

> 基于 spec.md 和 design.md 生成。使用 darwin-implement 执行。

## 概览

| 统计        | 值  |
| ----------- | --- |
| 总 Task 数  | 20  |
| 可并行 Task | 16  |
| Phase 数    | 3   |

---

## Phase 1: 基础设施

### Task 1: 安装 Playwright 依赖并配置项目

- **文件**:
  - 修改: `package.json`
  - 修改: `.gitignore`
- **关联**: FR-1（Playwright 框架配置）
- **关联 DR**: DR-5（添加 e2e 脚本命令）
- **前置依赖**: 无
- **步骤**:
  - [x] 1. 使用 yarn 安装 `@playwright/test` 到 devDependencies
  - [x] 2. 在 `package.json` 的 scripts 中添加 `"e2e": "playwright test"`
  - [x] 3. 在 `.gitignore` 中添加 `test-results/`、`playwright-report/`、`/blob-report/`
  - [x] 4. 安装 Chromium 浏览器：`npx playwright install chromium`
  - [x] 5. **验证** — 运行 `yarn e2e --version` 确认 Playwright 已安装
    ```bash
    yarn e2e --version
    # 期望：输出 Playwright 版本号
    ```
  - [x] 6. **COMMIT**
    ```bash
    git add . && git commit -m "chore: install playwright and configure project"
    ```

### Task 2: 创建 Playwright 配置文件

- **文件**:
  - 新建: `playwright.config.ts`
- **关联 Scenario**: "测试框架安装和配置成功", "开发服务器未启动时测试自动等待"
- **关联 DR**: DR-3（移动端独立文件）
- **前置依赖**: Task 1
- **步骤**:
  - [x] 1. **RED** — 创建最小配置，运行 `yarn e2e` 确认无测试但框架正常
    ```bash
    yarn e2e
    # 期望：No tests found，exit code 0 或非错误退出
    ```
  - [x] 2. **GREEN** — 编写完整 `playwright.config.ts`，包含：
    - `testDir: './e2e'`
    - `webServer` 配置：`command: 'yarn dev'`, `url: 'http://localhost:3000'`, `timeout: 120000`, `reuseExistingServer: true`
    - `projects` 配置：Chromium 桌面端（默认 1280x720）
    - `use.baseURL: 'http://localhost:3000'`
  - [x] 3. **Verify GREEN** — 运行 `yarn e2e` 确认配置无语法错误
    ```bash
    yarn e2e
    # 期望：正常退出，无配置错误
    ```
  - [x] 4. **REFACTOR** — 审查配置，确保 timeout、retries 等设置合理
  - [x] 5. **COMMIT**
    ```bash
    git add . && git commit -m "chore: add playwright.config.ts with webServer and project config"
    ```

### Task 3: 创建共享 API Mock 工具

- **文件**:
  - 新建: `e2e/helpers/mock-api.ts`
- **关联 Scenario**: "所有 AI 接口测试通过 mock 执行"
- **关联 DR**: DR-1（page.route mock）, DR-4（AI SDK streaming mock 格式）
- **前置依赖**: Task 2
- **步骤**:
  - [x] 1. **RED** — 创建空的 mock-api.ts 并 export 占位函数，在一个临时测试中 import 确认路径可解析
  - [x] 2. **GREEN** — 实现以下 mock 工具函数：
    - `mockChatStream(page, responseText)` — 拦截 `/api/ai/chat`，返回 AI SDK Data Stream Protocol 格式（`0:"text"\n`）
    - `mockTextStream(page, url, responseText)` — 拦截指定 URL，返回纯文本流
    - `mockJsonResponse(page, url, data, status?)` — 拦截指定 URL，返回 JSON
    - `mockErrorResponse(page, url, status, error)` — 拦截指定 URL，返回错误响应
    - `mockAdminArticles(page, articles)` — 拦截 `/api/admin/articles`
    - `mockCoverSubmit(page, jobId)` — 拦截 `/api/ai/cover/submit`
    - `mockCoverQuery(page, status, imageUrl?)` — 拦截 `/api/ai/cover/query`
  - [x] 3. **Verify GREEN** — 检查 TypeScript 编译无错误
  - [x] 4. **REFACTOR** — 确保所有函数有明确的参数类型
  - [x] 5. **COMMIT**
    ```bash
    git add . && git commit -m "feat: add shared API mock helpers for E2E tests"
    ```

---

## Phase 2: 页面交互测试（基础页面）

### Task 4: 首页 E2E 测试

- **文件**:
  - 新建: `e2e/homepage.spec.ts`
- **关联 Scenario**: "首页加载显示文章列表", "点击 Read more 跳转到文章详情页", "点击 All Posts 跳转到博客列表页", "首页无文章时显示空状态"
- **前置依赖**: Task 2
- **步骤**:
  - [x] 1. **RED** — 编写测试：访问首页验证 "Latest" 标题可见、文章列表存在、"Read more" 链接点击跳转到 /blog/
  - [x] 2. **Verify RED** — 运行 `yarn e2e e2e/homepage.spec.ts`，确认测试因断言失败而非配置错误
  - [x] 3. **GREEN** — 调整断言使测试通过（测试的是已有页面，应直接通过）
  - [x] 4. **Verify GREEN** — 运行测试确认全部通过
    ```bash
    yarn e2e e2e/homepage.spec.ts
    # 期望：所有测试 PASS
    ```
  - [x] 5. **REFACTOR** — 提取重复的 locator，添加有意义的 test.describe 分组
  - [x] 6. **COMMIT**
    ```bash
    git add . && git commit -m "test(e2e): add homepage interaction tests"
    ```

### Task 5: Header 桌面端导航 E2E 测试

- **文件**:
  - 新建: `e2e/navigation.spec.ts`
- **关联 Scenario**: "点击导航链接跳转到对应页面", "逐一验证所有导航链接跳转", "导航链接在小屏幕下隐藏"
- **前置依赖**: Task 2
- **步骤**:
  - [x] 1. **RED** — 编写测试：验证 Blog/Tags/Projects/About 导航链接的可见性和点击跳转
  - [x] 2. **Verify RED** — 运行测试确认失败原因正确
  - [x] 3. **GREEN** — 调整选择器和断言使测试通过
  - [x] 4. **Verify GREEN** — 运行 `yarn e2e e2e/navigation.spec.ts`
  - [x] 5. **REFACTOR** — 使用参数化测试（`test.each` 风格的循环）减少重复
  - [x] 6. **COMMIT**
    ```bash
    git add . && git commit -m "test(e2e): add desktop navigation tests"
    ```

### Task 6: 移动端导航 E2E 测试

- **文件**:
  - 新建: `e2e/mobile-nav.spec.ts`
- **关联 Scenario**: "打开移动端侧边导航", "通过侧边导航跳转并自动关闭", "点击关闭按钮关闭侧边导航", "移动端测试使用移动设备视口"
- **关联 DR**: DR-3（移动端独立文件）
- **前置依赖**: Task 2
- **步骤**:
  - [x] 1. **RED** — 编写测试，配置 `test.use({ viewport: { width: 390, height: 844 } })`。验证：汉堡菜单按钮可见、点击展开侧边栏、侧边栏导航链接可见、点击链接跳转并关闭、X 按钮关闭
  - [x] 2. **Verify RED** — 运行 `yarn e2e e2e/mobile-nav.spec.ts`
  - [x] 3. **GREEN** — 调整选择器使测试通过（注意 HeadlessUI Dialog 的动画需等待）
  - [x] 4. **Verify GREEN** — 确认全部通过
  - [x] 5. **REFACTOR** — 审查等待策略，确保不依赖 hardcoded delay
  - [x] 6. **COMMIT**
    ```bash
    git add . && git commit -m "test(e2e): add mobile navigation tests"
    ```

### Task 7: 搜索功能 E2E 测试

- **文件**:
  - 新建: `e2e/search.spec.ts`
- **关联 Scenario**: "点击搜索按钮打开搜索弹窗", "使用键盘快捷键打开搜索弹窗", "输入关键词显示搜索结果", "点击搜索结果跳转到对应文章", "ESC 键关闭搜索弹窗", "搜索无结果时显示空状态", "输入搜索词触发 AI 搜索并显示结果", "AI 搜索进行中显示加载状态", "AI 搜索接口异常时回退到关键词搜索", "AI 搜索无匹配结果"
- **前置依赖**: Task 3
- **步骤**:
  - [x] 1. **RED** — 编写测试：搜索按钮点击打开弹窗、Ctrl+K 快捷键、输入关键词（fallback 关键词搜索）、ESC 关闭。编写 AI 搜索部分：mock `/api/ai/search` 返回结果、mock 空结果、mock 错误回退
  - [x] 2. **Verify RED** — 运行 `yarn e2e e2e/search.spec.ts`
  - [x] 3. **GREEN** — 调整选择器和 mock 使测试通过。注意 debounce 延迟需等待
  - [x] 4. **Verify GREEN** — 确认全部通过
  - [x] 5. **REFACTOR** — 提取搜索弹窗 locator 为常量
  - [x] 6. **COMMIT**
    ```bash
    git add . && git commit -m "test(e2e): add search and AI search tests"
    ```

### Task 8: 主题切换 E2E 测试

- **文件**:
  - 新建: `e2e/theme-switch.spec.ts`
- **关联 Scenario**: "点击主题按钮弹出选择菜单", "切换到深色主题", "切换到浅色主题"
- **前置依赖**: Task 2
- **步骤**:
  - [x] 1. **RED** — 编写测试：点击主题按钮展开菜单、选择 Dark 后 html 元素有 `class="dark"`、选择 Light 后恢复
  - [x] 2. **Verify RED** — 运行测试
  - [x] 3. **GREEN** — 调整选择器，注意 HeadlessUI Menu 的 transition
  - [x] 4. **Verify GREEN** — 确认通过
  - [x] 5. **REFACTOR** — 审查 theme 断言的稳定性
  - [x] 6. **COMMIT**
    ```bash
    git add . && git commit -m "test(e2e): add theme switch tests"
    ```

### Task 9: 博客列表页 E2E 测试

- **文件**:
  - 新建: `e2e/blog-list.spec.ts`
- **关联 Scenario**: "搜索过滤文章", "搜索无匹配文章时显示空状态", "点击文章标题跳转到详情页", "点击标签跳转到标签过滤页"
- **前置依赖**: Task 2
- **步骤**:
  - [x] 1. **RED** — 编写测试：访问 /blog，验证搜索输入框存在、输入关键词过滤文章、输入无效词显示 "No posts found."、点击文章标题跳转、点击标签跳转到 /tags/
  - [x] 2. **Verify RED** — 运行测试
  - [x] 3. **GREEN** — 调整断言
  - [x] 4. **Verify GREEN** — 确认通过
  - [x] 5. **REFACTOR** — 组织 describe 块
  - [x] 6. **COMMIT**
    ```bash
    git add . && git commit -m "test(e2e): add blog list page tests"
    ```

### Task 10: 博客详情页 E2E 测试

- **文件**:
  - 新建: `e2e/blog-post.spec.ts`
- **关联 Scenario**: "文章详情页正常加载", "点击 Back to the blog 返回博客列表", "点击文章标签跳转", "文章不存在时显示 404"
- **前置依赖**: Task 2
- **步骤**:
  - [x] 1. **RED** — 编写测试：访问 /blog/hello-world 验证标题、日期、正文内容可见；点击 "Back to the blog" 跳转；点击标签跳转；访问 /blog/nonexistent 显示 404
  - [x] 2. **Verify RED** — 运行测试
  - [x] 3. **GREEN** — 调整选择器和断言
  - [x] 4. **Verify GREEN** — 确认通过
  - [x] 5. **REFACTOR** — 审查 URL 断言的稳定性（trailing slash）
  - [x] 6. **COMMIT**
    ```bash
    git add . && git commit -m "test(e2e): add blog post page tests"
    ```

### Task 11: 标签页 E2E 测试

- **文件**:
  - 新建: `e2e/tags-page.spec.ts`
- **关联 Scenario**: "标签页正常加载显示标签列表", "点击标签跳转到标签文章列表"
- **前置依赖**: Task 2
- **步骤**:
  - [x] 1. **RED** — 编写测试：访问 /tags 验证 "Tags" 标题、标签列表可见、点击标签跳转到对应文章列表
  - [x] 2. **Verify RED** — 运行测试
  - [x] 3. **GREEN** — 调整断言
  - [x] 4. **Verify GREEN** — 确认通过
  - [x] 5. **REFACTOR** — 审查标签 locator
  - [x] 6. **COMMIT**
    ```bash
    git add . && git commit -m "test(e2e): add tags page tests"
    ```

### Task 12: 404 页面 E2E 测试

- **文件**:
  - 新建: `e2e/not-found.spec.ts`
- **关联 Scenario**: "访问不存在的路径显示 404 页面", "404 页面的返回首页链接可用"
- **前置依赖**: Task 2
- **步骤**:
  - [x] 1. **RED** — 编写测试：访问 /this-page-does-not-exist 验证 "404" 文本、错误提示文本、"Back to homepage" 链接点击跳转到首页
  - [x] 2. **Verify RED** — 运行测试
  - [x] 3. **GREEN** — 调整断言
  - [x] 4. **Verify GREEN** — 确认通过
  - [x] 5. **REFACTOR** — 审查 404 响应检测
  - [x] 6. **COMMIT**
    ```bash
    git add . && git commit -m "test(e2e): add 404 page tests"
    ```

### Task 13: 滚动回顶 E2E 测试

- **文件**:
  - 新建: `e2e/scroll-top.spec.ts`
- **关联 Scenario**: "页面滚动后显示回到顶部按钮", "点击回到顶部按钮回到页面顶部", "页面未滚动时按钮不显示"
- **前置依赖**: Task 2
- **步骤**:
  - [x] 1. **RED** — 编写测试：访问文章详情页（/blog/hello-world），验证初始时回顶按钮不可见、向下滚动 200px 后按钮出现、点击后 scrollY 回到 0
  - [x] 2. **Verify RED** — 运行测试
  - [x] 3. **GREEN** — 调整选择器和滚动触发方式（`page.evaluate` + `window.scrollTo`）
  - [x] 4. **Verify GREEN** — 确认通过
  - [x] 5. **REFACTOR** — 确保等待策略覆盖按钮显示动画
  - [x] 6. **COMMIT**
    ```bash
    git add . && git commit -m "test(e2e): add scroll-to-top tests"
    ```

---

## Phase 3: AI 功能与管理后台测试

### Task 14: AI 问答 E2E 测试

- **文件**:
  - 新建: `e2e/ai-chat.spec.ts`
- **关联 Scenario**: "打开 AI 问答面板", "发送问题并收到 AI 回复", "关闭 AI 问答面板", "通过面板内关闭按钮关闭", "AI 接口异常时显示错误并可重试", "发送按钮在加载中禁用"
- **关联 DR**: DR-4（streaming mock 格式）
- **前置依赖**: Task 3
- **步骤**:
  - [x] 1. **RED** — 编写测试：
    - 使用 `mockChatStream` 拦截 `/api/chat` (AI SDK v6 default transport URL)
    - 验证 `[data-testid="ai-chat-toggle"]` 点击打开面板
    - 面板显示 "AI 问答助手" 和 "针对这篇文章提问吧"
    - 输入问题、点击发送、用户消息和 AI 回复出现
    - 再次点击 toggle 关闭面板
    - 面板内 X 关闭按钮关闭面板
    - mock 错误时显示 "服务异常，请重试" 和重试按钮
  - [x] 2. **Verify RED** — 运行 `yarn e2e e2e/ai-chat.spec.ts`
  - [x] 3. **GREEN** — 调整 mock 响应格式和选择器使测试通过
  - [x] 4. **Verify GREEN** — 确认全部通过
  - [x] 5. **REFACTOR** — 提取 chat panel locator 为变量
  - [x] 6. **COMMIT**
    ```bash
    git add . && git commit -m "test(e2e): add AI chat interaction tests"
    ```

### Task 15: AI 摘要 E2E 测试

- **文件**:
  - 新建: `e2e/ai-summary.spec.ts`
- **关联 Scenario**: "文章加载时显示摘要加载状态", "AI 摘要生成完成后显示内容", "AI 摘要接口异常时显示错误"
- **关联 DR**: DR-4（streaming mock 格式）
- **前置依赖**: Task 3
- **步骤**:
  - [x] 1. **RED** — 编写测试：
    - 使用 `mockTextStream` 拦截 `/api/ai/summary`
    - 访问文章详情页，验证 `[data-testid="ai-summary"]` 存在
    - 验证 "AI 摘要" 标签可见
    - 加载完成后显示摘要文本
    - mock 错误时显示 "AI 摘要生成失败" 错误信息
  - [x] 2. **Verify RED** — 运行测试
  - [x] 3. **GREEN** — 调整 mock 和断言
  - [x] 4. **Verify GREEN** — 确认通过
  - [x] 5. **REFACTOR** — 处理 localStorage 缓存对测试的影响（每个测试清理 localStorage）
  - [x] 6. **COMMIT**
    ```bash
    git add . && git commit -m "test(e2e): add AI summary tests"
    ```

### Task 16: 管理后台首页 E2E 测试

- **文件**:
  - 新建: `e2e/admin.spec.ts`
- **关联 Scenario**: "管理后台显示功能入口", "点击功能卡片跳转到对应页面", "逐一验证所有功能卡片跳转"
- **前置依赖**: Task 2
- **步骤**:
  - [x] 1. **RED** — 编写测试：访问 /admin 验证 "管理中心" 标题、三个功能卡片（封面图生成、自动标签、写作助手）可见、逐一点击跳转到 /admin/cover、/admin/tags、/admin/writing
  - [x] 2. **Verify RED** — 运行测试
  - [x] 3. **GREEN** — 调整选择器和 URL 断言
  - [x] 4. **Verify GREEN** — 确认通过
  - [x] 5. **REFACTOR** — 使用循环参数化三个卡片的测试
  - [x] 6. **COMMIT**
    ```bash
    git add . && git commit -m "test(e2e): add admin dashboard tests"
    ```

### Task 17: 封面图生成 E2E 测试

- **文件**:
  - 新建: `e2e/admin-cover.spec.ts`
- **关联 Scenario**: "输入标题并生成封面图", "标题为空时生成按钮禁用", "封面图生成失败时显示错误", "点击复制 URL 按钮复制图片地址"
- **前置依赖**: Task 3
- **步骤**:
  - [x] 1. **RED** — 编写测试：
    - mock `/api/ai/cover/submit` 返回 jobId
    - mock `/api/ai/cover/query` 返回 done + imageUrl
    - 验证标题为空时按钮禁用
    - 输入标题、点击生成、按钮变为 "生成中..."
    - 轮询完成后显示图片预览
    - 显示下载和复制 URL 按钮
    - 点击复制 URL 后按钮文字变 "已复制"
    - mock 错误响应时显示错误信息
  - [x] 2. **Verify RED** — 运行测试
  - [x] 3. **GREEN** — 调整 mock 轮询逻辑使测试通过
  - [x] 4. **Verify GREEN** — 确认通过
  - [x] 5. **REFACTOR** — 审查轮询 mock 的时序稳定性
  - [x] 6. **COMMIT**
    ```bash
    git add . && git commit -m "test(e2e): add cover image generation tests"
    ```

### Task 18: 自动标签管理 E2E 测试

- **文件**:
  - 新建: `e2e/admin-tags.spec.ts`
- **关联 Scenario**: "加载文章列表", "生成 AI 标签建议", "取消勾选部分标签后写入", "文章列表为空时显示空状态", "标签生成失败时显示错误"
- **前置依赖**: Task 3
- **步骤**:
  - [x] 1. **RED** — 编写测试：
    - mock `/api/admin/articles` 返回文章列表
    - 验证标题、文章列表、现有标签显示
    - mock `/api/ai/tags` 返回建议标签
    - 点击生成标签、验证复选框列表
    - 取消勾选某些标签
    - mock `/api/admin/tags/write` 点击写入
    - 验证 "标签已写入" 成功信息
    - mock 空列表验证 "暂无文章"
    - mock 标签生成错误验证错误显示
  - [x] 2. **Verify RED** — 运行测试
  - [x] 3. **GREEN** — 调整 mock 和选择器
  - [x] 4. **Verify GREEN** — 确认通过
  - [x] 5. **REFACTOR** — 提取 article mock 数据为常量
  - [x] 6. **COMMIT**
    ```bash
    git add . && git commit -m "test(e2e): add auto-tagging management tests"
    ```

### Task 19: 写作助手 E2E 测试

- **文件**:
  - 新建: `e2e/admin-writing.spec.ts`
- **关联 Scenario**: "输入文本并点击润色", "输入文本并点击续写", "点击替换原文将结果回填", "点击复制结果", "输入为空时操作按钮禁用", "AI 写作接口异常时显示错误"
- **关联 DR**: DR-4（streaming mock 格式）
- **前置依赖**: Task 3
- **步骤**:
  - [x] 1. **RED** — 编写测试：
    - 使用 `mockTextStream` 拦截 `/api/ai/writing`
    - 验证输入为空时润色和续写按钮禁用
    - 输入文本、点击润色、AI 结果区域显示
    - 显示复制结果和替换原文按钮
    - 点击复制结果按钮文字变 "已复制"
    - 点击替换原文：输入框文本变为 AI 结果、AI 结果区域消失
    - 点击续写验证结果显示
    - mock 错误时显示错误信息
  - [x] 2. **Verify RED** — 运行测试
  - [x] 3. **GREEN** — 调整 mock 和断言
  - [x] 4. **Verify GREEN** — 确认通过
  - [x] 5. **REFACTOR** — 提取共享的输入和 mock 步骤
  - [x] 6. **COMMIT**
    ```bash
    git add . && git commit -m "test(e2e): add writing assistant tests"
    ```

### Task 20: 全量测试运行与验证

- **文件**: 无新文件（验证任务）
- **关联 Scenario**: "测试框架安装和配置成功"
- **关联 AC**: AC-1（所有测试通过）
- **前置依赖**: Task 4-19
- **步骤**:
  - [x] 1. **RED** — 运行全量测试，收集失败用例
    ```bash
    yarn e2e
    ```
  - [x] 2. **GREEN** — 逐一修复失败的测试（如有）
  - [x] 3. **Verify GREEN** — 再次运行全量测试确认全部通过
    ```bash
    yarn e2e
    # 期望：所有测试 PASS，exit code 0
    ```
  - [x] 4. **REFACTOR** — 审查测试输出，移除冗余或不稳定的测试
  - [x] 5. **COMMIT**
    ```bash
    git add . && git commit -m "test(e2e): verify all E2E tests pass"
    ```

---

## 依赖图

```text
Phase 1: Task1 → Task2 → Task3
                   ↓         ↓
Phase 2: Task4 [P]     Task7 [P]
         Task5 [P]     (depends on Task3)
         Task6 [P]
         Task8 [P]
         Task9 [P]
         Task10 [P]
         Task11 [P]
         Task12 [P]
         Task13 [P]
                   ↓         ↓
Phase 3: Task14 [P]    Task16 [P]
         (depends on Task3)
         Task15 [P]    Task17 [P]
         (depends on Task3)
                       Task18 [P]
                       Task19 [P]
                       (depends on Task3)
                            ↓
         Task20 (depends on ALL above)
```

**并行分组说明**:

- Task 4, 5, 6, 8, 9, 10, 11, 12, 13 — 仅依赖 Task 2，无 AI mock 需求，可并行
- Task 7, 14, 15, 17, 18, 19 — 依赖 Task 3（mock helpers），彼此可并行
- Task 16 — 仅依赖 Task 2，可与其他 Phase 3 任务并行
- Task 20 — 必须等待所有其他 Task 完成

---

## Scenario 覆盖

| Scenario (spec.md)                 | 覆盖 Task                     | 状态 |
| ---------------------------------- | ----------------------------- | ---- |
| 测试框架安装和配置成功             | Task 1, 2, 20                 | ✅   |
| 开发服务器未启动时测试自动等待     | Task 2                        | ✅   |
| 首页加载显示文章列表               | Task 4                        | ✅   |
| 点击 Read more 跳转到文章详情页    | Task 4                        | ✅   |
| 点击 All Posts 跳转到博客列表页    | Task 4                        | ✅   |
| 首页无文章时显示空状态             | Task 4                        | ✅   |
| 点击导航链接跳转到对应页面         | Task 5                        | ✅   |
| 逐一验证所有导航链接跳转           | Task 5                        | ✅   |
| 导航链接在小屏幕下隐藏             | Task 5                        | ✅   |
| 打开移动端侧边导航                 | Task 6                        | ✅   |
| 通过侧边导航跳转并自动关闭         | Task 6                        | ✅   |
| 点击关闭按钮关闭侧边导航           | Task 6                        | ✅   |
| 点击搜索按钮打开搜索弹窗           | Task 7                        | ✅   |
| 使用键盘快捷键打开搜索弹窗         | Task 7                        | ✅   |
| 输入关键词显示搜索结果             | Task 7                        | ✅   |
| 点击搜索结果跳转到对应文章         | Task 7                        | ✅   |
| ESC 键关闭搜索弹窗                 | Task 7                        | ✅   |
| 搜索无结果时显示空状态             | Task 7                        | ✅   |
| 点击主题按钮弹出选择菜单           | Task 8                        | ✅   |
| 切换到深色主题                     | Task 8                        | ✅   |
| 切换到浅色主题                     | Task 8                        | ✅   |
| 搜索过滤文章                       | Task 9                        | ✅   |
| 搜索无匹配文章时显示空状态         | Task 9                        | ✅   |
| 点击文章标题跳转到详情页           | Task 9                        | ✅   |
| 点击标签跳转到标签过滤页           | Task 9                        | ✅   |
| 文章详情页正常加载                 | Task 10                       | ✅   |
| 点击 Back to the blog 返回博客列表 | Task 10                       | ✅   |
| 点击文章标签跳转                   | Task 10                       | ✅   |
| 文章不存在时显示 404               | Task 10                       | ✅   |
| 打开 AI 问答面板                   | Task 14                       | ✅   |
| 发送问题并收到 AI 回复             | Task 14                       | ✅   |
| 关闭 AI 问答面板                   | Task 14                       | ✅   |
| 通过面板内关闭按钮关闭             | Task 14                       | ✅   |
| AI 接口异常时显示错误并可重试      | Task 14                       | ✅   |
| 发送按钮在加载中禁用               | Task 14                       | ✅   |
| 输入搜索词触发 AI 搜索并显示结果   | Task 7                        | ✅   |
| AI 搜索进行中显示加载状态          | Task 7                        | ✅   |
| AI 搜索接口异常时回退到关键词搜索  | Task 7                        | ✅   |
| AI 搜索无匹配结果                  | Task 7                        | ✅   |
| 文章加载时显示摘要加载状态         | Task 15                       | ✅   |
| AI 摘要生成完成后显示内容          | Task 15                       | ✅   |
| AI 摘要接口异常时显示错误          | Task 15                       | ✅   |
| 标签页正常加载显示标签列表         | Task 11                       | ✅   |
| 点击标签跳转到标签文章列表         | Task 11                       | ✅   |
| 管理后台显示功能入口               | Task 16                       | ✅   |
| 点击功能卡片跳转到对应页面         | Task 16                       | ✅   |
| 逐一验证所有功能卡片跳转           | Task 16                       | ✅   |
| 输入标题并生成封面图               | Task 17                       | ✅   |
| 标题为空时生成按钮禁用             | Task 17                       | ✅   |
| 封面图生成失败时显示错误           | Task 17                       | ✅   |
| 点击复制 URL 按钮复制图片地址      | Task 17                       | ✅   |
| 加载文章列表                       | Task 18                       | ✅   |
| 生成 AI 标签建议                   | Task 18                       | ✅   |
| 取消勾选部分标签后写入             | Task 18                       | ✅   |
| 文章列表为空时显示空状态           | Task 18                       | ✅   |
| 标签生成失败时显示错误             | Task 18                       | ✅   |
| 输入文本并点击润色                 | Task 19                       | ✅   |
| 输入文本并点击续写                 | Task 19                       | ✅   |
| 点击替换原文将结果回填             | Task 19                       | ✅   |
| 点击复制结果                       | Task 19                       | ✅   |
| 输入为空时操作按钮禁用             | Task 19                       | ✅   |
| AI 写作接口异常时显示错误          | Task 19                       | ✅   |
| 页面滚动后显示回到顶部按钮         | Task 13                       | ✅   |
| 点击回到顶部按钮回到页面顶部       | Task 13                       | ✅   |
| 页面未滚动时按钮不显示             | Task 13                       | ✅   |
| 访问不存在的路径显示 404 页面      | Task 12                       | ✅   |
| 404 页面的返回首页链接可用         | Task 12                       | ✅   |
| 所有 AI 接口测试通过 mock 执行     | Task 3, 7, 14, 15, 17, 18, 19 | ✅   |
| Mock 拦截失效时测试明确失败        | Task 3                        | ✅   |
| 移动端测试使用移动设备视口         | Task 6                        | ✅   |
| 桌面端测试使用默认视口             | Task 2                        | ✅   |
