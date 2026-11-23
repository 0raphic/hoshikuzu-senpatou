/**
 * 留言板 API —— Cloudflare Pages Functions
 *
 *   GET  /api/guestbook   → { entries: GuestEntry[] }（最近 50 条，新的在前）
 *   POST /api/guestbook   → 新增一条留言，返回 { entry }
 *
 * 存储使用 KV（绑定名 GUESTBOOK）。没有绑定 KV 时接口会返回 503，
 * 前端会自动退回到 localStorage 的本地模式，页面照常可用。
 */

interface KVLike {
  get(key: string, options?: { type?: 'text' }): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  list(options?: { prefix?: string; limit?: number }): Promise<{ keys: { name: string }[] }>;
}

interface Env {
  GUESTBOOK?: KVLike;
}

interface GuestEntry {
  id: string;
  name: string;
  message: string;
  site?: string;
  mood?: string;
  date: string;
  /** 云端留言永远是 false，方便前端区分 */
  local?: boolean;
}

const MOODS = ['star', 'moon', 'cat', 'music', 'heart', 'sparkle'];
const MAX_NAME = 24;
const MAX_MESSAGE = 280;
const MAX_SITE = 120;
const LIST_LIMIT = 50;
const RATE_WINDOW_SECONDS = 30;

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function sanitize(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}

function safeUrl(value: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.href;
  } catch {
    /* 忽略非法 URL */
  }
  return undefined;
}

function clientKey(request: Request): string {
  const ip =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown';
  return `rl:${ip}`;
}

async function readEntries(kv: KVLike): Promise<GuestEntry[]> {
  const list = await kv.list({ prefix: 'msg:', limit: 200 });
  const names = list.keys.map((key) => key.name).sort().reverse().slice(0, LIST_LIMIT);
  const raw = await Promise.all(names.map((name) => kv.get(name, { type: 'text' })));
  const entries: GuestEntry[] = [];
  for (const item of raw) {
    if (!item) continue;
    try {
      const parsed = JSON.parse(item) as GuestEntry;
      if (parsed && typeof parsed.name === 'string' && typeof parsed.message === 'string') {
        entries.push(parsed);
      }
    } catch {
      /* 跳过损坏的记录 */
    }
  }
  return entries;
}

export const onRequestOptions = async (): Promise<Response> =>
  new Response(null, { status: 204, headers: JSON_HEADERS });

export const onRequestGet = async (context: { env: Env }): Promise<Response> => {
  const kv = context.env.GUESTBOOK;
  if (!kv) return json({ entries: [], note: 'KV binding GUESTBOOK is not configured.' }, 200);
  try {
    return json({ entries: await readEntries(kv) });
  } catch (error) {
    return json({ error: 'Failed to read guestbook.', detail: String(error) }, 500);
  }
};

export const onRequestPost = async (context: {
  env: Env;
  request: Request;
}): Promise<Response> => {
  const kv = context.env.GUESTBOOK;
  if (!kv) return json({ error: 'KV binding GUESTBOOK is not configured.' }, 503);

  let payload: Record<string, unknown> = {};
  try {
    payload = (await context.request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const name = sanitize(payload.name, MAX_NAME);
  const message = sanitize(payload.message, MAX_MESSAGE);
  const site = safeUrl(sanitize(payload.site, MAX_SITE));
  const moodRaw = sanitize(payload.mood, 20);
  const mood = MOODS.includes(moodRaw) ? moodRaw : 'star';

  if (name.length === 0) return json({ error: 'Name is required.' }, 400);
  if (message.length < 2) return json({ error: 'Message is too short.' }, 400);

  // 简易频率限制：同一 IP 30 秒内只能发一条
  const key = clientKey(context.request);
  try {
    if (await kv.get(key, { type: 'text' })) {
      return json({ error: 'Too many requests, please wait a moment.' }, 429);
    }
    await kv.put(key, '1', { expirationTtl: RATE_WINDOW_SECONDS });
  } catch {
    /* 限流失败不阻断留言 */
  }

  const now = new Date().toISOString();
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const entry: GuestEntry = { id, name, message, site, mood, date: now, local: false };

  try {
    await kv.put(`msg:${now}:${id}`, JSON.stringify(entry));
    return json({ entry }, 201);
  } catch (error) {
    return json({ error: 'Failed to save message.', detail: String(error) }, 500);
  }
};
