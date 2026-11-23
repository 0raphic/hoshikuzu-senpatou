#!/usr/bin/env python
"""星屑電波塔 — 站点像素素材生成器

全部素材由 Pillow 程序化绘制，无外部图片依赖。
用法：python scripts/gen_assets.py
字体：scripts/fonts/zpix.ttf（仅本地使用，已加入 .gitignore）
"""

from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
IMG = PUBLIC / "img"
FONT_PATH = Path(__file__).resolve().parent / "fonts" / "zpix.ttf"

INK = (32, 16, 51, 255)
INK_HEX = "#201033"

BAYER = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
]


# --------------------------------------------------------------------------
# 基础工具
# --------------------------------------------------------------------------


def rgb(value: str, alpha: int | None = None) -> tuple[int, ...]:
    value = value.lstrip("#")
    r, g, b = (int(value[i : i + 2], 16) for i in (0, 2, 4))
    if alpha is None:
        return (r, g, b)
    return (r, g, b, alpha)


def lerp(a: tuple[int, ...], b: tuple[int, ...], t: float) -> tuple[int, ...]:
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(len(a)))


def font(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONT_PATH), size)


def text_size(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.FreeTypeFont) -> tuple[int, int]:
    left, top, right, bottom = draw.textbbox((0, 0), text, font=fnt)
    return right - left, bottom - top


def draw_text(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    fnt: ImageFont.FreeTypeFont,
    fill: tuple[int, ...],
    shadow: tuple[int, ...] | None = None,
    anchor: str = "la",
) -> None:
    x, y = xy
    if shadow:
        draw.text((x + 2, y + 2), text, font=fnt, fill=shadow, anchor=anchor)
    draw.text((x, y), text, font=fnt, fill=fill, anchor=anchor)


def wrap_text(
    draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.FreeTypeFont, max_width: int
) -> list[str]:
    lines: list[str] = []
    current = ""
    for char in text:
        trial = current + char
        if draw.textlength(trial, font=fnt) > max_width and current:
            lines.append(current)
            current = char
        else:
            current = trial
    if current:
        lines.append(current)
    return lines


def gradient(w: int, h: int, c1: str, c2: str, c3: str | None = None, dither: bool = True) -> Image.Image:
    a = rgb(c1)
    b = rgb(c2)
    c = rgb(c3) if c3 else None
    img = Image.new("RGB", (w, h))
    pixels = img.load()
    for y in range(h):
        t = y / max(1, h - 1)
        if c and t > 0.55:
            color = lerp(b, c, (t - 0.55) / 0.45)
        elif c:
            color = lerp(a, b, t / 0.55)
        else:
            color = lerp(a, b, t)
        for x in range(w):
            noise = 0
            if dither:
                noise = int((BAYER[y % 4][x % 4] / 16.0 - 0.5) * 7)
            pixels[x, y] = tuple(max(0, min(255, channel + noise)) for channel in color)
    return img


def overlay(img: Image.Image) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    return layer, ImageDraw.Draw(layer)


def flatten(img: Image.Image, layer: Image.Image) -> Image.Image:
    return Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")


def scanlines(img: Image.Image, alpha: int = 26, step: int = 3) -> Image.Image:
    layer, draw = overlay(img)
    for y in range(0, img.height, step):
        draw.line((0, y, img.width, y), fill=(3, 1, 12, alpha))
    return flatten(img, layer)


def add_stars(
    draw: ImageDraw.ImageDraw,
    w: int,
    h: int,
    seed: int,
    count: int = 90,
    colors: tuple[str, ...] = ("#ffe08a", "#ff7ad9", "#79e6ff", "#ffffff"),
) -> None:
    rng = random.Random(seed)
    for _ in range(count):
        x = rng.randrange(0, w)
        y = rng.randrange(0, h)
        color = rgb(rng.choice(colors), rng.choice((90, 130, 180, 230)))
        draw.point((x, y), fill=color)
        if rng.random() < 0.18:
            draw.line((x - 1, y, x + 1, y), fill=color)
            draw.line((x, y - 1, x, y + 1), fill=color)


def perspective_grid(
    draw: ImageDraw.ImageDraw,
    w: int,
    h: int,
    horizon: int,
    color: tuple[int, ...],
) -> None:
    cx = w // 2
    for i in range(-14, 15):
        draw.line((cx + i * 14, horizon, cx + i * 90, h), fill=color, width=1)
    y = horizon
    step = 6
    while y < h:
        draw.line((0, y, w, y), fill=color, width=1)
        step = int(step * 1.28) + 1
        y += step


def corner_brackets(draw: ImageDraw.ImageDraw, w: int, h: int, color: tuple[int, ...], size: int = 14) -> None:
    for x, y, dx, dy in ((3, 3, 1, 1), (w - 4, 3, -1, 1), (3, h - 4, 1, -1), (w - 4, h - 4, -1, -1)):
        draw.line((x, y, x + dx * size, y), fill=color, width=2)
        draw.line((x, y, x, y + dy * size), fill=color, width=2)


