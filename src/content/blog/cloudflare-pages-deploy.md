---
title: 把电波发射到 Cloudflare
description: 从本地构建到 Cloudflare Pages 上线，顺便记一下 Functions 和缓存的那点事。
date: 2026-10-23
tags: ['Cloudflare', '部署', 'Astro']
cover: /img/covers/cloudflare-pages-deploy.png
---

# 把电波发射到 Cloudflare

本地跑通只是第一步。一个博客如果只有自己能看见，那它更像日记本，而不是「站」。

## 构建

Astro 的构建产物在 `dist/`：

```bash
npm run build
npm run preview   # 本地预览生产版本
```

构建时会做这些事：

1. 生成所有静态页面（`build.format: 'directory'`，所以是 `about/index.html`）
2. 把 `public/` 里的素材原样复制过去
3. 生成 `sitemap-index.xml` 和 `rss.xml`
4. 用 Shiki 给代码块上色（我选的是 `synthwave-84`，紫粉色的那个）

## 接到 Cloudflare Pages

最省事的方式是让 Cloudflare 直接连 Git 仓库：

- **Build command**：`npm run build`
- **Build output directory**：`dist`
- **Node version**：在环境变量里设 `NODE_VERSION=22`

第一次部署大概两分钟。之后每次 push 都会自动构建，PR 还会生成预览地址，这一点非常舒服。

## 自定义域名与缓存

静态资源的缓存策略，我写在 `public/_headers` 里：

```text
/fonts/*
  Cache-Control: public, max-age=31536000, immutable

/img/*
  Cache-Control: public, max-age=31536000, immutable

/*.html
  Cache-Control: public, max-age=0, must-revalidate
```

带 hash 的资源可以放心缓存一年；HTML 必须每次校验，不然新文章发不出去。

## Functions 做一点点后端

留言板如果只存在 `localStorage` 里，那它其实是个「单机留言板」。所以准备用 Pages Functions 写两个小接口：

```ts
// functions/api/guestbook.ts
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.DB.prepare(
    'SELECT * FROM guestbook ORDER BY created_at DESC LIMIT 50'
  ).all();
  return Response.json({ entries: results });
};
```

数据库用 D1，免费额度对一个小站来说绰绰有余。没有配置数据库的时候，前端会自动退回到本地存储模式——这样本地开发不需要任何依赖。

## 上线前检查清单

- [x] `site` 写对，RSS 和 sitemap 才不会是 localhost
- [x] 404 页面存在
- [x] favicon 和 apple-touch-icon 都有
- [x] OG 图是 1200×630
- [ ] 把 `SITE.author` 里的占位链接换成真的
- [ ] 备案？（想了想，没有）

## 一点私心

我希望这个站有一天能出现在别人的友链里。到那时候，页脚那个 88×31 的小徽章就会真的被点击一次。

为了那一次点击，也值得把缓存头写对。