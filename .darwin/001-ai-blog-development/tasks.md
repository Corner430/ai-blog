# 任务列表

> 基于 spec.md 和 design.md 生成。使用 darwin-implement 执行。

## 概览

| 统计        | 值  |
| ----------- | --- |
| 总 Task 数  | 16  |
| 可并行 Task | 5   |
| Phase 数    | 5   |

---

## Phase 1: 基础设施

### Task 1: 安装依赖并配置项目基础设施

- **文件**:
  - 修改: `package.json`
  - 修改: `.env.example`
  - 修改: `tsconfig.json`
- **关联**: 无（基础设施）
- **前置依赖**: 无
- **步骤**:
  - [x] 1. 安装新增依赖
    ```bash
    yarn add openai ai tencentcloud-sdk-nodejs-hunyuan
    ```
  - [x] 2. 在 `.env.example` 中添加 AI 相关环境变量模板（HUNYUAN_API_KEY、TENCENT_SECRET_ID、TENCENT_SECRET_KEY）
  - [x] 3. 在 `tsconfig.json` 的 paths 中添加 `"@/lib/*": ["lib/*"]`
  - [x] 4. 验证依赖安装成功
    ```bash
    node -e "require('openai'); require('ai'); console.log('deps ok')"
    ```
  - [x] 5. 提交（延迟到所有 Task 完成后统一提交）
    ```bash
    git add . && git commit -m "chore: add AI dependencies and configure paths"
    ```

---

## Phase 2: Lib 层（SDK 封装）

### Task 2: 实现混元文本 API 封装（lib/hunyuan.ts）

- **文件**:
  - 新建: `lib/hunyuan.ts`
  - 新建: `lib/__tests__/hunyuan.test.ts`
- **关联 Scenario**: 所有使用 HY 2.0 Think 的 Scenario
- **关联 DR**: DR-1
- **前置依赖**: Task 1
- **步骤**:
  - [x] 1. **RED** — 写测试：验证 `getHunyuanClient()` 返回 OpenAI 实例，`isAiEnabled()` 在无 Key 时返回 false
  - [x] 2. **Verify RED** — 运行测试确认失败
  - [x] 3. **GREEN** — 实现 `lib/hunyuan.ts`
  - [x] 4. **Verify GREEN** — 5/5 测试通过
  - [x] 5. **REFACTOR** — 审查完成
  - [x] 6. **COMMIT**
    ```bash
    git add . && git commit -m "feat: add Hunyuan text API wrapper"
    ```

### Task 3: 实现混元生图 API 封装（lib/hunyuan-image.ts） [P]

- **文件**:
  - 新建: `lib/hunyuan-image.ts`
  - 新建: `lib/__tests__/hunyuan-image.test.ts`
- **关联 Scenario**: "根据文章信息生成封面图", "封面图生成过程中显示进度状态", "封面图生成失败时返回错误信息"
- **关联 DR**: DR-2
- **前置依赖**: Task 1
- **步骤**:
  - [x] 1. **RED** — 写测试
  - [x] 2. **Verify RED** — 确认失败
  - [x] 3. **GREEN** — 实现 `lib/hunyuan-image.ts`
  - [x] 4. **Verify GREEN** — 5/5 测试通过
  - [x] 5. **REFACTOR** — 审查完成
  - [x] 6. **COMMIT**

### Task 4: 实现 Embedding 索引工具（lib/embeddings.ts） [P]

- **文件**:
  - 新建: `lib/embeddings.ts`
  - 新建: `lib/__tests__/embeddings.test.ts`
- **关联 Scenario**: "用户通过自然语言搜索找到相关文章", "搜索结果在可接受时间内返回"
- **关联 DR**: DR-4
- **前置依赖**: Task 1
- **步骤**:
  - [x] 1. **RED** — 写测试
  - [x] 2. **Verify RED** — 确认失败
  - [x] 3. **GREEN** — 实现 `lib/embeddings.ts`
  - [x] 4. **Verify GREEN** — 7/7 测试通过
  - [x] 5. **REFACTOR** — 审查完成
  - [x] 6. **COMMIT**

---

## Phase 3: API 路由层

### Task 5: 实现 AI 摘要 API（/api/ai/summary）