# --------------------------------------------------------------------------
# 小图标（16×16 逻辑像素，放大绘制）
# --------------------------------------------------------------------------


def blit_icon(img: Image.Image, x: int, y: int, scale: int, kind: str, accent: str, light: str = "#ffffff") -> None:
    draw = ImageDraw.Draw(img)
    a = rgb(accent)
    l = rgb(light)
    d = rgb(INK_HEX)

    def rect(gx: int, gy: int, gw: int, gh: int, color: tuple[int, ...]) -> None:
        draw.rectangle((x + gx * scale, y + gy * scale, x + (gx + gw) * scale - 1, y + (gy + gh) * scale - 1), fill=color)

    if kind == "moon":
        rect(3, 0, 10, 16, a)
        rect(0, 3, 16, 10, a)
        rect(2, 2, 12, 12, a)
        rect(5, 3, 2, 2, d)
        rect(9, 7, 2, 3, d)
        rect(4, 10, 2, 2, d)
        rect(3, 3, 2, 2, l)
    elif kind == "star":
        for gx, gy, gw, gh in ((7, 0, 2, 16), (0, 7, 16, 2), (3, 3, 10, 10), (5, 5, 6, 6)):
            rect(gx, gy, gw, gh, a)
        rect(6, 6, 4, 4, l)
    elif kind == "grid":
        for gx in range(0, 16, 4):
            rect(gx, 0, 1, 16, a)
        for gy in range(0, 16, 4):
            rect(0, gy, 16, 1, a)
        rect(7, 7, 2, 2, l)
    elif kind == "wave":
        heights = [3, 7, 11, 15, 9, 5, 12, 8, 14, 6, 10, 4]
        for i, height in enumerate(heights):
            rect(i + 2, 16 - height, 1, height, a)
    elif kind == "cloud":
        rect(3, 7, 11, 7, a)
        rect(1, 9, 14, 5, a)
        rect(5, 4, 4, 4, a)
        rect(9, 3, 3, 4, a)
        rect(3, 11, 10, 2, l)
    elif kind == "lens":
        rect(2, 4, 12, 9, a)
        rect(4, 2, 8, 2, a)
        rect(4, 13, 8, 2, a)
        rect(6, 6, 4, 4, l)
        rect(7, 7, 2, 2, d)
    elif kind == "window":
        rect(1, 2, 14, 12, a)
        rect(1, 2, 14, 3, l)
        rect(2, 3, 2, 1, d)
        rect(5, 3, 2, 1, d)
        rect(8, 3, 2, 1, d)
        for gy in (7, 9, 11):
            rect(3, gy, 8, 1, l)
    elif kind == "palette":
        rect(2, 3, 12, 11, a)
        rect(4, 2, 8, 1, a)
        for gx, gy in ((4, 5), (8, 5), (4, 9), (8, 9), (11, 7)):
            rect(gx, gy, 2, 2, l)
        rect(12, 11, 2, 2, d)
    elif kind == "cube":
        rect(4, 2, 8, 6, l)
        rect(2, 5, 3, 8, a)
        rect(11, 5, 3, 8, a)
        rect(4, 9, 8, 5, a)
        rect(6, 11, 2, 2, d)
    elif kind == "signal":
        for gx, gy, gw, gh in ((1, 11, 3, 4), (6, 7, 3, 8), (11, 2, 3, 13)):
            rect(gx, gy, gw, gh, a)
    elif kind == "floppy":
        rect(2, 2, 12, 12, a)
        rect(5, 1, 6, 5, l)
        rect(4, 9, 8, 5, l)
        rect(6, 3, 2, 2, d)
    elif kind == "ring":
        rect(3, 3, 10, 10, a)
        rect(5, 5, 6, 6, d)
        rect(4, 4, 2, 2, l)
        rect(10, 10, 2, 2, l)
    else:
        rect(4, 4, 8, 8, a)


# --------------------------------------------------------------------------
# 背景与头像
# --------------------------------------------------------------------------


def make_tile_stars() -> None:
    size = 160
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    rng = random.Random(20260901)
    for _ in range(110):
        x = rng.randrange(size)
        y = rng.randrange(size)
        color = rgb(rng.choice(("#ffe08a", "#ff7ad9", "#79e6ff", "#ffffff", "#a98bff")), rng.choice((70, 110, 150, 210)))
        r = rng.choice((1, 1, 1, 2))
        for ox in (-size, 0, size):
            for oy in (-size, 0, size):
                draw.rectangle((x + ox, y + oy, x + ox + r - 1, y + oy + r - 1), fill=color)
        if rng.random() < 0.1:
            draw.line((x - 1, y, x + 1, y), fill=color)
            draw.line((x, y - 1, x, y + 1), fill=color)
    img.save(IMG / "tile-stars.png")


