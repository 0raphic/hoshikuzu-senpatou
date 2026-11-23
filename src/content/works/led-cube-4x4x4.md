---
title: 4×4×4 LED 立方体
tagline: 512 颗灯珠，一块洞洞板，和三个通宵
description: 用 STM32 驱动 4×4×4 的单色 LED 立方体，能显示文字、动画和频谱。焊到第十四层的时候我学会了深呼吸。
date: 2026-03-14
status: 完成
tags: ['硬件', 'STM32', 'LED']
cover: /img/covers/led-cube-4x4x4.png
stack: ['STM32F103', 'C', 'KiCad', '洞洞板']
links:
  - label: 源码
    url: https://github.com/yourname/led-cube
featured: true
order: 1
---

# 4×4×4 LED 立方体

这是我最喜欢的一个作品，因为它看得见、摸得着，而且会亮。

## 结构

- **主控**：STM32F103C8T6 最小系统板
- **层驱动**：4 个 PNP 三极管，逐层扫描
- **列驱动**：74HC595 串行移位，16 列 × 4 层
- **电源**：5V 2A，实测峰值 1.2A

## 扫描方式

每一层点亮 1/4 的时间，刷新率保持在 200Hz 以上，肉眼看不出闪烁。

```c
for (uint8_t layer = 0; layer < 4; layer++) {
  shift_out(columns[layer]);
  select_layer(layer);
  delay_us(800);
  deselect_all();
}
```

## 显示的内容

1. 一个旋转的线框立方体
2. 逐字滚动的「HOSHI」
3. 跟随 BGM 的 4 段频谱（用 ADC 采样麦克风）
4. 一颗慢慢呼吸的星星

## 踩过的坑

> 焊到第十四层的时候，有一列死活不亮。查了两个小时，发现是 595 的一个输出脚虚焊。

还有一次，整块板子突然不工作，最后发现是 USB 线太长，压降太大。换了一根短的就好了。

## 想做的事

- 换成立体的 PCB，而不是洞洞板
- 加上陀螺仪，做成体感旋转
- 支持 Wi-Fi 更新动画

不过那大概是下一个假期的事了。