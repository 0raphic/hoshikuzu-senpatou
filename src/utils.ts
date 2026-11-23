import type { CollectionEntry } from 'astro:content';

const CN_MONTHS = [
  '一月',
  '二月',
  '三月',
  '四月',
  '五月',
  '六月',
  '七月',
  '八月',
  '九月',
  '十月',
  '十一月',
  '十二月',
];

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

/** 2026.11.20 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

/** 2026 年 11 月 20 日 · 周五 */
export function formatDateLong(date: Date): string {
  return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日 · 周${WEEKDAYS[date.getDay()]}`;
}

/** 2026-11-20 */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** 11.20 */
export function formatMonthDay(date: Date): string {
  return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

export function monthName(month: number): string {
  return CN_MONTHS[month] || '';
}

/** 粗略估算中文阅读时长 */
export function readingTime(body: string | undefined, provided?: number): number {
  if (provided) return provided;
  if (!body) return 1;
  const text = stripMarkdown(body);
  const cjk = (text.match(/[\u4e00-\u9fff\u3040-\u30ff]/g) || []).length;
  const words = (text.match(/[A-Za-z0-9_]+/g) || []).length;
  return Math.max(1, Math.ceil(cjk / 350 + words / 180));
}

/** 去掉 Markdown 标记，给搜索索引和摘要用 */
export function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/[*_~`]/g, '')
    .replace(/\|/g, ' ')
    .replace(/---+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function excerpt(md: string, length = 110): string {
  const text = stripMarkdown(md);
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

export function sortByDateDesc<T extends { data: { date: Date } }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function isPublished(entry: CollectionEntry<'blog' | 'works' | 'notes'>): boolean {
  return !('draft' in entry.data) || !entry.data.draft;
}

export function tagCounts(posts: CollectionEntry<'blog'>[]): { tag: string; count: number }[] {
  const map = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      map.set(tag, (map.get(tag) || 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'zh'));
}

export function groupByYear<T extends { data: { date: Date } }>(items: T[]): { year: number; items: T[] }[] {
  const map = new Map<number, T[]>();
  for (const item of items) {
    const y = item.data.date.getFullYear();
    if (!map.has(y)) map.set(y, []);
    map.get(y)!.push(item);
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, list]) => ({
      year,
      items: list.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf()),
    }));
}

/** 简单稳定的字符串哈希，用来做「今日运势」和随机图 */
export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 按日期取种子：同一天所有人看到同一个结果 */
export function daySeed(offset = 0): number {
  const now = new Date();
  const key = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate() + offset}`;
  return hashString(key);
}

export function isNew(date: Date, days = 14): boolean {
  return Date.now() - date.valueOf() < days * 86400000;
}

/** 数字转成计数器图片的数组 */
export function counterDigits(value: number, pad = 6): string[] {
  return String(Math.max(0, Math.floor(value)))
    .padStart(pad, '0')
    .split('');
}