- **文件**:
  - 新建: `app/api/ai/summary/route.ts`
  - 新建: `app/api/ai/__tests__/summary.test.ts`
- **关联 Scenario**: "用户首次访问文章详情页看到流式 AI 摘要", "AI 服务异常时摘要区域显示错误提示", "摘要以逐字流式效果展示"
- **前置依赖**: Task 2
- **步骤**:
  - [x] 1. **RED** — 写测试
  - [x] 2. **Verify RED** — 确认失败
  - [x] 3. **GREEN** — 实现 summary route
  - [x] 4. **Verify GREEN** — 3/3 测试通过
  - [x] 5. **REFACTOR** — 完成
  - [x] 6. **COMMIT**

### Task 6: 实现 AI 问答 API（/api/ai/chat） [P]

- **文件**:
  - 新建: `app/api/ai/chat/route.ts`
  - 新建: `app/api/ai/__tests__/chat.test.ts`
- **关联 Scenario**: "用户通过浮窗向 AI 提问并获得回答", "用户进行多轮对话", "AI 问答服务异常时显示错误提示", "问答回答以逐字流式效果展示"
- **前置依赖**: Task 2
- **步骤**:
  - [x] 1. **RED** — 写测试
  - [x] 2. **Verify RED** — 确认失败
  - [x] 3. **GREEN** — 实现 chat route
  - [x] 4. **Verify GREEN** — 4/4 测试通过
  - [x] 5. **REFACTOR** — 完成
  - [x] 6. **COMMIT**

### Task 7: 实现 AI 语义搜索 API（/api/ai/search） [P]

- **文件**:
  - 新建: `app/api/ai/search/route.ts`
  - 新建: `app/api/ai/__tests__/search.test.ts`
- **关联 Scenario**: "用户通过自然语言搜索找到相关文章", "用户搜索无匹配结果", "搜索结果在可接受时间内返回"
- **前置依赖**: Task 2, Task 4
- **步骤**:
  - [x] 1. **RED** — 写测试
  - [x] 2. **Verify RED** — 确认失败
  - [x] 3. **GREEN** — 实现 search route
  - [x] 4. **Verify GREEN** — 4/4 测试通过
  - [x] 5. **REFACTOR** — 完成
  - [x] 6. **COMMIT**

### Task 8: 实现 AI 自动标签 API（/api/ai/tags）

- **文件**:
  - 新建: `app/api/ai/tags/route.ts`
  - 新建: `app/api/ai/__tests__/tags.test.ts`
- **关联 Scenario**: "为文章内容生成标签建议", "文章内容过短时仍能返回标签", "AI 服务异常时标签请求返回错误信息"
- **前置依赖**: Task 2
- **步骤**:
  - [x] 1. **RED** — 写测试
  - [x] 2. **Verify RED** — 确认失败
  - [x] 3. **GREEN** — 实现 tags route
  - [x] 4. **Verify GREEN** — 3/3 测试通过
  - [x] 5. **REFACTOR** — 完成
  - [x] 6. **COMMIT**

### Task 9: 实现 AI 封面图生成 API（/api/ai/cover/submit + query）

- **文件**:
  - 新建: `app/api/ai/cover/submit/route.ts`
  - 新建: `app/api/ai/cover/query/route.ts`
  - 新建: `app/api/ai/__tests__/cover.test.ts`
- **关联 Scenario**: "根据文章信息生成封面图", "封面图生成过程中显示进度状态", "封面图生成失败时返回错误信息"
- **关联 DR**: DR-2
- **前置依赖**: Task 3
- **步骤**:
  - [x] 1. **RED** — 写测试
  - [x] 2. **Verify RED** — 确认失败
  - [x] 3. **GREEN** — 实现 cover submit/query routes
  - [x] 4. **Verify GREEN** — 5/5 测试通过
  - [x] 5. **REFACTOR** — 完成
  - [x] 6. **COMMIT**

### Task 10: 实现 AI 写作助手 API（/api/ai/writing）

- **文件**:
  - 新建: `app/api/ai/writing/route.ts`
  - 新建: `app/api/ai/__tests__/writing.test.ts`
