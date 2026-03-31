# 任务列表

> 基于 spec.md 和 design.md 生成。使用 darwin-implement 执行。

## 概览

| 统计        | 值                     |
| ----------- | ---------------------- |
| 总 Task 数  | 10                     |
| 可并行 Task | 3（Task 4/5/6 可并行） |
| Phase 数    | 4                      |

**注意**：review-report.md 中的 5 个 Minor 建议中，#1（未使用 getHunyuanClient import）、#2（重复 createOpenAI）、#3（冗余 Cmd+K 监听）、#5（未使用 loadEmbeddingIndex）在当前代码中已修复。仅 #4（文档同步更新）需要在本轮执行。

---

## Phase 1: 辅助 API 层

### Task 1: 实现文章列表读取 API

- **文件**:
  - 新建: `app/api/admin/articles/route.ts`
  - 新建: `app/api/admin/__tests__/articles.test.ts`
- **关联 Scenario**: "用户访问标签管理页面看到文章列表", "文章列表为空时的展示"
- **关联 DR**: DR-2（Route Handler 方式实现文件操作）
- **前置依赖**: 无
- **步骤**:
  - [x] 1. **RED** — 写失败测试：测试 GET /api/admin/articles 返回文章列表（mock fs 和 gray-matter）
    ```typescript
    // app/api/admin/__tests__/articles.test.ts
    // 测试 1: 正常返回文章列表（含 filename, title, tags, content）
    // 测试 2: data/blog 目录为空时返回空数组
    // 测试 3: 文件读取异常时返回 500
    ```
  - [x] 2. **Verify RED** — 运行测试确认失败
    ```bash
    yarn jest app/api/admin/__tests__/articles.test.ts
    # 期望：FAIL — 模块不存在
    ```
  - [x] 3. **GREEN** — 实现 GET /api/admin/articles，使用 fs.readdirSync + gray-matter 读取 data/blog/\*.mdx
  - [x] 4. **Verify GREEN** — 运行测试确认通过
    ```bash
    yarn jest app/api/admin/__tests__/articles.test.ts
    # 期望：PASS
    ```
  - [x] 5. **REFACTOR** — 审查错误处理和边界情况
  - [x] 6. **COMMIT**
    ```bash
    git add . && git commit -m "feat: add /api/admin/articles endpoint for reading MDX article list"
    ```

### Task 2: 实现标签写入 API

- **文件**:
  - 新建: `app/api/admin/tags/write/route.ts`
  - 新建: `app/api/admin/__tests__/tags-write.test.ts`
- **关联 Scenario**: "用户将选定标签写入文章 frontmatter"
- **关联 DR**: DR-5（gray-matter stringify 写回文件）
- **前置依赖**: 无
- **步骤**:
  - [x] 1. **RED** — 写失败测试：测试 POST /api/admin/tags/write 写入标签（mock fs 和 gray-matter）
    ```typescript
    // app/api/admin/__tests__/tags-write.test.ts
    // 测试 1: 正常写入标签，返回 { success: true }
    // 测试 2: filename 缺失返回 400
    // 测试 3: tags 缺失返回 400
    // 测试 4: 文件不存在返回 404
    // 测试 5: 写入异常返回 500
    ```
  - [x] 2. **Verify RED** — 运行测试确认失败
    ```bash
    yarn jest app/api/admin/__tests__/tags-write.test.ts
    # 期望：FAIL
    ```
  - [x] 3. **GREEN** — 实现 POST /api/admin/tags/write，使用 gray-matter 解析文件、修改 tags、gray-matter.stringify 写回
  - [x] 4. **Verify GREEN** — 运行测试确认通过
  - [x] 5. **REFACTOR** — 确认路径安全（防止路径穿越，filename 仅接受 \*.mdx 格式）
  - [x] 6. **COMMIT**
    ```bash
    git add . && git commit -m "feat: add /api/admin/tags/write endpoint for writing tags to frontmatter"
    ```

---

## Phase 2: 管理页面 — 前端组件

