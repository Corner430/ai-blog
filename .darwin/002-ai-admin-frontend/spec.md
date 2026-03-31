# 行为规格文档

## 需求溯源

基于 clarify.md 生成。覆盖 FR-1 至 FR-16，AC-1 至 AC-12，NFR-1 至 NFR-4。

---

## Feature: 管理中心首页

### Scenario: 用户访问管理中心首页看到功能入口

- **Given** 用户已打开浏览器
- **When** 用户访问 `/admin` 页面
- **Then** 用户看到页面标题"管理中心"
- **And** 页面展示三张功能卡片：封面图生成、自动标签、写作助手
- **And** 每张卡片包含功能名称、简要描述和跳转链接

### Scenario: 用户通过管理中心卡片跳转到功能页面

- **Given** 用户在 `/admin` 页面
- **When** 用户点击"封面图生成"卡片
- **Then** 用户跳转到 `/admin/cover` 页面

### Scenario: 公开导航栏不展示管理中心入口

- **Given** 用户在博客任意公开页面
- **When** 用户查看页面顶部导航栏
- **Then** 导航栏中没有"管理中心"或"/admin"相关链接

---

## Feature: AI 封面图生成

### Scenario: 用户输入标题和摘要成功生成封面图

- **Given** 用户在封面图生成页面
- **When** 用户在标题输入框输入"深入理解 TypeScript 泛型"
- **And** 用户在摘要输入框输入"本文介绍泛型的高级用法"
- **And** 用户点击"生成封面"按钮
- **Then** 页面显示"生成中..."状态指示
- **And** 生成按钮变为不可点击状态
- **And** 生成完成后页面展示封面图预览

### Scenario: 用户仅输入标题（不填摘要）成功生成封面图

- **Given** 用户在封面图生成页面
- **When** 用户在标题输入框输入"Hello World"
- **And** 用户不填写摘要
- **And** 用户点击"生成封面"按钮
- **Then** 页面显示"生成中..."状态指示
- **And** 生成完成后页面展示封面图预览

### Scenario: 用户未输入标题点击生成按钮

- **Given** 用户在封面图生成页面
- **And** 标题输入框为空
- **When** 用户点击"生成封面"按钮
- **Then** 生成按钮保持不可点击状态或显示提示"请输入文章标题"

### Scenario: 封面图生成完成后用户下载图片

- **Given** 封面图已生成完成并展示预览
- **When** 用户点击"下载图片"按钮
- **Then** 浏览器触发图片下载

### Scenario: 封面图生成完成后用户复制 URL

- **Given** 封面图已生成完成并展示预览
- **When** 用户点击"复制 URL"按钮
- **Then** 图片 URL 被复制到剪贴板
- **And** 页面显示"已复制"成功提示

### Scenario: 封面图生成超时

- **Given** 用户已提交封面图生成任务
- **And** 系统已轮询 60 次（3 分钟）仍未完成
- **When** 轮询达到上限
- **Then** 页面停止轮询
- **And** 显示"生成超时，请重试"提示
- **And** 用户可以重新点击"生成封面"按钮

### Scenario: 封面图生成过程中服务返回失败

- **Given** 用户已提交封面图生成任务
- **When** 系统轮询到生成任务状态为失败
- **Then** 页面停止轮询
- **And** 显示生成失败的错误信息

---

## Feature: AI 自动标签

### Scenario: 用户访问标签管理页面看到文章列表

- **Given** `data/blog/` 目录下有 MDX 文章
- **When** 用户访问 `/admin/tags` 页面
- **Then** 页面展示所有 MDX 文章的列表
- **And** 每篇文章显示文件名、标题和现有标签
- **And** 每篇文章旁有"生成标签"按钮

### Scenario: 用户为一篇文章生成标签建议

- **Given** 用户在标签管理页面
- **And** 文章列表中有文章"Hello World"
- **When** 用户点击该文章的"生成标签"按钮
- **Then** 按钮显示加载状态
- **And** 加载完成后在该文章下方展示 AI 建议的标签列表
- **And** 每个建议标签默认为勾选状态

