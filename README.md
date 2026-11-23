# 星屑電波塔 · HOSHIKUZU DENPATOU

> 从月面发回的、没有营养的电波。

一个古早二次元 / Y2K 风格的个人博客，用 **Astro 5** 手写 CSS 搭建，可一键部署到 **Cloudflare Pages**。
没有 UI 框架、没有 Tailwind、没有追踪脚本；所有像素素材都由 Python + Pillow 程序化生成。

![风格](https://img.shields.io/badge/style-retro%20web%20%2F%20pixel-ff3d9a)
![Astro](https://img.shields.io/badge/Astro-5.x-ff5a03)
![License](https://img.shields.io/badge/content-CC%20BY--NC--SA%204.0-79e6ff)

---

## ✦ 包含什么

| 页面 | 路径 | 说明 |
| --- | --- | --- |
| 主页 | `/` | 头像卡片 + 最新文章 + 碎碎念条 + 作品条 + 侧栏窗口（公告板 / 月面电台 / 运势 / 徽章 / 仓库） |
| 博客 | `/blog/` | 精选大卡 + 标签工具条 + 卡片网格 |
| 文章详情 | `/blog/<id>/` | 阅读进度条、自动目录、上一篇/下一篇、正文排版 |
| 标签 | `/tags/`、`/blog/tags/<tag>/` | 标签云（字号随篇数缩放）+ 单标签列表 |
| 归档 | `/archive/` | 按年份分组的表格时间轴 |
| 作品集 | `/works/`、`/works/<id>/` | 首件作品加宽展示；详情页有「制作资料」侧窗 |
| 碎碎念 | `/notes/` | 时间线 + 按心情（12 种像素图标）前端筛选 |
| 仓库 | `/repos/` | 语言分布条 + 仓库卡片（数据为手动维护的 `src/data/repos.ts` 快照） |
| 关于 | `/about/` | 站长卡片、伪技能条、人生时间线、喜好、装备表 |
| 友链 | `/friends/` | 邻居卡片 + 本站徽章代码（一键复制）+ 申请步骤 |
| 留言板 | `/guestbook/` | 表单 + 留言列表，静态时存 localStorage，接上 KV 后全站可见 |
| 其他 | `/404`、`/rss.xml`、`/search-index.json`、`/sitemap-index.xml` | |

**复古小玩意**：顶部跑马灯公告、CRT 扫描线、像素月亮背景、Win98 风格窗口面板、88×31 徽章、
像素数字计数器、鼠标星屑拖尾、WebAudio 实时合成的芯片音乐 BGM、昼夜主题切换（跟随系统，可手动覆盖）、
`Ctrl/⌘ + K` 或 `/` 呼出站内搜索、键盘上下选择搜索结果。

---

## ✦ 技术栈

- **Astro 5**（静态输出，默认零客户端 JS，只有交互部分按需水合）
- **手写 CSS**：`src/styles/base.css`（设计系统）、`pages.css`（页面）、`prose.css`（正文排版）
- **内容集合**（Content Collections）：博客 / 作品 / 碎碎念均为 Markdown
- **字体**：Zpix 像素字体（自带 `public/fonts/zpix.woff2`，约 966 KB，覆盖中英日）
- **素材生成**：`scripts/gen_assets.py`（Pillow）+ `scripts/fonts/zpix.ttf`（仅本地用，不进仓库）
- **部署**：Cloudflare Pages；留言板可选 Pages Functions + KV

---

## ✦ 本地开发

要求：**Node.js ≥ 20**（推荐 20 或 22 LTS）。

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # 输出到 dist/
npm run preview    # 预览构建结果
npm run gen:assets # 重新生成全部像素素材（需要 Python + Pillow + scripts/fonts/zpix.ttf）
```

> 如果 `npm install` 后构建报 esbuild / sharp 的 postinstall 未执行，运行
> `npm install-scripts approve`（npm 11+）或改用 Node 20 自带 npm 重新安装。
> 本项目不使用 sharp，构建不依赖它。

---

## ✦ 目录结构

```
src/
├── config.ts              # 站点名、作者、导航、运势、一言、webring —— 先改这里
├── content.config.ts      # 三个集合的 frontmatter schema
├── content/
│   ├── blog/              # 6 篇示例文章
│   ├── works/             # 5 个示例作品
│   └── notes/             # 8 条碎碎念
├── data/
│   ├── repos.ts           # 仓库快照（也可改成构建时请求 GitHub API）
│   └── friends.ts         # 友链数据
├── components/            # Header/Footer/Card/Window/Search/计数器… 共 12 个
├── layouts/BaseLayout.astro
├── pages/                 # 全部路由
├── scripts/site.ts        # 主题、BGM、搜索、TOC、碎碎念筛选、留言板、复制、计数器
├── styles/                # base / pages / prose
└── utils.ts               # 日期、阅读时长、标签统计、按年分组、哈希…

public/
├── fonts/zpix.woff2
├── img/                   # 封面、徽章、头像、心情图标、计数器数字、背景贴图…
└── favicon.svg

functions/api/guestbook.ts # Cloudflare Pages Functions（可选）
scripts/gen_assets.py      # 像素素材生成器
wrangler.toml              # Pages 部署配置
```

---

## ✦ 写一篇新文章

在 `src/content/blog/` 新建 `my-post.md`：

```yaml
---
title: 文章标题
description: 一句话摘要，会显示在卡片上
date: 2026-11-23
tags: [Astro, 教程]
cover: /img/covers/default.png   # 可选，缺省用默认封面
featured: false                  # true 时出现在博客页顶部大卡
draft: false                     # true 则完全不生成页面
minutes: 8                       # 可选，手动指定阅读时长
---

正文用 Markdown 写。支持 GFM 表格、任务列表、代码高亮（synthwave-84 主题）。
```

作品（`src/content/works/`）额外支持 `tagline`、`status`（完成/制作中/构思中/暂停）、`stack`、`links`、`order`。
碎碎念（`src/content/notes/`）支持 `mood`（star/moon/coffee/cat/music/heart/cloud/rain/snow/game/book/sparkle）、`pinned`。

---

## ✦ 改成一个属于你的站

1. **站点信息**：`src/config.ts` 里的 `SITE`（站名、作者、邮箱、社交链接、公告、正在做/看/听/读）。
2. **导航**：同文件的 `NAV` / `SUB_NAV`。
3. **视觉**：`src/styles/base.css` 顶部的 CSS 变量（`--pink`、`--cyan`、`--bg`…）与 `[data-theme='day']` 日间配色。
4. **头像与封面**：替换 `public/img/avatar.png`、`public/img/covers/*.png`；或改 `scripts/gen_assets.py` 的 `COVERS` 列表后重跑。
5. **友链 / 仓库**：`src/data/friends.ts`、`src/data/repos.ts`。
6. **域名**：`astro.config.mjs` 的 `site`、`src/config.ts` 的 `SITE.url`（RSS、canonical、sitemap、徽章链接都用它）。

---

## ✦ 部署到 Cloudflare Pages

### 方式 A：Git 集成（推荐）

1. 把仓库推到 GitHub，在 Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git** 选择仓库。
2. 构建设置：
   - Framework preset：**Astro**
   - Build command：`npm run build`
   - Build output directory：`dist`
   - 环境变量：`NODE_VERSION = 20`（可选，避免默认 Node 版本过低）
3. 首次构建完成后绑定自定义域名即可。

### 方式 B：命令行直传

```bash
npm run build
npx wrangler pages deploy dist --project-name hoshikuzu-denpatou
```

### 留言板云端存储（可选）

不配置也能用——留言会保存在访客自己的浏览器里（localStorage）。
想让留言对所有人可见：

1. Dashboard → **Workers & Pages → KV → Create namespace**，名字随意（如 `guestbook`）。
2. 在 Pages 项目 → **Settings → Functions → KV namespace bindings** 添加绑定，**Variable name 必须是 `GUESTBOOK`**。
3. 重新部署。`functions/api/guestbook.ts` 会自动接管 `GET/POST /api/guestbook`。

接口说明：

| 方法 | 路径 | 行为 |
| --- | --- | --- |
| `GET` | `/api/guestbook` | 返回最近 50 条 `{ entries: [...] }` |
| `POST` | `/api/guestbook` | `{ name, message, site?, mood? }` → 新建一条；同 IP 30 秒限一条 |

未绑定 KV 时 `GET` 返回空列表、`POST` 返回 503，前端会静默回落到本地模式，页面不会报错。

---

## ✦ 一些小说明

- **没有评论系统**：文章底部只放了一段占位说明，把读者引到留言板。想接 giscus / Waline 直接替换 `blog/[...slug].astro` 里的 `.comments-box` 即可。
- **仓库数据是快照**：`src/data/repos.ts` 手写维护。想在构建时自动拉取，可在该文件里改成 `await fetch('https://api.github.com/users/<user>/repos')`（注意 Pages 构建时的速率限制）。
- **计数器是「伪」的**：`VisitorCounter.astro` 从建站日期起按天递增 + 访问者本地累加，不做任何跟踪。想要真实统计，接 Cloudflare Web Analytics 或 Umami。
- **字体较大**：Zpix woff2 约 966 KB，已用 `preload` + `font-display: swap`。介意首屏可以换 `@fontsource/fusion-pixel-12px-proportional-sc` 或做子集化。
- **无障碍**：语义标签、跳转链接、`aria-*`、`prefers-reduced-motion` 都已处理；键盘可完成搜索与导航。
- **内容许可**：文字默认 CC BY-NC-SA 4.0，代码可自由取用。

---

写给未来的自己：不要再把博客推倒重来了，改一改就能用。✦