### Task 3: 实现管理中心首页

- **文件**:
  - 新建: `app/admin/page.tsx`
  - 新建: `app/admin/__tests__/admin-page.test.tsx`
- **关联 Scenario**: "用户访问管理中心首页看到功能入口", "用户通过管理中心卡片跳转到功能页面", "公开导航栏不展示管理中心入口"
- **前置依赖**: 无
- **步骤**:
  - [x] 1. **RED** — 写失败测试
    ```typescript
    // app/admin/__tests__/admin-page.test.tsx
    // 测试 1: 渲染页面显示"管理中心"标题
    // 测试 2: 显示三张功能卡片（封面图生成、自动标签、写作助手）
    // 测试 3: 卡片链接分别指向 /admin/cover, /admin/tags, /admin/writing
    ```
  - [x] 2. **Verify RED** — 运行测试确认失败
    ```bash
    yarn jest app/admin/__tests__/admin-page.test.tsx
    # 期望：FAIL
    ```
  - [x] 3. **GREEN** — 实现管理中心首页，3 张 Link 卡片，'use client' 组件，Tailwind CSS + dark mode
  - [x] 4. **Verify GREEN** — 运行测试确认通过
  - [x] 5. **REFACTOR** — 审查样式一致性（dark: 前缀、间距、边框颜色）
  - [x] 6. **COMMIT**
    ```bash
    git add . && git commit -m "feat: add admin dashboard page with navigation cards"
    ```

### Task 4: 实现封面图生成管理页面 [P]

- **文件**:
  - 新建: `app/admin/cover/page.tsx`
  - 新建: `app/admin/__tests__/cover-page.test.tsx`
- **关联 Scenario**: "用户输入标题和摘要成功生成封面图", "用户仅输入标题成功生成封面图", "用户未输入标题点击生成按钮", "封面图生成完成后用户下载图片", "封面图生成完成后用户复制 URL", "封面图生成超时", "封面图生成过程中服务返回失败"
- **关联 DR**: DR-3（fetch + Blob 下载）
- **前置依赖**: Task 3
- **步骤**:
  - [x] 1. **RED** — 写失败测试
    ```typescript
    // app/admin/__tests__/cover-page.test.tsx
    // 测试 1: 渲染标题输入框、摘要输入框、生成按钮
    // 测试 2: 标题为空时生成按钮不可点击
    // 测试 3: 点击生成按钮后显示"生成中..."状态（mock fetch submit → 返回 jobId）
    // 测试 4: 轮询完成后展示图片预览（mock fetch query → 返回 done + imageUrl）
    // 测试 5: 生成完成后显示"下载图片"和"复制 URL"按钮
    // 测试 6: 点击"复制 URL"调用 navigator.clipboard.writeText
    // 测试 7: 轮询 60 次后显示超时提示
    // 测试 8: 查询返回 failed 时显示错误信息
    ```
  - [x] 2. **Verify RED** — 运行测试确认失败
    ```bash
    yarn jest app/admin/__tests__/cover-page.test.tsx
    # 期望：FAIL
    ```
  - [x] 3. **GREEN** — 实现封面图生成页面：
    - 标题输入框（必填）+ 摘要输入框（选填）+ 生成按钮
    - 提交后 fetch /api/ai/cover/submit，获取 jobId
    - setInterval 每 3 秒轮询 /api/ai/cover/query?jobId=xxx
    - 最大 60 次轮询（3 分钟超时）
    - 状态展示：生成中 / 完成（图片预览）/ 失败 / 超时
    - 完成后：下载按钮（fetch Blob + Object URL）+ 复制 URL 按钮（clipboard API）
  - [x] 4. **Verify GREEN** — 运行测试确认通过
  - [x] 5. **REFACTOR** — 审查轮询清理（useEffect cleanup clearInterval）、按钮禁用状态
  - [x] 6. **COMMIT**
    ```bash
    git add . && git commit -m "feat: add cover image generation admin page with polling and download"
    ```

