---
title: 口袋光谱仪
tagline: 用 3D 打印外壳和一颗衍射光栅，做一个能装进口袋的光谱仪
description: 手机摄像头 + 透射光栅 + 3D 打印遮光罩，拍下光谱后用 Python 提取波长强度曲线。目前还在和他的光轴较劲。
date: 2026-09-27
status: 制作中
tags: ['光学', 'Python', '3D打印']
cover: /img/covers/spectrometer-mini.png
stack: ['Python', 'OpenCV', 'Fusion 360', 'Pillow']
links:
  - label: 进度日志
    url: https://github.com/yourname/spectrometer-mini
order: 2
---

# 口袋光谱仪

## 目标

做一个成本低于 100 元、能塞进外套口袋的透射式光谱仪。用来分辨不同光源的谱线，比如钠灯、荧光灯、LED。

## 目前的结构

- 入射狭缝：0.2mm，用剃须刀片夹出来
- 光栅：1000 线/mm 的透射光栅片
- 成像：手机主摄，焦距固定
- 外壳：FDM 打印，内壁贴黑色绒布

## 软件

```python
import cv2
import numpy as np

img = cv2.imread('spectrum.png', cv2.IMREAD_GRAYSCALE)
rows = img[img.shape[0] // 2 - 8 : img.shape[0] // 2 + 8]
profile = rows.mean(axis=0)
```

再用已知的汞灯谱线做波长标定，二次拟合就够了。

## 现在的问题

1. 杂散光太严重，零级像把一级谱糊掉了
2. 手机自动曝光会压掉最亮的谱线
3. 3D 打印件的螺纹精度不够，光栅角度总是差一点

## 下一步

- 加一个可调光阑
- 用暗箱 + 手电筒做单色光源验证
- 把标定流程写成一个 CLI 工具

> 光学系统最气人的地方在于：每一个零件都「差不多」，最后合起来就是「差很多」。