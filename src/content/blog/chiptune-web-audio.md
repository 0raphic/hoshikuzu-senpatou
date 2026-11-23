---
title: 用 Web Audio 合成芯片音乐
description: 不加载任何音频文件，用振荡器和噪声做出 8-bit 味的背景音乐。
date: 2026-11-19
tags: ['WebAudio', '音乐', '前端']
cover: /img/covers/chiptune-web-audio.png
featured: true
---

# 用 Web Audio 合成芯片音乐

本站右上角那个「BGM」按钮，播放的不是 mp3，而是浏览器现场合成的。

这样做有几个好处：

- 不需要下载几百 KB 的音频文件
- 循环无缝，因为音符是排出来的
- 可以随时改速度、改和弦，甚至根据时间段换调

## 最小的芯片音乐引擎

核心只有三步：建 `AudioContext`、写一个步进函数、用定时器推进。

```ts
const ctx = new AudioContext();
const master = ctx.createGain();
master.gain.value = 0.5;
master.connect(ctx.destination);

function blip(freq: number, time: number, duration: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.18, time + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  osc.connect(gain).connect(master);
  osc.start(time);
  osc.stop(time + duration + 0.02);
}
```

`exponentialRampToValueAtTime` 不能从 0 开始，所以起点用 `0.0001`。这个坑我踩过。

## 音序

一个和弦循环 + 一条旋律就够了。我用的是最俗气的四和弦：

```ts
const CHORDS = [
  { root: 45, notes: [57, 60, 64, 69] }, // Am
  { root: 41, notes: [53, 57, 60, 65] }, // F
  { root: 48, notes: [48, 55, 60, 64] }, // C
  { root: 43, notes: [55, 59, 62, 67] }, // G
];
```

速度 96 BPM，每个十六分音符是 `60 / 96 / 4 = 0.15625` 秒。用 `ctx.currentTime` 提前 100ms 调度，不要用 `setInterval` 直接发声，会抖。

## 音色

| 声部 | 波形 | 作用 |
| --- | --- | --- |
| Bass | triangle | 托住低频 |
| Arp | square | 制造「叮叮」的颗粒感 |
| Lead | square | 主旋律 |
| Kick | sine 下滑 | 每小节第一拍 |
| Hat | 高通噪声 | 十六分音符的沙沙声 |

噪声用 `AudioBuffer` 填随机数，再串一个 `BiquadFilterNode` 的高通。长度 0.05 秒就够。

## 让它听起来「旧」

真正的芯片音乐受限于硬件：只有几个声道、音域窄、没有混响。所以我会故意：

- 把音量包络做得很陡，起音 10ms，衰减 80ms
- 旋律限制在一个八度内
- 偶尔让某个音「迟到」20ms，模拟老主机的调度抖动

```ts
if (Math.random() < 0.06) time += 0.02;
```

就这么一行，整段音乐立刻从「电子」变成了「游戏机」。

## 关于自动播放

浏览器不允许没有用户交互就播放声音，所以本站默认是静音的。第一次点击 BGM 按钮时创建 `AudioContext`，之后就可以正常调度了。

如果哪天你听到这段循环，那就是我在屏幕另一端，用几个方波想你。