### Task 5: 实现自动标签管理页面 [P]

- **文件**:
  - 新建: `app/admin/tags/page.tsx`
  - 新建: `app/admin/__tests__/tags-page.test.tsx`
- **关联 Scenario**: "用户访问标签管理页面看到文章列表", "用户为一篇文章生成标签建议", "用户取消勾选部分建议标签", "用户将选定标签写入文章 frontmatter", "标签生成过程中 AI 服务异常", "文章列表为空时的展示"
- **前置依赖**: Task 1, Task 2, Task 3
- **步骤**:
  - [x] 1. **RED** — 写失败测试
    ```typescript
    // app/admin/__tests__/tags-page.test.tsx
    // 测试 1: 渲染页面时 fetch /api/admin/articles，显示文章列表
    // 测试 2: 每篇文章显示文件名、标题、现有标签和"生成标签"按钮
    // 测试 3: 文章列表为空时显示"暂无文章"
    // 测试 4: 点击"生成标签"后 fetch /api/ai/tags，展示建议标签（默认全选）
    // 测试 5: 点击标签可以切换勾选状态
    // 测试 6: 点击"写入 frontmatter"后 fetch /api/admin/tags/write，显示成功提示
    // 测试 7: tags API 返回错误时显示错误提示
    ```
  - [x] 2. **Verify RED** — 运行测试确认失败
  - [x] 3. **GREEN** — 实现标签管理页面：
    - 页面加载时 fetch /api/admin/articles 获取文章列表
    - 展示文章列表（文件名、标题、现有标签、生成标签按钮）
    - 点击生成标签：fetch /api/ai/tags（传入文章 content），展示可勾选的标签列表
    - 写入 frontmatter：fetch /api/admin/tags/write（传入 filename + 选定的 tags）
  - [x] 4. **Verify GREEN** — 运行测试确认通过
  - [x] 5. **REFACTOR** — 审查 loading/error 状态处理、勾选交互流畅性
  - [x] 6. **COMMIT**
    ```bash
    git add . && git commit -m "feat: add auto-tagging admin page with tag generation and frontmatter writing"
    ```

### Task 6: 实现写作助手管理页面 [P]

- **文件**:
  - 新建: `app/admin/writing/page.tsx`
  - 新建: `app/admin/__tests__/writing-page.test.tsx`
- **关联 Scenario**: "用户输入文本并请求润色", "用户输入文本并请求续写", "用户复制 AI 返回的结果", "用户将 AI 结果替换到输入区域", "用户执行迭代工作流", "用户未输入文本就点击操作按钮", "写作助手服务异常时显示错误"
- **关联 DR**: DR-1（useCompletion hook）
- **前置依赖**: Task 3
- **步骤**:
  - [x] 1. **RED** — 写失败测试
    ```typescript
    // app/admin/__tests__/writing-page.test.tsx
    // 测试 1: 渲染输入区域、润色按钮、续写按钮
    // 测试 2: 输入为空时按钮不可点击
    // 测试 3: 点击"润色"后调用 useCompletion 的 complete（action="polish"）
    // 测试 4: 点击"续写"后调用 useCompletion 的 complete（action="continue"）
    // 测试 5: 流式完成后显示"复制结果"和"替换原文"按钮
    // 测试 6: 点击"复制结果"调用 navigator.clipboard.writeText
    // 测试 7: 点击"替换原文"将结果回填到输入区域并清空结果
    // 测试 8: AI 返回错误时显示错误提示
    ```
  - [x] 2. **Verify RED** — 运行测试确认失败
  - [x] 3. **GREEN** — 实现写作助手页面：
    - 多行文本输入区域（textarea）
    - "润色"和"续写"按钮（输入为空时 disabled）
    - 使用 useCompletion hook，api 指向 /api/ai/writing，body 传入 action
    - 结果区域实时展示流式输出
    - 完成后显示"复制结果"（clipboard）和"替换原文"（setInput + clear completion）按钮
  - [x] 4. **Verify GREEN** — 运行测试确认通过
  - [x] 5. **REFACTOR** — 审查流式状态管理、按钮禁用逻辑、替换原文后的状态重置
  - [x] 6. **COMMIT**
    ```bash
    git add . && git commit -m "feat: add writing assistant admin page with polish and continue actions"
    ```