### Scenario: 用户取消勾选部分建议标签

- **Given** 用户已为一篇文章生成标签建议
- **And** 界面展示了 5 个建议标签且全部勾选
- **When** 用户取消勾选其中 2 个标签
- **Then** 剩余 3 个标签保持勾选状态
- **And** 被取消的 2 个标签显示为未勾选样式

### Scenario: 用户将选定标签写入文章 frontmatter

- **Given** 用户已为一篇文章生成标签建议
- **And** 用户已勾选了 3 个标签
- **When** 用户点击"写入 frontmatter"按钮
- **Then** 对应 MDX 文件的 tags 字段被替换为用户选定的 3 个标签
- **And** 页面显示"标签已写入"成功提示

### Scenario: 标签生成过程中 AI 服务异常

- **Given** 用户在标签管理页面
- **When** 用户点击"生成标签"按钮
- **And** AI 服务返回错误
- **Then** 页面显示错误提示信息
- **And** 不展示任何标签建议

### Scenario: 文章列表为空时的展示

- **Given** `data/blog/` 目录下没有 MDX 文章
- **When** 用户访问 `/admin/tags` 页面
- **Then** 页面显示"暂无文章"提示

---

## Feature: AI 写作助手

### Scenario: 用户输入文本并请求润色

- **Given** 用户在写作助手页面
- **When** 用户在输入区域粘贴一段文本
- **And** 用户点击"润色"按钮
- **Then** 结果区域以流式方式逐字展示 AI 润色后的内容
- **And** 操作按钮在流式输出期间变为不可点击状态

### Scenario: 用户输入文本并请求续写

- **Given** 用户在写作助手页面
- **When** 用户在输入区域输入一段文本
- **And** 用户点击"续写"按钮
- **Then** 结果区域以流式方式逐字展示 AI 续写的内容

### Scenario: 用户复制 AI 返回的结果

- **Given** AI 写作助手已完成流式输出
- **And** 结果区域展示了完整的 AI 返回文本
- **When** 用户点击"复制结果"按钮
- **Then** 完整的 AI 返回文本被复制到剪贴板
- **And** 页面显示"已复制"成功提示

### Scenario: 用户将 AI 结果替换到输入区域

- **Given** AI 写作助手已完成流式输出
- **And** 结果区域展示了 AI 返回文本
- **When** 用户点击"替换原文"按钮
- **Then** 输入区域的内容被替换为 AI 返回的文本
- **And** 结果区域被清空

### Scenario: 用户执行迭代工作流（润色后续写）

- **Given** 用户在写作助手页面已完成一次润色操作
- **And** 结果区域展示了润色后的文本
- **When** 用户点击"替换原文"按钮
- **And** 用户点击"续写"按钮
- **Then** AI 基于润色后的文本进行续写
- **And** 结果区域以流式方式展示续写内容

### Scenario: 用户未输入文本就点击操作按钮

- **Given** 用户在写作助手页面
- **And** 输入区域为空
- **When** 用户尝试点击"润色"或"续写"按钮
- **Then** 按钮保持不可点击状态

### Scenario: 写作助手服务异常时显示错误

- **Given** 用户在写作助手页面
- **And** 用户已输入文本
- **When** 用户点击"润色"按钮
- **And** AI 服务返回错误
- **Then** 结果区域显示错误提示信息

---

## Feature: 文档更新

### Scenario: plan.md 中生图描述反映当前实现

- **Given** `docs/plan.md` 中关于生图的描述存在过时内容
- **When** 文档更新完成
- **Then** 生图接口域名显示为 `api.cloudai.tencent.com`
- **And** 认证方式显示为 HUNYUAN_API_KEY
- **And** 不再引用 `tencentcloud-sdk-nodejs-hunyuan` 依赖

### Scenario: design.md 中封面图描述反映当前实现

- **Given** `.darwin/001-ai-blog-development/design.md` 中封面图描述存在过时内容
- **When** 文档更新完成
- **Then** `lib/hunyuan-image.ts` 职责说明为 OpenAI 兼容生图 API 封装
- **And** cover API 的认证说明为 HUNYUAN_API_KEY
- **And** 外部服务域名为 `api.cloudai.tencent.com`

