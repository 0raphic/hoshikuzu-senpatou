---
title: 旧网页代码碎片集
tagline: 收集那些 2003 年风格的 HTML 小把戏
description: 跑马灯、状态栏滚动、右键菜单、雪花特效、禁止查看源码……一个只为了怀旧的代码博物馆。暂停更新中。
date: 2025-12-08
status: 暂停
tags: ['怀旧', 'HTML', '收藏']
cover: /img/covers/old-web-snippets.png
stack: ['HTML', 'JavaScript', 'CSS']
links:
  - label: 源码
    url: https://github.com/yourname/old-web-snippets
order: 5
---

# 旧网页代码碎片集

这里收藏一些现在几乎没人用、但曾经满互联网都是的代码。

## 目录

- `<marquee>` 跑马灯的各种方向与速度
- `window.status` 状态栏滚动文字
- 跟随鼠标的星星拖尾
- 右键菜单替换成「版权声明」
- 页面进入时的「欢迎光临」弹窗
- 用表格拼出来的 1px 边框
- 雪花 / 樱花 / 气泡飘落特效

## 一段代码

```html
<marquee scrollamount="3" behavior="alternate">
  ★ 欢迎来到我的小站 ★
</marquee>
```

现在看很土，但当年这是「页面有生命」的证明。

## 为什么暂停

一方面，这些东西大多已经不被浏览器支持；另一方面，我发现自己只是在复刻，没有产生新的东西。

也许以后会把它做成一个「可以玩的博物馆」：每点一个展品，页面上就真的运行那段代码。

先把想法记在这里。