- **关联 Scenario**: "用户请求润色文章内容", "用户请求续写文章内容", "写作助手服务异常时返回错误信息"
- **前置依赖**: Task 2
- **步骤**:
  - [x] 1. **RED** — 写测试
  - [x] 2. **Verify RED** — 确认失败
  - [x] 3. **GREEN** — 实现 writing route
  - [x] 4. **Verify GREEN** — 5/5 测试通过
  - [x] 5. **REFACTOR** — 完成
  - [x] 6. **COMMIT**

---

## Phase 4: 前端组件层

### Task 11: 实现 AI 摘要组件（AiSummary.tsx）

- **文件**:
  - 新建: `components/ai/AiSummary.tsx`
- **关联 Scenario**: "用户首次访问文章详情页看到流式 AI 摘要", "用户再次访问同一篇文章时直接显示缓存摘要", "文章内容更新后摘要缓存自动失效", "AI 服务异常时摘要区域显示错误提示", "摘要以逐字流式效果展示"
- **关联 DR**: DR-3, DR-6
- **前置依赖**: Task 5
- **步骤**:
  - [x] 1. **RED** — 写测试
  - [x] 2. **Verify RED** — 确认失败
  - [x] 3. **GREEN** — 实现 AiSummary.tsx
  - [x] 4. **Verify GREEN** — 3/3 测试通过
  - [x] 5. **REFACTOR** — 完成
  - [x] 6. **COMMIT**

### Task 12: 实现 AI 问答浮窗组件（AiChat.tsx）

- **文件**:
  - 新建: `components/ai/AiChat.tsx`
- **关联 Scenario**: "用户通过浮窗向 AI 提问并获得回答", "用户进行多轮对话", "AI 问答服务异常时显示错误提示", "用户切换文章后问答上下文重置", "问答回答以逐字流式效果展示"
- **前置依赖**: Task 6
- **步骤**:
  - [x] 1. **RED** — 写测试
  - [x] 2. **Verify RED** — 确认失败
  - [x] 3. **GREEN** — 实现 AiChat.tsx
  - [x] 4. **Verify GREEN** — 2/2 测试通过
  - [x] 5. **REFACTOR** — 完成
  - [x] 6. **COMMIT**

### Task 13: 实现 AI 语义搜索组件（AiSearch.tsx）并替换 KBar

- **文件**:
  - 新建: `components/ai/AiSearch.tsx`
  - 修改: `components/SearchButton.tsx`
  - 修改: `app/layout.tsx`
- **关联 Scenario**: "用户通过自然语言搜索找到相关文章", "用户搜索无匹配结果", "未配置 API Key 时搜索回退到基础模式"
- **关联 DR**: DR-5
- **前置依赖**: Task 7
- **步骤**:
  - [x] 1. **RED** — 写测试
  - [x] 2. **Verify RED** — 确认失败
  - [x] 3. **GREEN** — 实现 AiSearch.tsx，修改 SearchButton.tsx，移除 SearchProvider
  - [x] 4. **Verify GREEN** — 3/3 测试通过
  - [x] 5. **REFACTOR** — 完成（含 debounce 和 Cmd+K）
  - [x] 6. **COMMIT**

---

## Phase 5: 集成与收尾

### Task 14: 集成 AI 组件到文章布局

- **文件**:
  - 修改: `layouts/PostLayout.tsx`
  - 修改: `layouts/PostSimple.tsx`
  - 修改: `layouts/PostBanner.tsx`
- **关联 Scenario**: "三种文章布局均展示 AI 摘要", "未配置 API Key 时 AI 组件不显示"
- **前置依赖**: Task 11, Task 12
- **步骤**:
  - [x] 1. 已在三种布局中集成 AiSummary 和 AiChat
  - [x] 2. PostLayout — 完成
  - [x] 3. PostSimple — 完成
  - [x] 4. PostBanner — 完成
  - [x] 5. **REFACTOR** — 完成
  - [x] 6. **COMMIT**

### Task 15: 实现 Embedding 索引构建脚本

- **文件**:
  - 新建: `scripts/generate-embeddings.mjs`
  - 修改: `package.json` (build script)