---

## Feature: 代码质量修复（Review Minor 建议）

### Scenario: summary 路由不包含未使用的 import

- **Given** `app/api/ai/summary/route.ts` 中存在未使用的 `getHunyuanClient` import
- **When** 修复完成
- **Then** 该文件的 import 中不包含 `getHunyuanClient`
- **And** 文件功能正常不受影响

### Scenario: API 路由统一使用 hunyuan provider

- **Given** 4 个 API 路由文件中各自重复创建 `createOpenAI` 实例
- **When** 修复完成
- **Then** 所有 API 路由统一从 `lib/hunyuan.ts` 导入 provider
- **And** 不存在重复的 `createOpenAI` 调用

### Scenario: AiSearch 不包含冗余的 Cmd+K 监听器

- **Given** `components/ai/AiSearch.tsx` 中存在冗余的 Cmd+K 事件监听器
- **When** 修复完成
- **Then** 该文件仅保留 Escape 键的事件监听
- **And** Cmd+K 搜索切换功能不受影响（由 SearchButton 处理）

### Scenario: embeddings.ts 不包含未使用的函数

- **Given** `lib/embeddings.ts` 中存在未使用的 `loadEmbeddingIndex` 函数
- **When** 修复完成
- **Then** 该文件不包含 `loadEmbeddingIndex` 函数和 `cachedIndex` 变量
- **And** 搜索功能正常不受影响

---

## Feature: 暗色主题支持

### Scenario: 管理页面在暗色主题下正常展示

- **Given** 用户的系统或浏览器设置为暗色主题
- **When** 用户访问任一管理页面
- **Then** 页面背景、文字、边框、按钮颜色均遵循暗色主题配色
- **And** 所有交互元素在暗色主题下清晰可辨

### Scenario: 管理页面在亮色主题下正常展示

- **Given** 用户的系统或浏览器设置为亮色主题
- **When** 用户访问任一管理页面
- **Then** 页面使用亮色主题配色

---

## Feature: 测试覆盖

### Scenario: 所有管理页面组件有对应测试

- **Given** 新增了管理中心首页、封面图生成、自动标签、写作助手四个页面组件
- **When** 执行测试套件
- **Then** 四个页面组件均有对应的测试文件
- **And** 所有测试通过

### Scenario: 新增 API 路由有对应测试

- **Given** 新增了 `/api/admin/articles` 和 `/api/admin/tags/write` 两个 API 路由
- **When** 执行测试套件
- **Then** 两个 API 路由均有对应的测试文件
- **And** 所有测试通过

---

## 覆盖矩阵