def make_tile_paper() -> None:
    size = 160
    img = Image.new("RGB", (size, size), rgb("#f6efff"))
    draw = ImageDraw.Draw(img)
    for i in range(0, size, 8):
        draw.line((i, 0, i, size), fill=rgb("#eadcff"), width=1)
        draw.line((0, i, size, i), fill=rgb("#eadcff"), width=1)
    rng = random.Random(42)
    for _ in range(260):
        x, y = rng.randrange(size), rng.randrange(size)
        draw.point((x, y), fill=rgb(rng.choice(("#e3d3fb", "#fff6ff", "#d9c6f7"))))
    img.save(IMG / "tile-paper.png")


def make_moon() -> None:
    size = 60
    art = Image.new("RGBA", (size * 4, size * 4), (0, 0, 0, 0))
    draw = ImageDraw.Draw(art)
    cx = cy = size * 2
    r = size * 1.55
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=rgb("#ffeec2"))
    draw.ellipse((cx - r + 12, cy - r + 10, cx + r - 40, cy + r - 52), fill=rgb("#ffe08a"))
    for ox, oy, rr in ((-22, -18, 12), (16, 6, 16), (-8, 26, 9), (28, -24, 7), (-34, 8, 6)):
        x = cx + ox * 3
        y = cy + oy * 3
        draw.ellipse((x - rr * 2, y - rr * 2, x + rr * 2, y + rr * 2), fill=rgb("#e8c98f"))
    # 光晕
    glow = Image.new("RGBA", art.size, (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    for i in range(6, 0, -1):
        gdraw.ellipse(
            (cx - r - i * 8, cy - r - i * 8, cx + r + i * 8, cy + r + i * 8),
            fill=rgb("#ffd8f2", 10),
        )
    art = Image.alpha_composite(glow, art)
    art.resize((240, 240), Image.Resampling.NEAREST).save(IMG / "moon.png")


def make_sun() -> None:
    size = 240
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx = cy = size // 2
    for i in range(12):
        angle = i * math.pi / 6
        x1 = cx + math.cos(angle) * 60
        y1 = cy + math.sin(angle) * 60
        x2 = cx + math.cos(angle) * 110
        y2 = cy + math.sin(angle) * 110
        draw.line((x1, y1, x2, y2), fill=rgb("#ffb0e6"), width=6)
    draw.ellipse((cx - 56, cy - 56, cx + 56, cy + 56), fill=rgb("#ffe08a"))
    draw.ellipse((cx - 44, cy - 44, cx + 44, cy + 44), fill=rgb("#ffd166"))
    draw.ellipse((cx - 30, cy - 30, cx - 18, cy - 18), fill=rgb("#fff3c9"))
    img.save(IMG / "sun.png")


def make_avatar() -> None:
    art = 40
    img = Image.new("RGB", (art, art), rgb("#24103d"))
    draw = ImageDraw.Draw(img)
    for y in range(art):
        for x in range(art):
            if (x + y) % 9 == 0:
                draw.point((x, y), fill=rgb("#3a1c63"))
    # 头发
    draw.rectangle((6, 4, 33, 38), fill=rgb("#8f6fe8"))
    draw.rectangle((4, 10, 35, 30), fill=rgb("#8f6fe8"))
    draw.rectangle((8, 2, 31, 8), fill=rgb("#a98bff"))
    # 脸
    draw.rectangle((10, 9, 29, 29), fill=rgb("#ffe3d3"))
    draw.rectangle((11, 8, 28, 12), fill=rgb("#ffe3d3"))
    # 刘海
    draw.rectangle((8, 6, 31, 11), fill=rgb("#8f6fe8"))
    draw.rectangle((8, 11, 12, 20), fill=rgb("#8f6fe8"))
    draw.rectangle((27, 11, 31, 22), fill=rgb("#8f6fe8"))
    # 眼睛
    draw.rectangle((13, 14, 16, 18), fill=rgb("#3b1b5e"))
    draw.rectangle((23, 14, 26, 18), fill=rgb("#3b1b5e"))
    draw.rectangle((14, 14, 15, 15), fill=rgb("#ffffff"))
    draw.rectangle((24, 14, 25, 15), fill=rgb("#ffffff"))
    draw.rectangle((13, 19, 17, 20), fill=rgb("#ffb0d8"))
    draw.rectangle((22, 19, 26, 20), fill=rgb("#ffb0d8"))
    # 嘴
    draw.rectangle((19, 22, 21, 23), fill=rgb("#c2457f"))
    # 水手服
    draw.rectangle((8, 30, 31, 39), fill=rgb("#2b2350"))
    draw.polygon([(12, 30), (20, 36), (28, 30)], fill=rgb("#f3edff"))
    draw.rectangle((18, 33, 22, 39), fill=rgb("#ff7ad9"))
    # 星星发夹
    for gx, gy in ((5, 4), (6, 3), (7, 4), (6, 5), (6, 6)):
        draw.point((gx, gy), fill=rgb("#ffe08a"))
    img.resize((160, 160), Image.Resampling.NEAREST).save(IMG / "avatar.png")


# --------------------------------------------------------------------------
# 封面
# --------------------------------------------------------------------------

COVERS = [
    {
        "slug": "hello-world",
        "title": "在月面搭建一座电波塔",
        "kicker": "BLOG 001 / HELLO",
        "colors": ("#120a2a", "#3a1a63", "#0a0618"),
        "accent": "#ff7ad9",
        "light": "#ffe08a",
        "icon": "moon",
    },
    {
        "slug": "astro-content-collections",
        "title": "内容集合的一点点心得",
        "kicker": "BLOG 002 / ASTRO",
        "colors": ("#0b1330", "#123a63", "#081020"),
        "accent": "#79e6ff",
        "light": "#a98bff",
        "icon": "grid",
    },
    {
        "slug": "pixel-font-zpix",
        "title": "像素字体与中文排版",
        "kicker": "BLOG 003 / TYPOGRAPHY",
        "colors": ("#2a0f2e", "#6b1b5b", "#160820"),
        "accent": "#ffe08a",
        "light": "#ff7ad9",
        "icon": "palette",
    },
    {
        "slug": "cloudflare-pages-deploy",
        "title": "把电波发射到 Cloudflare",
        "kicker": "BLOG 004 / DEPLOY",
        "colors": ("#2b1408", "#7a3a0e", "#120a06"),
        "accent": "#ffb347",
        "light": "#79e6ff",
        "icon": "cloud",
    },
    {
        "slug": "optics-lab-notes",
        "title": "光学实验室的午後",
        "kicker": "BLOG 005 / LAB NOTE",
        "colors": ("#08251f", "#0f4f42", "#051712"),
        "accent": "#a6ffcb",
        "light": "#ffe08a",
        "icon": "lens",
    },
    {
        "slug": "chiptune-web-audio",
        "title": "用 Web Audio 合成芯片音乐",
        "kicker": "BLOG 006 / CHIPTUNE",
        "colors": ("#1a0b2e", "#4a1a6b", "#0d0618"),
        "accent": "#ff3d9a",
        "light": "#79e6ff",
        "icon": "wave",
    },
    {
        "slug": "led-cube-4x4x4",
        "title": "4×4×4 LED 立方体",
        "kicker": "WORK 001 / HARDWARE",
        "colors": ("#071f2b", "#0d4a5c", "#04121a"),
        "accent": "#79e6ff",
        "light": "#a6ffcb",
        "icon": "cube",
    },
    {
        "slug": "spectrometer-mini",
        "title": "口袋光谱仪",
        "kicker": "WORK 002 / OPTICS",
        "colors": ("#1c1030", "#4b2a7a", "#0d0818"),
        "accent": "#a98bff",
        "light": "#ffe08a",
        "icon": "signal",
    },
    {
        "slug": "pixel-asset-forge",
        "title": "像素素材锻造炉",
        "kicker": "WORK 003 / TOOL",
        "colors": ("#2a0d20", "#6b2148", "#140711"),
        "accent": "#ff7ad9",
        "light": "#ffe08a",
        "icon": "palette",
    },
    {
        "slug": "chiptune-loom",
        "title": "芯片音乐织机",
        "kicker": "WORK 004 / AUDIO",
        "colors": ("#0b241f", "#175c4d", "#06130f"),
        "accent": "#a6ffcb",
        "light": "#ff7ad9",
        "icon": "wave",
    },
    {
        "slug": "old-web-snippets",
        "title": "旧网页代码碎片集",
        "kicker": "WORK 005 / ARCHIVE",
        "colors": ("#141428", "#33436b", "#0a0a14"),
        "accent": "#9fb6ff",
        "light": "#ffe08a",
        "icon": "window",
    },
]

DEFAULT_COVER = {
    "slug": "default",
    "title": "星屑電波塔",
    "kicker": "HOSHIKUZU DENPATOU",
    "colors": ("#120a2a", "#3a1a63", "#0a0618"),
    "accent": "#ff7ad9",
    "light": "#79e6ff",
    "icon": "star",
}


def make_cover(spec: dict) -> None:
    w, h = 640, 360
    img = gradient(w, h, *spec["colors"])
    layer, draw = overlay(img)
    accent = rgb(spec["accent"])
    light = rgb(spec["light"])
    faint_accent = rgb(spec["accent"], 60)

    add_stars(draw, w, h, seed=sum(ord(c) for c in spec["slug"]), count=110)
    perspective_grid(draw, w, h, horizon=246, color=rgb(spec["accent"], 34))
    draw.line((0, 246, w, 246), fill=rgb(spec["accent"], 90), width=1)

    # 右上角图标
    blit_icon(img, w - 116, 44, 4, spec["icon"], spec["accent"], spec["light"])

    # 水印编号
    try:
        number = spec["kicker"].split("/")[-1].strip()
    except Exception:
        number = "000"
    big = font(120)
    draw.text((w - 24, h - 20), number, font=big, fill=rgb(spec["accent"], 26), anchor="rs")

    # 文案
    draw_text(draw, (36, 34), spec["kicker"], font(12), accent, shadow=rgb("#000000", 160))
    draw.line((36, 58, 36 + 44, 58), fill=accent, width=2)
    draw.line((36, 58, 36, 58 + 8), fill=accent, width=2)

    title_font = font(36)
    lines = wrap_text(draw, spec["title"], title_font, 470)
    y = 88
    for line in lines[:3]:
        draw_text(draw, (36, y), line, title_font, rgb("#ffffff"), shadow=rgb("#160823", 220))
        y += 48

    # 底部信息条
    draw.rectangle((36, h - 56, w - 36, h - 56), fill=rgb(spec["accent"], 120))
    draw_text(draw, (36, h - 44), "HOSHIKUZU DENPATOU", font(12), rgb("#ffe08a"))
    draw_text(draw, (w - 36, h - 44), "PIXEL / WEB / MEMORY", font(12), accent, anchor="ra")

    # 小装饰方块
    for i in range(5):
        draw.rectangle((36 + i * 10, h - 76, 42 + i * 10, h - 70), fill=light if i % 2 else accent)

    corner_brackets(draw, w, h, accent, 18)
    img = flatten(img, layer)
    img = scanlines(img, alpha=22)
    img.save(IMG / "covers" / f"{spec['slug']}.png")


def make_og() -> None:
    w, h = 1200, 630
    img = gradient(w, h, "#0a0618", "#2c1250", "#120a2a")
    layer, draw = overlay(img)
    accent = rgb("#ff7ad9")
    light = rgb("#79e6ff")
    add_stars(draw, w, h, seed=99, count=220)
    perspective_grid(draw, w, h, horizon=430, color=rgb("#ff7ad9", 30))
    blit_icon(img, w - 300, 90, 9, "moon", "#ffe08a", "#ffffff")

    draw_text(draw, (80, 84), "HOSHIKUZU DENPATOU / PERSONAL BLOG", font(12), accent)
    draw.line((80, 116, 190, 116), fill=accent, width=3)
    draw_text(draw, (80, 150), "星屑電波塔", font(84), rgb("#ffffff"), shadow=rgb("#2a0d44"))
    draw_text(draw, (80, 264), "从月面发回的、没有营养的电波。", font(24), light)
    draw_text(draw, (80, 320), "主页 ／ 博客 ／ 作品集 ／ 碎碎念 ／ 仓库 ／ 留言板", font(12), rgb("#ffe08a"))

    draw.rectangle((80, h - 150, w - 80, h - 80), fill=rgb("#1a1038", 210), outline=accent, width=2)
    draw_text(draw, (104, h - 128), "ASTRO 5 × CLOUDFLARE PAGES ／ SINCE 2026.09", font(12), rgb("#ffffff"))
    draw_text(draw, (104, h - 104), "BEST VIEWED AT 1024 × 768 ／ PIXEL FONT: ZPIX", font(12), rgb("#a98bff"))
    corner_brackets(draw, w, h, accent, 24)
    img = flatten(img, layer)
    scanlines(img, alpha=18).save(IMG / "og-default.png")


# --------------------------------------------------------------------------
# 徽章 / 好友头像 / 心情图标 / 计数器
# --------------------------------------------------------------------------

BADGES = [
    ("hoshikuzu", "星屑電波塔", "#ff3d9a", "#7a1b5e", "#ffe08a", "star"),
    ("astro", "ASTRO INSIDE", "#1b1140", "#ff5d01", "#ffffff", "star"),
    ("cloudflare", "CF PAGES", "#f38020", "#8a3d05", "#ffffff", "cloud"),
    ("y2k", "Y2K OK", "#22304f", "#9fb6ff", "#ffe08a", "sparkle"),
    ("webring", "NIGHT WEBRING", "#2a1250", "#a98bff", "#ff7ad9", "ring"),
    ("friend-moon", "月面电台", "#3a1a63", "#ff7ad9", "#ffe08a", "moon"),
    ("friend-sea", "电子之海", "#0b3a4a", "#79e6ff", "#a6ffcb", "wave"),
    ("friend-mint", "薄荷汽水", "#0d3b2e", "#a6ffcb", "#ffffff", "star"),
    ("friend-pixel", "像素锅炉房", "#3a2408", "#ffb347", "#ffe08a", "grid"),
    ("friend-optics", "光学迷路", "#241040", "#a98bff", "#79e6ff", "lens"),
    ("friend-book", "旧书摊", "#3a1a12", "#ffb08a", "#ffe08a", "floppy"),
]


def make_badge(filename: str, label: str, bg1: str, bg2: str, accent: str, icon: str) -> None:
    scale = 3
    w, h = 88, 31
    small = Image.new("RGB", (w, h), rgb(bg1))
    draw = ImageDraw.Draw(small)
    for y in range(h):
        draw.line((0, y, w, y), fill=lerp(rgb(bg1), rgb(bg2), y / (h - 1)))
    draw.rectangle((0, 0, w - 1, h - 1), outline=rgb("#ffffff", 200))
    draw.rectangle((1, 1, w - 2, h - 2), outline=rgb("#000000", 90))
    # 斜纹装饰
    for x in range(-h, w, 6):
        draw.line((x, h - 1, x + h, 0), fill=rgb("#ffffff", 18), width=1)

    icon_size = 14
    icon_img = Image.new("RGBA", (16 * 2, 16 * 2), (0, 0, 0, 0))
    blit_icon(icon_img, 0, 0, 2, icon, accent, "#ffffff")
    icon_img = icon_img.resize((icon_size, icon_size), Image.Resampling.NEAREST)
    small.paste(icon_img, (w - icon_size - 4, (h - icon_size) // 2), icon_img)

    draw.text((4, h // 2), label, font=font(12), fill=rgb("#ffffff"), anchor="lm", stroke_width=1, stroke_fill=rgb("#000000", 160))
    small.resize((w * scale, h * scale), Image.Resampling.NEAREST).save(IMG / "badges" / f"{filename}.png")


FRIEND_ART = {
    "rabbit": ("#ffd9ec", "#ff7ad9"),
    "robot": ("#79e6ff", "#2b6f8a"),
    "cat": ("#a6ffcb", "#2f7d57"),
    "ghost": ("#f3edff", "#a98bff"),
    "star": ("#ffe08a", "#e0952f"),
    "book": ("#ffb08a", "#8a3d2a"),
}


def make_friend(kind: str) -> None:
    art = 24
    img = Image.new("RGBA", (art, art), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    main, shade = (rgb(c) for c in FRIEND_ART[kind])
    outline = rgb(INK_HEX)

    def box(x0: int, y0: int, x1: int, y1: int, color: tuple[int, ...]) -> None:
        draw.rectangle((x0, y0, x1, y1), fill=color)

    if kind == "rabbit":
        box(6, 1, 9, 12, main)
        box(14, 1, 17, 12, main)
        box(6, 2, 8, 8, shade)
        box(15, 2, 16, 8, shade)
        box(4, 9, 19, 22, main)
        box(6, 12, 8, 15, outline)
        box(15, 12, 17, 15, outline)
        box(11, 17, 12, 18, shade)
        box(4, 21, 7, 23, main)
        box(16, 21, 19, 23, main)
    elif kind == "robot":
        box(5, 6, 18, 20, main)
        box(6, 7, 17, 12, shade)
        box(7, 9, 9, 11, outline)
        box(14, 9, 16, 11, outline)
        box(10, 14, 13, 15, outline)
        box(11, 1, 12, 5, outline)
        box(11, 0, 12, 1, main)
        box(2, 10, 4, 15, main)
        box(19, 10, 21, 15, main)
        box(7, 20, 16, 22, shade)
    elif kind == "cat":
        box(4, 8, 19, 21, main)
        box(5, 4, 8, 9, main)
        box(15, 4, 18, 9, main)
        box(6, 5, 7, 7, shade)
        box(16, 5, 17, 7, shade)
        box(7, 12, 9, 14, outline)
        box(14, 12, 16, 14, outline)
        box(11, 15, 12, 16, shade)
        box(4, 20, 19, 22, shade)
        draw.line((18, 18, 22, 16), fill=shade, width=1)
    elif kind == "ghost":
        box(6, 4, 17, 21, main)
        box(5, 6, 18, 18, main)
        box(6, 4, 9, 6, main)
        box(14, 4, 17, 6, main)
        box(8, 10, 10, 13, outline)
        box(14, 10, 16, 13, outline)
        box(11, 16, 13, 18, outline)
        box(6, 21, 8, 23, main)
        box(10, 21, 12, 22, main)
        box(15, 21, 17, 23, main)
    elif kind == "star":
        points = [(12, 1), (15, 9), (23, 9), (17, 14), (19, 22), (12, 17), (5, 22), (7, 14), (1, 9), (9, 9)]
        draw.polygon(points, fill=main)
        draw.polygon([(12, 5), (14, 11), (19, 11), (15, 14)], fill=shade)
        box(9, 11, 10, 12, outline)
        box(14, 11, 15, 12, outline)
    else:  # book
        box(3, 5, 20, 20, main)
        box(4, 6, 9, 19, shade)
        box(11, 6, 19, 19, rgb("#f3edff"))
        for y in (9, 12, 15):
            draw.line((12, y, 18, y), fill=rgb("#c9b4e6"), width=1)
        box(3, 4, 20, 6, main)
        box(18, 7, 20, 19, shade)

    img.resize((96, 96), Image.Resampling.NEAREST).save(IMG / "friends" / f"{kind}.png")


MOODS = ["star", "moon", "coffee", "cat", "music", "heart", "cloud", "rain", "snow", "game", "book", "sparkle"]


def make_mood(kind: str) -> None:
    s = 18
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    d = rgb(INK_HEX)
    white = rgb("#ffffff")

    def rect(x0: int, y0: int, x1: int, y1: int, color: tuple[int, ...]) -> None:
        draw.rectangle((x0, y0, x1, y1), fill=color)

    if kind == "star":
        color = rgb("#ffe08a")
        rect(8, 1, 9, 16, color)
        rect(1, 8, 16, 9, color)
        rect(4, 4, 13, 13, color)
        rect(7, 6, 10, 11, white)
        rect(8, 8, 9, 9, rgb("#ffb347"))
    elif kind == "moon":
        color = rgb("#ffeec2")
        draw.ellipse((2, 2, 15, 15), fill=color)
        rect(9, 5, 12, 8, rgb("#e8c98f"))
        rect(5, 10, 7, 12, rgb("#e8c98f"))
    elif kind == "coffee":
        rect(3, 6, 12, 14, rgb("#ffb08a"))
        rect(12, 8, 15, 12, d)
        rect(4, 7, 11, 8, rgb("#8a3d2a"))
        rect(6, 2, 8, 5, rgb("#f3edff"))
        rect(2, 15, 13, 16, d)
    elif kind == "cat":
        color = rgb("#a6ffcb")
        rect(4, 7, 14, 15, color)
        rect(5, 4, 8, 8, color)
        rect(11, 4, 14, 8, color)
        rect(6, 10, 7, 12, d)
        rect(11, 10, 12, 12, d)
        rect(8, 13, 9, 14, rgb("#ff7ad9"))
    elif kind == "music":
        color = rgb("#ff7ad9")
        rect(5, 5, 7, 14, color)
        rect(11, 3, 13, 12, color)
        rect(5, 4, 13, 6, color)
        draw.ellipse((2, 12, 7, 16), fill=color)
        draw.ellipse((8, 10, 13, 14), fill=color)
    elif kind == "heart":
        color = rgb("#ff3d9a")
        rect(3, 5, 8, 9, color)
        rect(10, 5, 15, 9, color)
        rect(2, 7, 16, 11, color)
        rect(4, 11, 14, 13, color)
        rect(6, 13, 12, 15, color)
        rect(8, 15, 10, 16, color)
    elif kind == "cloud":
        color = rgb("#f3edff")
        rect(4, 8, 14, 14, color)
        rect(2, 10, 16, 13, color)
        rect(6, 5, 10, 9, color)
        rect(10, 6, 13, 9, color)
        rect(4, 13, 14, 14, rgb("#a98bff"))
    elif kind == "rain":
        make_mood_cloud(draw)
        for x in (4, 8, 12, 15):
            rect(x, 14, x, 16, rgb("#79e6ff"))
    elif kind == "snow":
        make_mood_cloud(draw)
        rect(3, 14, 5, 16, white)
        rect(8, 15, 9, 17, white)
        rect(13, 14, 15, 16, white)
    elif kind == "game":
        color = rgb("#a98bff")
        rect(2, 6, 16, 14, color)
        rect(3, 5, 6, 15, color)
        rect(12, 5, 15, 15, color)
        rect(6, 9, 7, 11, d)
        rect(8, 9, 10, 10, d)
        rect(12, 9, 13, 10, rgb("#ffe08a"))
        rect(12, 11, 13, 12, rgb("#ffe08a"))
    elif kind == "book":
        rect(3, 4, 15, 15, rgb("#ffb08a"))
        rect(4, 5, 14, 14, rgb("#f3edff"))
        rect(7, 3, 8, 16, rgb("#ff7ad9"))
        for y in (7, 9, 11, 13):
            draw.line((9, y, 13, y), fill=rgb("#c9b4e6"))
    elif kind == "sparkle":
        rect(8, 0, 9, 17, rgb("#ffffff"))
        rect(0, 8, 17, 9, rgb("#ffffff"))
        rect(5, 5, 12, 12, rgb("#ffe08a"))
        rect(8, 8, 9, 9, rgb("#ff7ad9"))
        rect(14, 2, 15, 3, rgb("#79e6ff"))
        rect(2, 14, 3, 15, rgb("#79e6ff"))

    img.save(IMG / "moods" / f"{kind}.png")


def make_mood_cloud(draw: ImageDraw.ImageDraw) -> None:
    color = rgb("#f3edff")
    draw.rectangle((4, 7, 14, 12), fill=color)
    draw.rectangle((6, 4, 10, 8), fill=color)
    draw.rectangle((10, 5, 13, 8), fill=color)
    draw.rectangle((2, 9, 16, 12), fill=color)


def make_counter_digits() -> None:
    segments = {
        0: "abcdef",
        1: "bc",
        2: "abged",
        3: "abgcd",
        4: "fgbc",
        5: "afgcd",
        6: "afgcde",
        7: "abc",
        8: "abcdefg",
        9: "abcdfg",
    }
    w, h = 12, 20
    # 七段坐标（x0, y0, x1, y1）
    geo = {
        "a": (2, 1, 9, 2),
        "b": (9, 2, 10, 9),
        "c": (9, 10, 10, 17),
        "d": (2, 17, 9, 18),
        "e": (1, 10, 2, 17),
        "f": (1, 2, 2, 9),
        "g": (2, 9, 9, 10),
    }
    for digit, active in segments.items():
        img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        for name, (x0, y0, x1, y1) in geo.items():
            if name not in active:
                continue
            draw.rectangle((x0 + 1, y0 + 1, x1 + 1, y1 + 1), fill=rgb("#1a1038"))
            draw.rectangle((x0, y0, x1, y1), fill=rgb("#ff7ad9"))
            draw.rectangle((x0, y0, x1 - 1, y0), fill=rgb("#ffd1f0"))
        img.save(IMG / "counter" / f"{digit}.png")


def make_cursors() -> None:
    arrow = [
        "X...........",
        "XX..........",
        "XwX.........",
        "XwwX........",
        "XwwwX.......",
        "XwwwwX......",
        "XwwwwwX.....",
        "XwwwwwwX....",
        "XwwwwwwwX...",
        "XwwwwwwwwX..",
        "XwwwwwwwwwX.",
        "XwwwwwwXXXX.",
        "XwwwwwX.....",
        "XwwXwwX.....",
        "XwX.XwwX....",
        "XX..XwwX....",
        "X....XwwX...",
        ".....XwwX...",
        "......XX....",
    ]
    img = Image.new("RGBA", (24, 24), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for y, row in enumerate(arrow[:20]):
        for x, char in enumerate(row[:12]):
            if char == "X":
                draw.rectangle((x * 2, y, x * 2 + 1, y), fill=rgb(INK_HEX))
            elif char == "w":
                draw.rectangle((x * 2, y, x * 2 + 1, y), fill=rgb("#ffd1f0"))
    img.save(IMG / "cursor.png")

    pointer = [
        "...XXX......",
        "..XwwwX.....",
        ".XwwwwwX....",
        "XwwwwwwwX...",
        "XwwwwwwwwX..",
        "XwwwwwwwwwX.",
        ".XwwwwwwwwX.",
        "..XwwwwwwwX.",
        "...XwwwwwwX.",
        "...XwwwwwwX.",
        "..XwwwwwwX..",
        "..XwwwwwX...",
        ".XwwwwwX....",
        ".XwwwwX.....",
        "XwwwwX......",
        "XwwwX.......",
        "XwwX........",
        "XwX.........",
        "XX..........",
    ]
    img = Image.new("RGBA", (24, 24), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for y, row in enumerate(pointer):
        for x, char in enumerate(row):
            if char == "X":
                draw.rectangle((x * 2, y, x * 2 + 1, y), fill=rgb(INK_HEX))
            elif char == "w":
                draw.rectangle((x * 2, y, x * 2 + 1, y), fill=rgb("#ffd1f0"))
    img.save(IMG / "cursor-pointer.png")


def make_favicons() -> None:
    art = 16
    img = Image.new("RGB", (art, art), rgb("#0a0618"))
    draw = ImageDraw.Draw(img)
    for x, y in ((2, 3), (13, 4), (4, 12), (12, 11), (8, 2)):
        draw.point((x, y), fill=rgb("#ffe08a"))
    draw.ellipse((3, 4, 12, 13), fill=rgb("#ffeec2"))
    draw.ellipse((7, 3, 14, 10), fill=rgb("#0a0618"))
    img.resize((32, 32), Image.Resampling.NEAREST).save(IMG / "favicon-32.png")
    img.resize((180, 180), Image.Resampling.NEAREST).save(IMG / "apple-touch-icon.png")


def make_404_art() -> None:
    art = 48
    img = Image.new("RGBA", (art, art), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    body = rgb("#f3edff")
    shade = rgb("#a98bff")
    dark = rgb(INK_HEX)
    draw.rectangle((10, 12, 38, 40), fill=body)
    draw.rectangle((8, 16, 40, 32), fill=body)
    draw.rectangle((12, 38, 16, 44), fill=body)
    draw.rectangle((22, 38, 26, 42), fill=body)
    draw.rectangle((32, 38, 36, 44), fill=body)
    draw.rectangle((16, 22, 20, 27), fill=dark)
    draw.rectangle((28, 22, 32, 27), fill=dark)
    draw.rectangle((22, 32, 26, 34), fill=dark)
    draw.rectangle((10, 34, 38, 36), fill=shade)
    img.resize((240, 240), Image.Resampling.NEAREST).save(IMG / "404.png")


# --------------------------------------------------------------------------
# 入口
# --------------------------------------------------------------------------


def ensure_dirs() -> None:
    for folder in ("badges", "counter", "covers", "friends", "moods", "tiny"):
        (IMG / folder).mkdir(parents=True, exist_ok=True)


def main() -> None:
    if not FONT_PATH.exists():
        raise SystemExit(f"缺少字体文件：{FONT_PATH}")
    ensure_dirs()

    make_tile_stars()
    make_tile_paper()
    make_moon()
    make_sun()
    make_avatar()
    make_og()
    for spec in COVERS + [DEFAULT_COVER]:
        make_cover(spec)
    for badge in BADGES:
        make_badge(*badge)
    for kind in FRIEND_ART:
        make_friend(kind)
    for mood in MOODS:
        make_mood(mood)
    make_counter_digits()
    make_cursors()
    make_favicons()
    make_404_art()

    print("素材生成完毕：")
    for path in sorted(IMG.rglob("*.png")):
        print(f"  {path.relative_to(ROOT)}  {path.stat().st_size:,} B")


if __name__ == "__main__":
    main()