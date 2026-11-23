---
title: 像素素材锻造炉
tagline: 一个在浏览器里画 16×16 图标的小工具
description: 支持调色板、洋葱皮、动画帧和导出 PNG/Sprite Sheet，原本只是给这个博客画素材用的，后来越写越大。
date: 2026-10-11
status: 完成
tags: ['工具', 'Canvas', '像素']
cover: /img/covers/pixel-asset-forge.png
stack: ['TypeScript', 'Canvas 2D', 'Vite']
links:
  - label: 在线试用
    url: https://example.com/pixel-forge
  - label: 源码
    url: https://github.com/yourname/pixel-asset-forge
featured: true
order: 3
---

# 像素素材锻造炉

做这个站的时候，我发现找不到一个「够简单」的像素画工具：要么功能太全，打开先迷路；要么导出格式不对。

于是自己写了一个。

## 功能

- 16×16 / 32×32 / 64×64 画布
- 12 色调色板，可以自己改
- 网格、洋葱皮、对称绘制
- 多帧动画，可预览
- 导出单帧 PNG 或横向 Sprite Sheet
- 所有内容存在 IndexedDB，刷新不丢

## 一个技术细节

像素画的关键是**不要插值**：

```ts
ctx.imageSmoothingEnabled = false;
ctx.drawImage(source, 0, 0, size, size);
```

放大 8 倍以后，每个像素就是一个清晰的方块。听起来简单，但很多在线工具偏偏忘了这一行。

## 调色板

默认的 12 色就是本站用的那套：

| 色 | 值 | 用途 |
| --- | --- | --- |
| 深空 | `#0a0618` | 背景 |
| 夜紫 | `#1a1038` | 面板 |
| 星粉 | `#ff7ad9` | 主色 |
| 热粉 | `#ff3d9a` | 强调 |
| 电青 | `#79e6ff` | 次色 |
| 薄荷 | `#a6ffcb` | 成功 |

## 后续

打算加一个「从图片自动减色」的功能，这样可以把照片转成像素风。不过那需要做中位切分，等有空再说。