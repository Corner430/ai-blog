# AI博客完整搭建方案

## 一、项目概览

基于 `tailwind-nextjs-starter-blog` 模板（GitHub 10.4k Stars），搭建集成腾讯云混元AI的现代博客。

- 模板地址：https://github.com/timlrx/tailwind-nextjs-starter-blog
- 最新版本：v2.4.0（2025-03-31）
- 许可证：MIT

---

## 二、技术栈

| 层面 | 技术 | 说明 |
|------|------|------|
| 框架 | Next.js 14 (App Router) | 前后端一体，React Server Component |
| 语言 | TypeScript | 类型安全 |
| 样式 | Tailwind CSS 3.0 | 快速写样式，支持primary color换肤 |
| 内容 | MDX (Markdown + JSX) | 写文章，可嵌入React组件 |
| 内容管理 | Contentlayer | 把MDX转成类型化数据 |
| AI大模型 | 腾讯云混元 (OpenAI兼容接口) | 文本生成、Embedding |
| AI生图 | 腾讯云混元生图 (云API 3.0) | 封面图生成 |
| 图片存储 | GitHub仓库图床 | 专用仓库存图 |
| 部署 | Vercel | 免费，git push自动部署 |
| 评论 | Giscus | 基于GitHub Discussions |
| 搜索 | AI语义搜索 (Embedding) | 替代传统关键词搜索 |

---

## 三、AI模型选择（只用最好的）

### 文本模型
- **Tencent HY 2.0 Think** — 最强推理模型
  - 用途：文章摘要、文章问答、自动标签、写作助手
  - 价格：输入3.975元/百万tokens，输出15.9元/百万tokens（32k以内）
  - 价格：输入5.3元/百万tokens，输出21.2元/百万tokens（32k-128k）

### Embedding模型
- **hunyuan-embedding** — 文本向量化
  - 用途：语义搜索（文章向量化）
  - 价格：0.7元/百万tokens
  - 维度：固定1024
  - 免费额度：独立100万tokens，有效期1年

### 生图模型
- **混元生图** — SubmitHunyuanImageJob
  - 用途：自动生成文章封面图
  - 支持：文生图、图生图、风格转换、超分辨率
  - 分辨率：最高1280x720 / 720x1280等
  - 超分：支持2倍(x2)和4倍(x4)
  - 并发：默认1个并发任务

### API接入信息
- OpenAI兼容接口：`https://api.hunyuan.cloud.tencent.com/v1`
- 认证方式：Bearer Token (`Authorization: Bearer $HUNYUAN_API_KEY`)
- 生图接口域名：`hunyuan.tencentcloudapi.com`
- 生图认证：腾讯云API 3.0签名（SecretId + SecretKey, TC3-HMAC-SHA256）
- 生图地域：`ap-guangzhou`
- 生图API版本：`2023-09-01`

### 免费额度
- 文本模型（HY 2.0 Think等）：共享100万tokens，有效期1年（注意：HY 2.0系列自2026年2月6日起暂停免费额度）
- Embedding：独立100万tokens，有效期1年
- Hunyuan-lite：永久免费

---

## 四、AI功能清单（6项）

### 4.1 AI文章摘要
- 触发：用户打开文章详情页
- 效果：顶部流式输出一段AI总结
- 接口：`/api/ai/summary`
- 模型：Tencent HY 2.0 Think
- 实现：流式调用LLM，传入文章内容，要求生成简短摘要

### 4.2 AI文章问答
- 触发：用户点击右下角浮窗，输入问题
- 效果：AI基于当前文章内容回答
- 接口：`/api/ai/chat`
- 模型：Tencent HY 2.0 Think
- 实现：RAG模式，将文章内容作为context，用户问题作为query

### 4.3 AI语义搜索
- 触发：用户在搜索框输入自然语言
- 效果：返回语义相关的文章列表
- 接口：`/api/ai/search`
- 模型：hunyuan-embedding
- 实现：build时生成所有文章的embedding索引，搜索时计算余弦相似度

### 4.4 AI自动标签
- 触发：发布文章时
- 效果：自动建议分类标签
- 接口：`/api/ai/tags`
- 模型：Tencent HY 2.0 Think
- 实现：传入文章内容，要求返回标签列表

### 4.5 AI封面图生成
- 触发：手动点击"生成封面"按钮
- 效果：根据文章标题/摘要生成一张封面图
- 接口：`/api/ai/cover`
- 模型：混元生图（SubmitHunyuanImageJob）
- 实现：异步任务模式（提交任务→轮询→获取图片URL）
- 分辨率：推荐1280:720（16:9）

### 4.6 AI写作助手
- 触发：后台写作时手动触发
- 效果：AI帮助润色、续写文章内容
- 接口：`/api/ai/writing`
- 模型：Tencent HY 2.0 Think

---

## 五、图片方案

### GitHub仓库图床
- 创建专用仓库：`{username}/blog-images`
- 目录结构：按年月组织 `2026/03/xxx.png`
- 引用格式：`https://raw.githubusercontent.com/{username}/blog-images/main/2026/03/xxx.png`
- AI生成的封面图也上传到此仓库

### 国内加速（可选）
- 腾讯云CDN加速GitHub图床
- 或直接使用腾讯云COS（对象存储）作为备选
  - 免费额度：50GB存储/6个月

---

## 六、搭建步骤

### 第1步：初始化项目
- `npx degit timlrx/tailwind-nextjs-starter-blog` 拉取模板
- `yarn` 安装依赖
- 配置 `data/siteMetadata.js`（站点名称、描述、URL等）
- 配置 `data/authors/default.md`（作者信息）
- 替换 `data/logo.svg`（Logo）