---

## Phase 3: 主题与样式

### Task 7: 管理页面暗色主题适配

- **文件**:
  - 修改: `app/admin/page.tsx`
  - 修改: `app/admin/cover/page.tsx`
  - 修改: `app/admin/tags/page.tsx`
  - 修改: `app/admin/writing/page.tsx`
- **关联 Scenario**: "管理页面在暗色主题下正常展示", "管理页面在亮色主题下正常展示"
- **前置依赖**: Task 3, Task 4, Task 5, Task 6
- **步骤**:
  - [x] 1. **RED** — 审查所有管理页面组件，确认每个可见元素都有 `dark:` 对应样式类
  - [x] 2. **GREEN** — 对缺失 dark mode 类的元素补充 Tailwind CSS dark: 前缀样式
  - [x] 3. **Verify** — 视觉检查或通过测试确认 dark: 类名存在
  - [x] 4. **COMMIT**
    ```bash
    git add . && git commit -m "style: ensure dark mode support for all admin pages"
    ```

---

## Phase 4: 文档更新与集成验证

### Task 8: 更新 docs/plan.md 生图描述

- **文件**:
  - 修改: `docs/plan.md:57-58,237-239`
- **关联 Scenario**: "plan.md 中生图描述反映当前实现"
- **前置依赖**: 无
- **步骤**:
  - [x] 1. **GREEN** — 更新 plan.md 中以下内容：
    - "生图接口域名：`hunyuan.tencentcloudapi.com`" → `api.cloudai.tencent.com`
    - "生图认证：腾讯云API 3.0签名（SecretId + SecretKey, TC3-HMAC-SHA256）" → "Bearer Token (HUNYUAN_API_KEY)"
    - 依赖包中 `"tencentcloud-sdk-nodejs-hunyuan": "^4.x"` → 移除（已不需要该 SDK）
  - [x] 2. **Verify** — 读取文件确认更新正确
  - [x] 3. **COMMIT**
    ```bash
    git add . && git commit -m "docs: update plan.md to reflect OpenAI-compatible image API"
    ```

### Task 9: 更新 .darwin/001 design.md 封面图描述

- **文件**:
  - 修改: `.darwin/001-ai-blog-development/design.md:64-73,192-194`
- **关联 Scenario**: "design.md 中封面图描述反映当前实现"
- **前置依赖**: 无
- **步骤**:
  - [x] 1. **GREEN** — 更新 design.md 中以下内容：
    - `lib/hunyuan-image.ts` 职责说明从 "TencentCloud SDK wrapper" → "OpenAI 兼容生图 API 封装 (api.cloudai.tencent.com)"
    - cover/submit 和 cover/query 接口 Auth 说明从 "TENCENT_SECRET_ID/KEY" → "HUNYUAN_API_KEY"
    - 外部服务域名从 `hunyuan.tencentcloudapi.com (Image generation)` → `api.cloudai.tencent.com (Image generation)`
  - [x] 2. **Verify** — 读取文件确认更新正确
  - [x] 3. **COMMIT**
    ```bash
    git add . && git commit -m "docs: update design.md to reflect OpenAI-compatible image API"
    ```

### Task 10: 全量测试验证

- **文件**: 无新增（验证现有 + 新增测试全部通过）
- **关联 Scenario**: "所有管理页面组件有对应测试", "新增 API 路由有对应测试"
- **前置依赖**: Task 1 ~ Task 9 全部完成
- **步骤**:
  - [x] 1. 运行全量测试
    ```bash
    yarn jest --verbose
    # 期望：所有测试通过，包括现有 56 个 + 新增管理页面和 API 测试
    ```
  - [x] 2. 确认无失败测试
  - [x] 3. 如有失败，修复后重新运行
  - [x] 4. **COMMIT**（如有修复）
    ```bash
    git add . && git commit -m "fix: resolve test failures in integration verification"
    ```

