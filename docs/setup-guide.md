# AI Blog 服务配置指南

本指南帮助你配置博客所需的全部外部服务。配置完成后，所有功能即可正常运行。

## 当前状态速查

| 功能                                    | 所需环境变量                               | 当前状态   |
| --------------------------------------- | ------------------------------------------ | ---------- |
| AI 文本功能（摘要/聊天/搜索/标签/写作） | `HUNYUAN_API_KEY`                          | 已配置     |
| AI 封面图生成                           | `TENCENT_SECRET_ID` + `TENCENT_SECRET_KEY` | 已配置     |
| 管理后台                                | `ADMIN_PASSWORD`                           | 已配置     |
| Giscus 评论                             | `NEXT_PUBLIC_GISCUS_*` (4个)               | **未配置** |
| 网站流量统计 + 页面浏览量               | `NEXT_UMAMI_ID` + `UMAMI_API_TOKEN`        | **未配置** |
| 封面图一键应用到文章                    | `GITHUB_TOKEN`                             | **未配置** |

---

## 一、Giscus 评论系统

Giscus 基于 GitHub Discussions，访客通过 GitHub 账号登录后发表评论，免费且无需数据库。

### 步骤 1：安装 Giscus App

访问 https://github.com/apps/giscus ，点击 **Install**，选择 `Corner430/ai-blog` 仓库。

### 步骤 2：开启 GitHub Discussions

1. 打开 https://github.com/Corner430/ai-blog/settings
2. 向下滚动到 **Features** 部分
3. 勾选 **Discussions**
4. 保存

### 步骤 3：获取配置值

1. 打开 https://giscus.app
2. **仓库**：填入 `Corner430/ai-blog`（验证通过会显示绿色提示）
3. **Discussion 分类**：选择 `Announcements`（只有仓库管理员能创建新 Discussion，防止垃圾评论）
4. **映射方式**：选择 `pathname`
5. 页面底部会生成一段 `<script>` 代码，从中提取 4 个值

### 步骤 4：添加环境变量

在 `.env.local` 中添加：

```bash
# Giscus 评论
NEXT_PUBLIC_GISCUS_REPO=Corner430/ai-blog
NEXT_PUBLIC_GISCUS_REPOSITORY_ID=<giscus.app 页面的 data-repo-id>
NEXT_PUBLIC_GISCUS_CATEGORY=Announcements
NEXT_PUBLIC_GISCUS_CATEGORY_ID=<giscus.app 页面的 data-category-id>
```

### 验证

重启开发服务器，打开任意文章页面，滚动到底部点击"加载评论"，应该能看到 Giscus 评论区。

---

## 二、Umami 网站统计

Umami 是一个开源的、注重隐私的网站访问统计工具，类似 Google Analytics 但更轻量。配置后可以：

- 在 Umami 后台查看整体流量（PV、UV、来源、设备等）
- 在博客文章页面显示"xxx 次浏览"

### 方案选择

| 方案                    | 费用                   | 说明                     |
| ----------------------- | ---------------------- | ------------------------ |
| **Umami Cloud**（推荐） | 免费版支持 10K 事件/月 | 官方托管，无需自建服务器 |
| 自建 Umami              | 需要一台服务器         | 数据完全自控，无限制     |

> 个人博客推荐用 **Umami Cloud 免费版**，足够用。

### 步骤 1：注册 Umami Cloud

1. 打开 https://cloud.umami.is
2. 点击 **Sign up** 注册账号
3. 登录后进入 Dashboard

### 步骤 2：添加网站

1. 点击左侧 **Settings** → **Websites** → **Add website**
2. 填写：
   - **Name**：`Corner430 AI Blog`
   - **Domain**：`corner430-ai-blog.vercel.app`
3. 保存后，点击刚创建的网站，找到 **Website ID**（一个 UUID 格式的字符串，如 `a1b2c3d4-e5f6-...`）

### 步骤 3：获取 API Token

