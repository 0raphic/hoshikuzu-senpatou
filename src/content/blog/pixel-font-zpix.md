---
title: 像素字体与中文排版
description: 用 Zpix 给中文网页做像素排版，12px 的倍数、字体回退，以及「清晰」这件小事。
date: 2026-10-06
tags: ['排版', '像素', '前端']
cover: /img/covers/pixel-font-zpix.png
---

# 像素字体与中文排版

像素字体有一种很奇怪的力量：它让文字看起来像是从一台旧机器里长出来的，而不是被排版软件摆上去的。

本站用的字体是 **Zpix**（最像素），一款覆盖简体中文、日文假名和拉丁字母的 12px 像素字体。作者是 SolidZORO，开源免费。

## 为什么是 12px

像素字体是按整数像素网格设计的。如果字号不是设计尺寸的整数倍，浏览器会做插值，字就会糊。

```css
@font-face {
  font-family: 'Zpix';
  src: url('/fonts/zpix.woff2') format('woff2');
  font-display: swap;
}

body {
  font-family: 'Zpix', 'Noto Sans SC', monospace;
  font-size: 12px;
  line-height: 1.9;
  image-rendering: pixelated;
}
```

我给自己定了几个档位：

| 用途 | 字号 | 行高 |
| --- | --- | --- |
| 正文 | 12px | 1.9 |
| 次要说明 | 12px | 1.6 |
| 小标题 | 18px | 1.5 |
| 页面主标题 | 30px | 1.3 |
| Hero 大标题 | 42px | 1.15 |

全部是 6 的倍数，也就是 12 的一半的倍数。这个规则让放大后的字仍然落在网格上。

## 中文排版的三个细节

### 一、不要用 `letter-spacing` 凑字距

像素字体的字宽是固定的，加字距会让原本对齐的笔画错位。中文段落靠**行高**呼吸，而不是靠字距。

### 二、标点符号要留白

```css
.prose p {
  text-align: justify;
  text-justify: inter-ideograph;
}
```

两端对齐在中文长段落里很好看，但记得给行内代码和链接留一点 `padding`，否则它们会顶到上一行的字。

### 三、标题的「像素描边」

我特别喜欢给标题加 1px 的错位阴影，看起来像老式显示器的色差：

```css
.hero__title {
  text-shadow: 2px 2px 0 var(--pink-deep), 4px 4px 0 rgba(0, 0, 0, 0.35);
}
```

这个效果在深色背景上是粉色的，在浅色主题里换成紫色，不然会脏。

## 字体回退

Zpix 的 woff2 大概 940KB，包含完整 CJK，不算小。首屏我用了 `font-display: swap`，并且只 preload 这一个文件。英文和符号部分其实可以再拆子集，但本地开发阶段先不折腾。

> 一个小提醒：像素字体在 4K 屏幕上会显得非常小。所以我在 `@media (min-width: 1600px)` 里把根字号提到 14px，虽然不再是整数倍，但可读性更重要。

## 最后

有人觉得像素字体是「故意做旧」。我不这么想。它只是提醒你：屏幕是由一个个点组成的，文字也是。知道这件事以后，排版会变得诚实一点。