### 第2步：配置腾讯云混元
- 创建 `.env.local`：
  ```
  HUNYUAN_API_KEY=xxx           # 混元OpenAI兼容接口的API Key
  TENCENT_SECRET_ID=xxx         # 腾讯云SecretId（生图用）
  TENCENT_SECRET_KEY=xxx        # 腾讯云SecretKey（生图用）
  ```
- 创建 `lib/hunyuan.ts`：封装OpenAI兼容SDK调用
- 创建 `lib/hunyuan-image.ts`：封装云API 3.0生图调用
- 修改 `next.config.js`：CSP白名单添加 `api.hunyuan.cloud.tencent.com`

### 第3步：开发AI文章摘要
- 创建 `app/api/ai/summary/route.ts`
- 创建 `components/ai/AiSummary.tsx`（流式展示组件）
- 修改 `layouts/PostLayout.tsx` 集成摘要组件
- 修改 `layouts/PostBanner.tsx` 集成摘要组件

### 第4步：开发AI文章问答
- 创建 `app/api/ai/chat/route.ts`
- 创建 `components/ai/AiChat.tsx`（右下角浮窗）
- 在文章详情页布局中引入

### 第5步：开发AI语义搜索
- 创建 `lib/embeddings.ts`（Embedding索引工具）
- 创建构建脚本：build时生成所有文章的embedding并存为JSON
- 创建 `app/api/ai/search/route.ts`
- 创建 `components/ai/AiSearch.tsx`
- 替换模板原有的Kbar/Algolia搜索

### 第6步：开发AI封面图生成
- 创建 `app/api/ai/cover/route.ts`
  - 调用SubmitHunyuanImageJob提交任务
  - 轮询QueryHunyuanImageJob获取结果
- 创建管理界面或脚本，一键为文章生成封面

### 第7步：开发AI自动标签
- 创建 `app/api/ai/tags/route.ts`
- 集成到发布流程

### 第8步：配置图床
- GitHub上创建 `blog-images` 仓库
- 编写图片上传脚本/工具
- 可选：配置腾讯云CDN

### 第9步：部署
- GitHub创建博客代码仓库，push代码
- Vercel连接GitHub仓库
- Vercel中配置环境变量（API Keys）
- 可选：绑定自定义域名

---

## 七、新增目录结构

```
app/
├── api/ai/
│   ├── summary/route.ts    # AI摘要接口
│   ├── chat/route.ts       # AI问答接口
│   ├── search/route.ts     # AI语义搜索接口
│   ├── cover/route.ts      # AI封面图生成接口
│   ├── tags/route.ts       # AI自动标签接口
│   └── writing/route.ts    # AI写作助手接口
components/
├── ai/
│   ├── AiSummary.tsx       # AI摘要组件（流式输出）
│   ├── AiChat.tsx          # AI问答浮窗
│   └── AiSearch.tsx        # AI语义搜索框
lib/
├── hunyuan.ts              # 混元文本API封装（OpenAI兼容）
├── hunyuan-image.ts        # 混元生图API封装（云API 3.0）
└── embeddings.ts           # Embedding索引工具
```

---

## 八、关键文件修改清单

| 文件 | 修改内容 |
|------|---------|
| `data/siteMetadata.js` | 站点基本信息（名称、描述、URL、社交链接） |
| `data/authors/default.md` | 作者信息 |
| `data/headerNavLinks.ts` | 导航链接 |
| `data/logo.svg` | 站点Logo |
| `.env.local` | 腾讯云API Key（HUNYUAN_API_KEY, SECRET_ID, SECRET_KEY） |
| `next.config.js` | CSP白名单添加混元API域名 |
| `layouts/PostLayout.tsx` | 集成AI摘要组件和AI问答浮窗 |
| `layouts/PostBanner.tsx` | 集成AI摘要组件和AI问答浮窗 |
| `layouts/PostSimple.tsx` | 集成AI摘要组件和AI问答浮窗 |
| `package.json` | 新增依赖（openai SDK, tencentcloud SDK等） |

---

## 九、依赖包

```json
{
  "openai": "^4.x",
  "tencentcloud-sdk-nodejs-hunyuan": "^4.x",
  "ai": "^3.x"
}
```

---

## 十、费用预估（个人博客）

| 项目 | 费用 |
|------|------|
| Vercel部署 | 免费 |
| GitHub图床 | 免费 |
| 混元AI文本 | 免费额度100万tokens，超出后约几元/月 |
| 混元Embedding | 免费额度100万tokens |
| 混元生图 | 按张计费，个人博客每月几元 |
| 域名（可选） | 约60元/年 |
| **总计** | 基本免费，高频使用也就几十元/月 |

---

## 十一、模板自带功能参考

### 布局
- PostLayout：双栏，左侧作者信息
- PostSimple：简化单栏
- PostBanner：顶部大图Banner

### 已集成
- 分析：Umami / Plausible / Google Analytics
- 评论：Giscus / Utterances / Disqus
- Newsletter：Mailchimp / Buttondown等
- 搜索：Kbar / Algolia（将被AI搜索替换）
- 代码高亮：rehype-prism-plus
- 数学公式：KaTeX
- 主题：亮色/暗色切换
- SEO：RSS / Sitemap / Canonical URL

### 配置文件
- `data/siteMetadata.js` — 站点元数据（核心配置文件）
- `contentlayer.config.ts` — 内容模型定义
- `tailwind.config.js` — 样式配置
- `components/MDXComponents.js` — 自定义MDX组件