1. 点击左侧 **Settings** → **API Keys**（或 **Profile** → **API keys**）
2. 点击 **Create token**
3. 复制生成的 Token

### 步骤 4：添加环境变量

在 `.env.local` 中添加：

```bash
# Umami 统计
NEXT_UMAMI_ID=<步骤 2 获取的 Website ID>
UMAMI_API_TOKEN=<步骤 3 获取的 API Token>
```

### 步骤 5：确认追踪脚本生效

项目已通过 pliny 集成了 Umami 追踪脚本（`data/siteMetadata.js` 中的 `umamiAnalytics` 配置），设置 `NEXT_UMAMI_ID` 后会自动在每个页面注入追踪代码。

### 验证

1. 重启开发服务器
2. 访问几个页面
3. 回到 Umami Cloud Dashboard，应该能看到实时访问数据
4. 打开一篇文章页面，标题下方应显示 "xxx 次浏览"（新部署的站点需要积累一些访问数据后才会显示）

---

## 三、GitHub Token（封面图应用功能）

管理后台的"封面图生成"功能可以 AI 生成封面后一键写入到文章的 frontmatter 中。这个操作通过 GitHub API 提交 commit，需要一个有仓库写入权限的 Token。

### 步骤 1：创建 Fine-grained Token

1. 打开 https://github.com/settings/tokens?type=beta
2. 点击 **Generate new token**
3. 填写：
   - **Token name**：`ai-blog-cover`
   - **Expiration**：选择一个合理的期限（如 90 天或 1 年）
   - **Repository access**：选择 **Only select repositories** → 选择 `Corner430/ai-blog`
   - **Permissions** → **Repository permissions**：
     - **Contents**：设为 **Read and write**（其他保持默认即可）
4. 点击 **Generate token**
5. 复制生成的 Token（以 `github_pat_` 开头）

### 步骤 2：添加环境变量

在 `.env.local` 中添加：

```bash
# GitHub Token（封面图应用功能）
GITHUB_TOKEN=<步骤 1 生成的 Token>
```

### 验证

1. 重启开发服务器
2. 访问 `/admin/cover`
3. 选择一篇文章，生成封面图后点击"应用到文章"
4. 检查 GitHub 仓库是否有新的 commit 更新了文章的 `images` 字段

---

## 完整 .env.local 模板

配置完成后，你的 `.env.local` 应该类似这样：

```bash
# === 已配置 ===

# AI 文本功能（腾讯混元）
HUNYUAN_API_KEY=sk-xxxxx

# AI 封面图生成（腾讯云）
TENCENT_SECRET_ID=AKIDxxxxx
TENCENT_SECRET_KEY=xxxxx

# 管理后台密码
ADMIN_PASSWORD=xxxxx

# === 需要配置 ===

# Giscus 评论
NEXT_PUBLIC_GISCUS_REPO=Corner430/ai-blog
NEXT_PUBLIC_GISCUS_REPOSITORY_ID=
NEXT_PUBLIC_GISCUS_CATEGORY=Announcements
NEXT_PUBLIC_GISCUS_CATEGORY_ID=

# Umami 统计
NEXT_UMAMI_ID=
UMAMI_API_TOKEN=

# GitHub Token
GITHUB_TOKEN=
```

---

## Vercel 环境变量同步

本地配置好 `.env.local` 后，**生产环境（Vercel）也需要配置同样的环境变量**：

1. 打开 https://vercel.com → 进入 `ai-blog` 项目
2. 点击 **Settings** → **Environment Variables**
3. 逐个添加上面的所有变量（或使用 Vercel CLI：`vercel env pull` / `vercel env add`）
4. 添加后需要**重新部署**才能生效（Deployments → 最新一次 → Redeploy）

> **注意**：`NEXT_PUBLIC_` 开头的变量会暴露在客户端 JS 中，这是正常的——Giscus 的 repo 信息本身就是公开的。