| 需求编号 | 需求描述                                         | 覆盖 Scenario                                                                                                                              | 状态 |
| -------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ---- |
| FR-1     | 创建 /admin/cover 页面，输入标题摘要提交生成任务 | 用户输入标题和摘要成功生成封面图, 用户仅输入标题成功生成封面图                                                                             | ✅   |
| FR-2     | 封面图轮询显示进度，完成后展示预览               | 用户输入标题和摘要成功生成封面图, 封面图生成超时                                                                                           | ✅   |
| FR-3     | 封面图下载和复制 URL 功能                        | 封面图生成完成后用户下载图片, 封面图生成完成后用户复制 URL                                                                                 | ✅   |
| FR-4     | 创建 /admin/tags 页面展示文章列表                | 用户访问标签管理页面看到文章列表, 文章列表为空时的展示                                                                                     | ✅   |
| FR-5     | 点击生成标签获取建议，支持勾选                   | 用户为一篇文章生成标签建议, 用户取消勾选部分建议标签                                                                                       | ✅   |
| FR-6     | 写入 frontmatter 按钮                            | 用户将选定标签写入文章 frontmatter                                                                                                         | ✅   |
| FR-7     | 创建 /admin/writing 页面文本输入区域             | 用户输入文本并请求润色, 用户未输入文本就点击操作按钮                                                                                       | ✅   |
| FR-8     | 润色和续写按钮流式展示                           | 用户输入文本并请求润色, 用户输入文本并请求续写                                                                                             | ✅   |
| FR-9     | 复制结果和替换原文按钮                           | 用户复制 AI 返回的结果, 用户将 AI 结果替换到输入区域                                                                                       | ✅   |
| FR-10    | 更新 plan.md 生图描述                            | plan.md 中生图描述反映当前实现                                                                                                             | ✅   |
| FR-11    | 更新 design.md 封面图描述                        | design.md 中封面图描述反映当前实现                                                                                                         | ✅   |
| FR-12    | 移除 summary 未使用 import                       | summary 路由不包含未使用的 import                                                                                                          | ✅   |
| FR-13    | 统一 hunyuan provider                            | API 路由统一使用 hunyuan provider                                                                                                          | ✅   |
| FR-14    | 移除 AiSearch 冗余 Cmd+K 监听                    | AiSearch 不包含冗余的 Cmd+K 监听器                                                                                                         | ✅   |
| FR-15    | 移除 embeddings 未使用函数                       | embeddings.ts 不包含未使用的函数                                                                                                           | ✅   |
| FR-16    | 创建 /admin 首页管理中心                         | 用户访问管理中心首页看到功能入口, 用户通过管理中心卡片跳转到功能页面                                                                       | ✅   |
| NFR-1    | 管理页面不在公开导航栏展示                       | 公开导航栏不展示管理中心入口                                                                                                               | ✅   |
| NFR-2    | 封面图轮询超时 3 分钟                            | 封面图生成超时                                                                                                                             | ✅   |
| NFR-3    | 管理页面有单元测试覆盖                           | 所有管理页面组件有对应测试, 新增 API 路由有对应测试                                                                                        | ✅   |
| NFR-4    | 管理页面支持亮色/暗色主题                        | 管理页面在暗色主题下正常展示, 管理页面在亮色主题下正常展示                                                                                 | ✅   |
| AC-1     | 访问 /admin 看到三张功能卡片                     | 用户访问管理中心首页看到功能入口                                                                                                           | ✅   |
| AC-2     | 输入标题点击生成显示进度和预览                   | 用户输入标题和摘要成功生成封面图                                                                                                           | ✅   |
| AC-3     | 下载图片和复制 URL                               | 封面图生成完成后用户下载图片, 封面图生成完成后用户复制 URL                                                                                 | ✅   |
| AC-4     | 超时停止轮询并提示                               | 封面图生成超时                                                                                                                             | ✅   |
| AC-5     | 标签页面展示文章列表                             | 用户访问标签管理页面看到文章列表                                                                                                           | ✅   |
| AC-6     | 生成标签并可勾选                                 | 用户为一篇文章生成标签建议, 用户取消勾选部分建议标签                                                                                       | ✅   |
| AC-7     | 写入 frontmatter 并显示成功                      | 用户将选定标签写入文章 frontmatter                                                                                                         | ✅   |
| AC-8     | 润色/续写流式展示                                | 用户输入文本并请求润色, 用户输入文本并请求续写                                                                                             | ✅   |
| AC-9     | 复制结果和替换原文                               | 用户复制 AI 返回的结果, 用户将 AI 结果替换到输入区域                                                                                       | ✅   |
| AC-10    | 文档更新反映当前实现                             | plan.md 中生图描述反映当前实现, design.md 中封面图描述反映当前实现                                                                         | ✅   |
| AC-11    | 5 个 Minor 建议全部修复                          | summary 路由不包含未使用的 import, API 路由统一使用 hunyuan provider, AiSearch 不包含冗余的 Cmd+K 监听器, embeddings.ts 不包含未使用的函数 | ✅   |
| AC-12    | 所有测试通过                                     | 所有管理页面组件有对应测试, 新增 API 路由有对应测试                                                                                        | ✅   |

## 验收标准

- [ ] 所有 Scenario 将在 Implement 阶段有对应的自动化测试
- [x] 所有 FR-\* 至少被 1 个 Scenario 覆盖
- [x] 所有 AC-\* 至少被 1 个 Scenario 覆盖
- [x] 无 [待澄清] 标记
