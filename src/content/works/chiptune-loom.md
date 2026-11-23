---
title: 芯片音乐织机
tagline: 用网格「织」出一段 8-bit 旋律
description: 一个步进音序器，支持四轨、音长拖拽、实时合成和导出 WAV。灵感来自 LSDJ 和那些装在 Game Boy 里的曲子。
date: 2026-11-02
status: 制作中
tags: ['音乐', 'WebAudio', '工具']
cover: /img/covers/chiptune-loom.png
stack: ['TypeScript', 'Web Audio API', 'Canvas']
links:
  - label: 源码
    url: https://github.com/yourname/chiptune-loom
order: 4
---

# 芯片音乐织机

名字里的「织机」来自一个比喻：把音符当成线，一格一格地织成布。

## 设计

- 4 条轨道：Pulse 1 / Pulse 2 / Triangle / Noise
- 32 步循环，可改每步音高、音量、音长
- 所有声音实时合成，不采样
- 支持导出 16-bit WAV

## 音序器核心

```ts
const scheduler = () => {
  while (nextNoteTime < ctx.currentTime + 0.1) {
    scheduleStep(currentStep, nextNoteTime);
    nextNoteTime += 60 / bpm / 4;
    currentStep = (currentStep + 1) % 32;
  }
};
setInterval(scheduler, 25);
```

提前 100ms 调度，`setInterval` 只负责「看一眼」，不负责发声。这是 Web Audio 的标准做法。

## 现在的样子

界面上是一张 4×32 的格子，点一下亮一格。右上角有个小小的示波器，画着实时的波形。

## 还没做完

- 音长拖拽（现在只能点单格）
- 复制/粘贴段落
- 导出时把 master 音量做归一化
- 移动端的手势操作

> 做工具最开心的时刻，是发现自己开始用它做别的东西。