---

## 依赖图

```text
Phase 1:  Task 1 (articles API)     Task 2 (tags write API)
               ↓                          ↓
Phase 2:  Task 3 (admin home) ───────────────────────────┐
               ↓                   ↓                ↓    │
          Task 4 [P]          Task 5            Task 6 [P]│
          (cover page)        (tags page)       (writing) │
               ↓                   ↓                ↓    │
Phase 3:  Task 7 (dark mode) ←───────────────────────────┘
               ↓
Phase 4:  Task 8 [P] (plan.md)   Task 9 [P] (design.md)
               ↓                       ↓
          Task 10 (全量测试验证)
```

**并行说明**：

- Task 1 和 Task 2 可并行（无共享文件）
- Task 4 和 Task 6 可与 Task 5 并行（Task 5 依赖 Task 1+2，但 Task 4 和 Task 6 不依赖它们）
- Task 8 和 Task 9 可并行（修改不同文件）

## Scenario 覆盖

| Scenario (spec.md)                 | 覆盖 Task           | 状态 |
| ---------------------------------- | ------------------- | ---- |
| 用户访问管理中心首页看到功能入口   | Task 3              | ✅   |
| 用户通过管理中心卡片跳转到功能页面 | Task 3              | ✅   |
| 公开导航栏不展示管理中心入口       | Task 3              | ✅   |
| 用户输入标题和摘要成功生成封面图   | Task 4              | ✅   |
| 用户仅输入标题成功生成封面图       | Task 4              | ✅   |
| 用户未输入标题点击生成按钮         | Task 4              | ✅   |
| 封面图生成完成后用户下载图片       | Task 4              | ✅   |
| 封面图生成完成后用户复制 URL       | Task 4              | ✅   |
| 封面图生成超时                     | Task 4              | ✅   |
| 封面图生成过程中服务返回失败       | Task 4              | ✅   |
| 用户访问标签管理页面看到文章列表   | Task 1, Task 5      | ✅   |
| 用户为一篇文章生成标签建议         | Task 5              | ✅   |
| 用户取消勾选部分建议标签           | Task 5              | ✅   |
| 用户将选定标签写入文章 frontmatter | Task 2, Task 5      | ✅   |
| 标签生成过程中 AI 服务异常         | Task 5              | ✅   |
| 文章列表为空时的展示               | Task 1, Task 5      | ✅   |
| 用户输入文本并请求润色             | Task 6              | ✅   |
| 用户输入文本并请求续写             | Task 6              | ✅   |
| 用户复制 AI 返回的结果             | Task 6              | ✅   |
| 用户将 AI 结果替换到输入区域       | Task 6              | ✅   |
| 用户执行迭代工作流（润色后续写）   | Task 6              | ✅   |
| 用户未输入文本就点击操作按钮       | Task 6              | ✅   |
| 写作助手服务异常时显示错误         | Task 6              | ✅   |
| plan.md 中生图描述反映当前实现     | Task 8              | ✅   |
| design.md 中封面图描述反映当前实现 | Task 9              | ✅   |
| summary 路由不包含未使用的 import  | 已修复（无需 Task） | ✅   |
| API 路由统一使用 hunyuan provider  | 已修复（无需 Task） | ✅   |
| AiSearch 不包含冗余的 Cmd+K 监听器 | 已修复（无需 Task） | ✅   |
| embeddings.ts 不包含未使用的函数   | 已修复（无需 Task） | ✅   |
| 管理页面在暗色主题下正常展示       | Task 7              | ✅   |
| 管理页面在亮色主题下正常展示       | Task 7              | ✅   |
| 所有管理页面组件有对应测试         | Task 3, 4, 5, 6, 10 | ✅   |
| 新增 API 路由有对应测试            | Task 1, 2, 10       | ✅   |