- **关联 Scenario**: "构建时生成语义索引文件"
- **关联 DR**: DR-4
- **前置依赖**: Task 2, Task 4
- **步骤**:
  - [x] 1. 实现 generate-embeddings.mjs 脚本
  - [x] 2. 添加 3 次重试逻辑
  - [x] 3. 失败时不阻塞构建（graceful degradation）
  - [x] 4. 更新 package.json build 脚本
  - [x] 5. **REFACTOR** — 完成
  - [x] 6. **COMMIT**

### Task 16: 端到端集成验证与降级测试

- **文件**:
  - 修改: `data/siteMetadata.js`（搜索配置调整）
  - 修改: `.env.example`（最终确认）
- **关联 Scenario**: "未配置 API Key 时 AI 组件不显示", "未配置 API Key 时搜索回退到基础模式"
- **前置依赖**: Task 13, Task 14, Task 15
- **步骤**:
  - [x] 1. **RED** — 写降级测试
  - [x] 2. **Verify RED** — 确认失败
  - [x] 3. **GREEN** — 所有 7 个 API 路由在无 Key 时返回 503
  - [x] 4. **Verify GREEN** — 7/7 降级测试通过
  - [x] 5. **REFACTOR** — 调整 siteMetadata.js 配置
  - [x] 6. **COMMIT**

---

## 依赖图

```text
Phase 1: Task1
              ↓
Phase 2: Task2 ─────────────────┬── Task3 [P] ── Task4 [P]
              │                 │              │
Phase 3: Task5 ── Task6 [P]    │         Task7 [P]
              │    │            │              │
              │    │         Task9          Task8
              │    │                          │
              │  Task10                       │
              ↓                               ↓
Phase 4: Task11 ── Task12         Task13
              │       │              │
              ↓       ↓              ↓
Phase 5: Task14 ──────────── Task15
              │                 │
              ↓                 ↓
           Task16 ←─────────────┘
```

**并行组**：

- Task 2, 3, 4 可并行（Phase 2，无共享文件，均只依赖 Task 1）
- Task 5, 6 可并行（均依赖 Task 2，无共享文件）
- Task 7, 8 可与 Task 5/6 并行（不同文件）

---

## Scenario 覆盖

| Scenario (spec.md)                       | 覆盖 Task      | 状态 |
| ---------------------------------------- | -------------- | ---- |
| 用户首次访问文章详情页看到流式 AI 摘要   | Task 5, 11, 14 | ✅   |
| 用户再次访问同一篇文章时直接显示缓存摘要 | Task 11        | ✅   |
| 文章内容更新后摘要缓存自动失效           | Task 11        | ✅   |
| AI 服务异常时摘要区域显示错误提示        | Task 5, 11     | ✅   |
| 三种文章布局均展示 AI 摘要               | Task 14        | ✅   |
| 用户通过浮窗向 AI 提问并获得回答         | Task 6, 12, 14 | ✅   |
| 用户进行多轮对话                         | Task 6, 12     | ✅   |
| AI 问答服务异常时显示错误提示            | Task 6, 12     | ✅   |
| 用户切换文章后问答上下文重置             | Task 12        | ✅   |
| 用户通过自然语言搜索找到相关文章         | Task 7, 13     | ✅   |
| 用户搜索无匹配结果                       | Task 7, 13     | ✅   |
| 搜索结果在可接受时间内返回               | Task 4, 7      | ✅   |
| 构建时生成语义索引文件                   | Task 15        | ✅   |
| 为文章内容生成标签建议                   | Task 8         | ✅   |
| 文章内容过短时仍能返回标签               | Task 8         | ✅   |
| AI 服务异常时标签请求返回错误信息        | Task 8         | ✅   |
| 根据文章信息生成封面图                   | Task 9         | ✅   |
| 封面图生成过程中显示进度状态             | Task 9         | ✅   |
| 封面图生成失败时返回错误信息             | Task 9         | ✅   |
| 用户请求润色文章内容                     | Task 10        | ✅   |
| 用户请求续写文章内容                     | Task 10        | ✅   |
| 写作助手服务异常时返回错误信息           | Task 10        | ✅   |
| 未配置 API Key 时 AI 组件不显示          | Task 16        | ✅   |
| 未配置 API Key 时搜索回退到基础模式      | Task 13, 16    | ✅   |
| 摘要以逐字流式效果展示                   | Task 5, 11     | ✅   |
| 问答回答以逐字流式效果展示               | Task 6, 12     | ✅   |
