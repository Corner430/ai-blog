interface Project {
  title: string
  description: string
  href?: string
  imgSrc?: string
}

const projectsData: Project[] = [
  {
    title: 'AI Blog',
    description:
      '基于 Next.js 15 和腾讯混元大模型打造的智能博客系统。集成 AI 摘要生成、语义搜索、智能问答、封面图自动生成、标签推荐和写作助手等功能，支持 MDX 内容格式与 Giscus 评论系统。',
    imgSrc: '/static/images/projects/ai-blog.png',
    href: 'https://github.com/Corner430/ai-blog',
  },
  {
    title: 'FamBank — 家庭内部银行',
    description:
      '一个模拟家庭内部银行的趣味教育项目，帮助孩子建立储蓄与消费意识。支持存取款、利息计算、交易记录查询等功能，使用 Python + Tkinter 构建图形化界面，数据持久化存储于本地 JSON 文件。',
    imgSrc: '/static/images/projects/fambank.png',
    href: 'https://github.com/Corner430/FamBank',
  },
  {
    title: '港股量化分析与模拟交易系统',
    description:
      '面向港股市场的量化分析与模拟交易平台。提供实时行情获取、技术指标计算、K线图可视化、回测引擎和模拟交易功能，基于 Python 生态（pandas、matplotlib、akshare）构建，适合量化交易学习与策略验证。',
    imgSrc: '/static/images/projects/hk-stock.png',
    href: 'https://github.com/Corner430/hk-stock',
  },
  {
    title: 'LazyVim 一键安装工具',
    description:
      'LazyVim 配置的全自动安装脚本，一键完成 Neovim、Node.js、ripgrep 等依赖安装及 LazyVim 配置部署。支持 Ubuntu/Debian 系统，自动处理版本检测与环境配置，让 Neovim IDE 化开箱即用。',
    imgSrc: '/static/images/projects/lazyvim-installer.png',
    href: 'https://github.com/Corner430/lazyvim-installer',
  },
  {
    title: 'WPA/WPA2 密码字典',
    description:
      '精心整理的 WPA/WPA2 WiFi 密码字典集合，用于无线网络安全审计与渗透测试学习。包含常见弱密码、数字组合、手机号模式等多种字典文件，配合 aircrack-ng 等工具使用，仅供授权安全测试用途。',
    imgSrc: '/static/images/projects/wpa-dictionary.png',
    href: 'https://github.com/Corner430/wpa-dictionary',
  },
  {
    title: 'MySQL 必知必会 — 交互式学习系统',
    description:
      '基于《MySQL 必知必会》的交互式实践学习环境。使用 Docker 一键部署 MySQL 数据库并自动导入示例数据，配合 Jupyter Notebook 提供逐章交互式 SQL 练习，从基础查询到高级特性（存储过程、触发器、事务）全覆盖。',
    imgSrc: '/static/images/projects/mysql-crash-course.png',
    href: 'https://github.com/Corner430/mysql-crash-course-interactive',
  },
  {
    title: 'sudo make me a picture',
    description:
      '开箱即用的 AI 文生图提示词速查表，涵盖 36 种视觉风格（草图、3D、插画、摄影、科幻、创意六大类），提供 Prompt 构建公式与程序员 Top 7 推荐风格，复制即用，适合为技术文档、博客和演示文稿快速生成配图。',
    imgSrc: '/static/images/projects/sudo-make-me-a-picture.png',
    href: 'https://github.com/Corner430/sudo-make-me-a-picture',
  },
]

export default projectsData
