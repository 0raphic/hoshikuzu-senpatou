/**
 * 星屑電波塔 — 站点交互脚本
 * 全部为原生 TS / DOM，无第三方依赖。每个模块独立 try/catch，互不影响。
 */

const root = document.documentElement;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const THEME_KEY = 'hoshikuzu.theme';
const GB_KEY = 'hoshikuzu.guestbook.v1';
const COUNTER_KEY = 'hoshikuzu.counter.total';

type Theme = 'night' | 'day';

function $(selector: string, scope: ParentNode = document): HTMLElement | null {
  return scope.querySelector<HTMLElement>(selector);
}

function $all(selector: string, scope: ParentNode = document): HTMLElement[] {
  return Array.from(scope.querySelectorAll<HTMLElement>(selector));
}

/* ============================================================
 * 1. 昼夜主题
 * ========================================================== */

const THEME_META: Record<Theme, string> = {
  night: '#0a0618',
  day: '#f4ecff',
};

function getTheme(): Theme {
  return root.getAttribute('data-theme') === 'day' ? 'day' : 'night';
}

function syncThemeUI(theme: Theme = getTheme()): void {
  const isDay = theme === 'day';
  $all('[data-theme-icon]').forEach((el) => {
    el.textContent = isDay ? '☾' : '☀';
  });
  $all('[data-theme-label]').forEach((el) => {
    el.textContent = isDay ? '夜间' : '白天';
  });
  $all('[data-theme-toggle]').forEach((btn) => {
    const label = isDay ? '切换到夜间主题' : '切换到白天主题';
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
    btn.setAttribute('aria-pressed', String(isDay));
  });
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_META[theme]);
}

function initTheme(): void {
  syncThemeUI();
  document.addEventListener('click', (event) => {
    const target = event.target as Element | null;
    if (!target?.closest('[data-theme-toggle]')) return;
    const next: Theme = getTheme() === 'day' ? 'night' : 'day';
    root.setAttribute('data-theme', next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* 隐私模式忽略 */
    }
    syncThemeUI(next);
  });

  // 用户没有手动选择时，跟随系统切换
  const media = window.matchMedia('(prefers-color-scheme: light)');
  media.addEventListener('change', (event) => {
    try {
      if (localStorage.getItem(THEME_KEY)) return;
    } catch {
      /* ignore */
    }
    const next: Theme = event.matches ? 'day' : 'night';
    root.setAttribute('data-theme', next);
    syncThemeUI(next);
  });
}

/* ============================================================
 * 2. 芯片音乐 BGM（WebAudio 合成，无音频文件）
 * ========================================================== */

interface Chord {
  bass: number;
  arp: number[];
}

const CHORDS: Chord[] = [
  { bass: 45, arp: [57, 60, 64, 69] }, // Am
  { bass: 41, arp: [53, 57, 60, 65] }, // F
  { bass: 48, arp: [48, 55, 60, 64] }, // C
  { bass: 43, arp: [55, 59, 62, 67] }, // G
];

// 64 个十六分音符 = 4 小节 × 4 拍，null 表示休止
const MELODY: (number | null)[] = [
  76, null, 81, null, 84, null, 83, 81, null, 76, null, 79, null, 81, null, null,
  77, null, 81, null, 84, null, 86, 84, null, 81, null, 77, null, 79, null, null,
  79, null, 84, null, 88, null, 86, 84, null, 79, null, 76, null, 79, null, null,
  74, null, 79, null, 83, null, 86, 83, null, 79, null, 74, null, 71, null, null,
];

const TOTAL_STEPS = MELODY.length;
const STEP_SECONDS = 60 / 96 / 4; // 96 BPM 的十六分音符

interface BgmState {
  ctx: AudioContext;
  master: GainNode;
  noise: AudioBuffer;
  step: number;
  nextTime: number;
  timer: number;
}

let bgm: BgmState | null = null;
let bgmPlaying = false;

function mtof(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function makeNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * 0.4);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function playTone(
  state: BgmState,
  time: number,
  midi: number,
  duration: number,
  type: OscillatorType,
  peak: number,
): void {
  const { ctx, master } = state;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(mtof(midi), time);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(peak, time + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  osc.connect(gain);
  gain.connect(master);
  osc.start(time);
  osc.stop(time + duration + 0.03);
}

function playKick(state: BgmState, time: number): void {
  const { ctx, master } = state;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(122, time);
  osc.frequency.exponentialRampToValueAtTime(44, time + 0.1);
  gain.gain.setValueAtTime(0.13, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.14);
  osc.connect(gain);
  gain.connect(master);
  osc.start(time);
  osc.stop(time + 0.16);
}

function playHat(state: BgmState, time: number): void {
  const { ctx, master, noise } = state;
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = noise;
  filter.type = 'highpass';
  filter.frequency.value = 6200;
  gain.gain.setValueAtTime(0.018, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  source.start(time);
  source.stop(time + 0.05);
}

function scheduleStep(state: BgmState, step: number, time: number): void {
  const bar = Math.floor(step / 16) % CHORDS.length;
  const beat = step % 16;
  const chord = CHORDS[bar];

  if (beat % 4 === 0) playTone(state, time, chord.bass, 0.3, 'triangle', 0.1);
  if (beat % 2 === 0) {
    const arpIndex = Math.floor(beat / 2) % chord.arp.length;
    playTone(state, time, chord.arp[arpIndex], 0.16, 'square', 0.017);
  }

  const melodyNote = MELODY[step];
  if (melodyNote !== null) playTone(state, time, melodyNote, 0.24, 'square', 0.032);

  if (beat === 0 || beat === 8) playKick(state, time);
  if (beat % 4 === 2) playHat(state, time);
  if (beat === 12) playTone(state, time, chord.arp[3] + 12, 0.5, 'triangle', 0.012);
}

function scheduleAhead(state: BgmState): void {
  const { ctx } = state;
  // 标签页切换回来时时间可能落后过多，避免一次性排入大量音符
  if (state.nextTime < ctx.currentTime - 0.5) state.nextTime = ctx.currentTime + 0.05;
  let guard = 0;
  while (state.nextTime < ctx.currentTime + 0.18 && guard < 64) {
    scheduleStep(state, state.step, state.nextTime);
    state.nextTime += STEP_SECONDS;
    state.step = (state.step + 1) % TOTAL_STEPS;
    guard += 1;
  }
}

function setBgmUI(playing: boolean): void {
  document.body.classList.toggle('bgm-on', playing);
  $all('[data-bgm-toggle]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(playing));
    btn.classList.toggle('is-on', playing);
    const label = $('.tool-btn__text', btn);
    if (label && btn.classList.contains('tool-btn')) label.textContent = playing ? '停止' : 'BGM';
    btn.setAttribute('title', playing ? '停止芯片音乐' : '播放芯片音乐');
  });
  $all('.equalizer').forEach((el) => el.classList.toggle('is-paused', !playing));
}

async function startBgm(): Promise<void> {
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;

  if (!bgm) {
    const ctx = new Ctor();
    const master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    bgm = {
      ctx,
      master,
      noise: makeNoiseBuffer(ctx),
      step: 0,
      nextTime: 0,
      timer: 0,
    };
  }

  const state = bgm;
  await state.ctx.resume();
  state.master.gain.cancelScheduledValues(state.ctx.currentTime);
  state.master.gain.setValueAtTime(0.5, state.ctx.currentTime);
  state.step = 0;
  state.nextTime = state.ctx.currentTime + 0.08;
  window.clearInterval(state.timer);
  state.timer = window.setInterval(() => scheduleAhead(state), 25);
  scheduleAhead(state);
  bgmPlaying = true;
  setBgmUI(true);
}

function stopBgm(): void {
  if (!bgm) {
    bgmPlaying = false;
    setBgmUI(false);
    return;
  }
  window.clearInterval(bgm.timer);
  bgm.timer = 0;
  const { ctx, master } = bgm;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.04);
  bgmPlaying = false;
  setBgmUI(false);
  window.setTimeout(() => {
    if (!bgmPlaying) void bgm?.ctx.suspend();
  }, 260);
}

function initBgm(): void {
  setBgmUI(false);
  document.addEventListener('click', (event) => {
    const target = event.target as Element | null;
    if (!target?.closest('[data-bgm-toggle]')) return;
    if (bgmPlaying) stopBgm();
    else void startBgm();
  });
}

/* ============================================================
 * 3. 站内搜索
 * ========================================================== */

interface SearchEntry {
  title: string;
  url: string;
  type: string;
  description: string;
  tags: string[];
  body: string;
}

interface SearchState {
  entries: SearchEntry[] | null;
  loading: boolean;
  failed: boolean;
  active: number;
  results: SearchEntry[];
}

const searchState: SearchState = {
  entries: null,
  loading: false,
  failed: false,
  active: -1,
  results: [],
};

function highlight(text: string, query: string): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const q = query.trim().toLowerCase();
  if (!q) {
    fragment.appendChild(document.createTextNode(text));
    return fragment;
  }
  const lower = text.toLowerCase();
  let cursor = 0;
  for (;;) {
    const hit = lower.indexOf(q, cursor);
    if (hit === -1) {
      fragment.appendChild(document.createTextNode(text.slice(cursor)));
      break;
    }
    if (hit > cursor) fragment.appendChild(document.createTextNode(text.slice(cursor, hit)));
    const mark = document.createElement('mark');
    mark.textContent = text.slice(hit, hit + q.length);
    fragment.appendChild(mark);
    cursor = hit + q.length;
  }
  return fragment;
}

function scoreEntry(entry: SearchEntry, query: string): number {
  const q = query.toLowerCase();
  const title = entry.title.toLowerCase();
  const tags = entry.tags.join(' ').toLowerCase();
  const description = entry.description.toLowerCase();
  const body = entry.body.toLowerCase();
  let score = 0;
  if (title === q) score += 240;
  if (title.includes(q)) score += 90;
  if (tags.includes(q)) score += 42;
  if (description.includes(q)) score += 22;
  if (body.includes(q)) score += 8;
  return score;
}

function makeSnippet(entry: SearchEntry, query: string): string {
  const flat = entry.body.replace(/\s+/g, ' ').trim();
  const index = flat.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return entry.description;
  const start = Math.max(0, index - 48);
  const end = Math.min(flat.length, index + query.length + 72);
  return `${start > 0 ? '…' : ''}${flat.slice(start, end)}${end < flat.length ? '…' : ''}`;
}

function renderSearchEmpty(message: string, hint = ''): void {
  const list = $('#search-results');
  if (!list) return;
  list.replaceChildren();
  const item = document.createElement('li');
  item.className = 'search-results__empty';
  item.append(document.createTextNode(message));
  if (hint) {
    const small = document.createElement('span');
    small.className = 'search-results__hint';
    small.textContent = hint;
    item.appendChild(small);
  }
  list.appendChild(item);
}

function renderSearchResults(query: string): void {
  const list = $('#search-results');
  if (!list) return;
  const trimmed = query.trim();
  searchState.results = [];
  searchState.active = -1;

  if (!trimmed) {
    renderSearchEmpty('输入关键词开始检索。', '试试：月亮、Astro、像素、光学、碎碎念');
    return;
  }
  if (!searchState.entries) {
    renderSearchEmpty(searchState.failed ? '索引加载失败。' : '正在加载检索索引…');
    return;
  }

  const matched = searchState.entries
    .map((entry) => ({ entry, score: scoreEntry(entry, trimmed) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map((row) => row.entry);

  searchState.results = matched;

  if (matched.length === 0) {
    renderSearchEmpty(`没有找到与「${trimmed}」相关的电波。`, '换一个关键词，或者去碎碎念里翻翻？');
    return;
  }

  list.replaceChildren();
  matched.forEach((entry, index) => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = entry.url;
    link.dataset.index = String(index);

    const title = document.createElement('span');
    title.className = 'sr-title';
    title.appendChild(highlight(entry.title, trimmed));

    const meta = document.createElement('span');
    meta.className = 'sr-meta';
    meta.textContent = `${entry.type} ／ ${entry.tags.slice(0, 3).join(' · ') || '无标签'}`;

    const snippet = document.createElement('span');
    snippet.className = 'sr-snippet';
    snippet.appendChild(highlight(makeSnippet(entry, trimmed), trimmed));

    link.append(title, meta, snippet);
    li.appendChild(link);
    list.appendChild(li);
  });
  setSearchActive(0);
}

function setSearchActive(index: number): void {
  const links = $all('#search-results a');
  if (links.length === 0) return;
  const next = (index + links.length) % links.length;
  searchState.active = next;
  links.forEach((link, i) => link.classList.toggle('is-active', i === next));
  const active = links[next];
  active?.classList.add('is-active');
  active?.scrollIntoView({ block: 'nearest' });
}

async function loadSearchIndex(): Promise<void> {
  if (searchState.entries || searchState.loading) return;
  searchState.loading = true;
  try {
    const response = await fetch('/search-index.json', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as { entries?: SearchEntry[] };
    searchState.entries = Array.isArray(data.entries) ? data.entries : [];
    searchState.failed = false;
    const input = $('#search-input') as HTMLInputElement | null;
    if (input?.value.trim()) renderSearchResults(input.value);
  } catch (error) {
    console.warn('[search] 索引加载失败', error);
    searchState.failed = true;
    renderSearchEmpty('检索索引加载失败。', '开发环境下请先访问一次任意页面，或运行 npm run build。');
  } finally {
    searchState.loading = false;
  }
}

let searchReturnFocus: HTMLElement | null = null;

function openSearch(): void {
  const modal = $('#search-modal');
  if (!modal) return;
  searchReturnFocus = document.activeElement as HTMLElement | null;
  modal.hidden = false;
  document.body.classList.add('is-locked');
  void loadSearchIndex();
  const input = $('#search-input') as HTMLInputElement | null;
  window.setTimeout(() => input?.focus(), 30);
  if (input?.value.trim()) renderSearchResults(input.value);
}

function closeSearch(): void {
  const modal = $('#search-modal');
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  document.body.classList.remove('is-locked');
  searchReturnFocus?.focus?.();
}

function initSearch(): void {
  document.addEventListener('click', (event) => {
    const target = event.target as Element | null;
    if (!target) return;
    if (target.closest('[data-search-open]')) {
      event.preventDefault();
      openSearch();
      return;
    }
    if (target.closest('[data-search-close]')) {
      event.preventDefault();
      closeSearch();
    }
  });

  const input = $('#search-input') as HTMLInputElement | null;
  if (input) {
    input.addEventListener('input', () => renderSearchResults(input.value));
  }

  document.addEventListener('keydown', (event) => {
    const target = event.target as Element | null;
    const tag = target?.tagName ?? '';
    const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable;
    const modalOpen = !$('#search-modal')?.hidden;

    if (event.key === 'Escape' && modalOpen) {
      event.preventDefault();
      closeSearch();
      return;
    }
    if (modalOpen && input) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSearchActive(searchState.active + 1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSearchActive(searchState.active - 1);
      } else if (event.key === 'Enter') {
        const link = $all('#search-results a')[searchState.active];
        if (link) {
          event.preventDefault();
          window.location.href = link.getAttribute('href') ?? '/';
        }
      }
      return;
    }
    if (typing) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      openSearch();
    } else if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      openSearch();
    }
  });
}

/* ============================================================
 * 4. 返回顶部 / 滚动进度 / 目录高亮
 * ========================================================== */

function initScrollTop(): void {
  const button = $('[data-scroll-top]');
  if (!button) return;
  const update = () => button.classList.toggle('is-visible', window.scrollY > 480);
  update();
  window.addEventListener('scroll', update, { passive: true });
  button.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });
}

function initReadingProgress(): void {
  const bar = $('.reading-progress');
  const content = $('.post-content');
  if (!bar || !content) return;
  let ticking = false;
  const update = () => {
    const top = content.getBoundingClientRect().top + window.scrollY;
    const total = Math.max(1, content.offsetHeight);
    const progress = Math.min(1, Math.max(0, (window.scrollY + window.innerHeight * 0.5 - top) / total));
    bar.style.transform = `scaleX(${progress.toFixed(4)})`;
    bar.classList.toggle('is-done', progress > 0.995);
    ticking = false;
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };
  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
}

function initToc(): void {
  const toc = $('.toc');
  const content = $('.post-content');
  if (!toc || !content) return;
  const links = $all('a', toc);
  const headings = $all('h2, h3', content).filter((heading) => heading.id);
  if (headings.length === 0 || links.length === 0) return;

  const linkFor = new Map<string, HTMLElement>();
  links.forEach((link) => {
    const hash = link.getAttribute('href')?.replace(/^#/, '');
    if (hash) linkFor.set(hash, link);
  });

  let activeId = '';
  const setActive = (id: string) => {
    if (id === activeId) return;
    activeId = id;
    links.forEach((link) => link.classList.remove('is-active'));
    const link = linkFor.get(id);
    if (link) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'true');
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActive(visible[0].target.id);
    },
    { rootMargin: '-15% 0px -70% 0px', threshold: [0, 1] },
  );
  headings.forEach((heading) => observer.observe(heading));
}

/* ============================================================
 * 5. 光标星屑拖尾
 * ========================================================== */

interface Sparkle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

function initSparkles(): void {
  if (prefersReducedMotion) return;
  if (window.matchMedia('(pointer: coarse)').matches) return;
  const canvas = document.getElementById('sparkle-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const colors = ['#ff7ad9', '#79e6ff', '#ffe08a', '#a6ffcb', '#a98bff', '#ff3d9a'];
  const particles: Sparkle[] = [];
  let lastX = -1;
  let lastY = -1;
  let raf = 0;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);

  const spawn = (x: number, y: number) => {
    if (particles.length > 180) return;
    for (let i = 0; i < 2; i += 1) {
      particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 0.9,
        vy: (Math.random() - 0.5) * 0.9 - 0.15,
        life: 0,
        maxLife: 34 + Math.random() * 26,
        size: 2 + Math.floor(Math.random() * 3),
        color: colors[Math.floor(Math.random() * colors.length)] ?? '#ff7ad9',
      });
    }
  };

  const animate = () => {
    raf = 0;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const particle = particles[i];
      if (!particle) continue;
      particle.life += 1;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.008;
      if (particle.life >= particle.maxLife) {
        particles.splice(i, 1);
        continue;
      }
      const alpha = Math.max(0, 1 - particle.life / particle.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.fillRect(
        Math.round(particle.x),
        Math.round(particle.y),
        particle.size,
        particle.size,
      );
      if (particle.life % 7 === 0 && alpha > 0.5) {
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = alpha * 0.9;
        ctx.fillRect(Math.round(particle.x), Math.round(particle.y), 1, 1);
      }
    }
    ctx.globalAlpha = 1;
    if (particles.length > 0) raf = window.requestAnimationFrame(animate);
    else ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  };

  window.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      const distance = Math.hypot(event.clientX - lastX, event.clientY - lastY);
      if (lastX >= 0 && distance < 9) return;
      lastX = event.clientX;
      lastY = event.clientY;
      spawn(event.clientX, event.clientY);
      if (!raf) raf = window.requestAnimationFrame(animate);
    },
    { passive: true },
  );
}

/* ============================================================
 * 6. 碎碎念心情筛选
 * ========================================================== */

function initNotesFilter(): void {
  const filters = $all('.mood-btn[data-mood]');
  if (filters.length === 0) return;
  const items = $all('.timeline__item');
  const countEl = $('#notes-count');
  const emptyEl = $('#notes-filter-empty');

  const apply = (mood: string) => {
    let visible = 0;
    items.forEach((item) => {
      const show = mood === 'all' || item.dataset.mood === mood;
      item.hidden = !show;
      if (show) visible += 1;
    });
    filters.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.mood === mood));
    });
    if (countEl) countEl.textContent = String(visible);
    if (emptyEl) emptyEl.hidden = visible !== 0;
  };

  filters.forEach((button) => {
    button.addEventListener('click', () => apply(button.dataset.mood ?? 'all'));
  });
  apply('all');
}

/* ============================================================
 * 7. 留言板（本地 localStorage + 可选 Cloudflare API）
 * ========================================================== */

interface GuestEntry {
  id: string;
  name: string;
  message: string;
  site?: string;
  mood?: string;
  date: string;
  local?: boolean;
}

const GUEST_AVATARS = ['rabbit', 'robot', 'cat', 'ghost', 'star', 'book'];
const GUEST_MOODS: Record<string, string> = {
  star: '星星',
  moon: '月亮',
  cat: '猫',
  music: '音乐',
  heart: '爱心',
  sparkle: '闪光',
};

function guestAvatar(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return `/img/friends/${GUEST_AVATARS[hash % GUEST_AVATARS.length]}.png`;
}

function formatGuestDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.valueOf())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function readLocalGuestbook(): GuestEntry[] {
  try {
    const raw = localStorage.getItem(GB_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is GuestEntry => {
      return Boolean(
        entry &&
          typeof entry === 'object' &&
          typeof (entry as GuestEntry).id === 'string' &&
          typeof (entry as GuestEntry).name === 'string' &&
          typeof (entry as GuestEntry).message === 'string',
      );
    });
  } catch {
    return [];
  }
}

function saveLocalGuestbook(entries: GuestEntry[]): void {
  try {
    localStorage.setItem(GB_KEY, JSON.stringify(entries.slice(0, 120)));
  } catch {
    /* 容量不足时静默失败 */
  }
}

function renderGuestEntry(entry: GuestEntry, prepend = false): void {
  const list = $('#guest-list');
  if (!list) return;
  if ($(`[data-guest-id="${CSS.escape(entry.id)}"]`, list)) return;

  const item = document.createElement('li');
  item.className = 'guest-entry';
  item.dataset.guestId = entry.id;

  const avatar = document.createElement('div');
  avatar.className = 'guest-entry__avatar';
  const avatarImg = document.createElement('img');
  avatarImg.src = guestAvatar(entry.name);
  avatarImg.alt = `${entry.name} 的头像`;
  avatarImg.width = 48;
  avatarImg.height = 48;
  avatarImg.loading = 'lazy';
  avatar.appendChild(avatarImg);

  const bubble = document.createElement('div');
  bubble.className = 'guest-entry__bubble';

  const head = document.createElement('div');
  head.className = 'guest-entry__head';

  const name = document.createElement('span');
  name.className = 'guest-entry__name';
  let siteUrl = '';
  if (entry.site) {
    try {
      const parsed = new URL(entry.site);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') siteUrl = parsed.href;
    } catch {
      siteUrl = '';
    }
  }
  if (siteUrl) {
    const link = document.createElement('a');
    link.href = siteUrl;
    link.rel = 'nofollow noopener';
    link.target = '_blank';
    link.textContent = entry.name;
    name.appendChild(link);
  } else {
    name.textContent = entry.name;
  }

  const date = document.createElement('time');
  date.className = 'guest-entry__date';
  date.dateTime = entry.date;
  date.textContent = formatGuestDate(entry.date);

  const floor = document.createElement('span');
  floor.className = 'guest-entry__floor';
  floor.textContent = entry.local ? 'LOCAL' : 'WEB';

  head.append(name, date, floor);

  const body = document.createElement('p');
  body.className = 'guest-entry__body';
  body.textContent = entry.message;

  bubble.append(head, body);

  if (entry.mood && GUEST_MOODS[entry.mood]) {
    const mood = document.createElement('span');
    mood.className = 'guest-entry__mood';
    const moodImg = document.createElement('img');
    moodImg.src = `/img/moods/${entry.mood}.png`;
    moodImg.alt = '';
    moodImg.width = 14;
    moodImg.height = 14;
    mood.appendChild(moodImg);
    mood.append(document.createTextNode(GUEST_MOODS[entry.mood] ?? ''));
    bubble.appendChild(mood);
  }

  item.append(avatar, bubble);
  if (prepend) list.prepend(item);
  else list.appendChild(item);
}

function initGuestbook(): void {
  const form = $('#guest-form') as HTMLFormElement | null;
  const list = $('#guest-list');
  if (!form || !list) return;

  const existing = new Set<string>();
  $all('.guest-entry', list).forEach((el) => {
    if (el.dataset.guestId) existing.add(el.dataset.guestId);
  });

  const localEntries = readLocalGuestbook().sort((a, b) => b.date.localeCompare(a.date));
  localEntries
    .slice()
    .reverse()
    .forEach((entry) => renderGuestEntry(entry, false));

  const status = $('#guest-status');
  const textarea = form.querySelector<HTMLTextAreaElement>('textarea[name="message"]');
  const counter = $('#guest-count');
  const setStatus = (message: string, error = false) => {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('is-error', error);
  };

  if (textarea && counter) {
    const update = () => {
      counter.textContent = String(textarea.value.length);
    };
    textarea.addEventListener('input', update);
    update();
  }

  void (async () => {
    try {
      const response = await fetch('/api/guestbook', { headers: { Accept: 'application/json' } });
      const type = response.headers.get('content-type') ?? '';
      if (!response.ok || !type.includes('application/json')) return;
      const data = (await response.json()) as { entries?: GuestEntry[] };
      if (!Array.isArray(data.entries)) return;
      data.entries.forEach((entry) => {
        if (!existing.has(entry.id)) renderGuestEntry(entry, true);
      });
    } catch {
      /* 纯静态环境没有 API，忽略 */
    }
  })();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') ?? '').trim();
    const message = String(data.get('message') ?? '').trim();
    const site = String(data.get('site') ?? '').trim();
    const mood = String(data.get('mood') ?? 'star');

    if (name.length === 0) {
      setStatus('请先填一个称呼。', true);
      form.querySelector<HTMLInputElement>('input[name="name"]')?.focus();
      return;
    }
    if (message.length < 2) {
      setStatus('留言太短了，再多写几个字吧。', true);
      textarea?.focus();
      return;
    }

    const entry: GuestEntry = {
      id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `local-${Date.now()}`,
      name: name.slice(0, 24),
      message: message.slice(0, 280),
      site: site.slice(0, 120),
      mood,
      date: new Date().toISOString(),
      local: true,
    };

    const all = readLocalGuestbook();
    all.unshift(entry);
    saveLocalGuestbook(all);
    renderGuestEntry(entry, true);
    form.reset();
    if (counter) counter.textContent = '0';
    setStatus('留言已写进本机存档 ✓（纯静态模式）');

    void (async () => {
      try {
        const response = await fetch('/api/guestbook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ name: entry.name, message: entry.message, site: entry.site, mood }),
        });
        const type = response.headers.get('content-type') ?? '';
        if (response.ok && type.includes('application/json')) {
          setStatus('电波已发往云端留言板 ✓');
        }
      } catch {
        /* 本地模式即可 */
      }
    })();
  });
}

/* ============================================================
 * 8. 复制按钮 / 计数器 / 杂项
 * ========================================================== */

function initCopyButtons(): void {
  document.addEventListener('click', (event) => {
    const target = event.target as Element | null;
    const button = target?.closest<HTMLElement>('[data-copy]');
    if (!button) return;
    event.preventDefault();
    const text = button.dataset.copy ?? '';
    const finish = () => {
      const original = button.dataset.original ?? button.textContent ?? '';
      button.dataset.original = original;
      button.textContent = '已复制 ✓';
      button.classList.add('is-copied');
      window.setTimeout(() => {
        button.textContent = button.dataset.original ?? original;
        button.classList.remove('is-copied');
      }, 1600);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(finish).catch(() => {
        button.textContent = '复制失败';
      });
    } else {
      const area = document.createElement('textarea');
      area.value = text;
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand('copy');
        finish();
      } catch {
        button.textContent = '复制失败';
      }
      area.remove();
    }
  });
}

function initVisitorCounter(): void {
  const counter = $('[data-visit-counter]');
  if (!counter) return;
  const base = Number(counter.dataset.base ?? '0');
  const pad = Number(counter.dataset.pad ?? '6');
  let total = 0;
  try {
    total = Number(localStorage.getItem(COUNTER_KEY) ?? '0');
    if (!sessionStorage.getItem('hoshikuzu.counter.session')) {
      total += 1;
      localStorage.setItem(COUNTER_KEY, String(total));
      sessionStorage.setItem('hoshikuzu.counter.session', '1');
    }
  } catch {
    total = 0;
  }
  const value = base + total;
  const digits = String(value).padStart(pad, '0');
  const wrap = $('.counter__digits', counter);
  if (wrap) {
    wrap.replaceChildren();
    for (const digit of digits) {
      const img = document.createElement('img');
      img.src = `/img/counter/${digit}.png`;
      img.alt = '';
      img.width = 12;
      img.height = 20;
      img.loading = 'lazy';
      wrap.appendChild(img);
    }
  }
  const sr = $('.sr-only', counter);
  if (sr) sr.textContent = `访问次数 ${value}`;
  counter.title = `站点计数器：${value}`;
}

function initExternalLinks(): void {
  $all('a[href^="http"]').forEach((link) => {
    if (link.hostname && link.hostname !== window.location.hostname) {
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

function init(): void {
  document.body.classList.add('js');
  const modules: Array<[string, () => void]> = [
    ['theme', initTheme],
    ['bgm', initBgm],
    ['search', initSearch],
    ['scroll-top', initScrollTop],
    ['reading-progress', initReadingProgress],
    ['toc', initToc],
    ['sparkles', initSparkles],
    ['notes-filter', initNotesFilter],
    ['guestbook', initGuestbook],
    ['copy', initCopyButtons],
    ['visitor-counter', initVisitorCounter],
    ['external-links', initExternalLinks],
  ];
  modules.forEach(([name, fn]) => {
    try {
      fn();
    } catch (error) {
      console.error(`[site] ${name} 初始化失败`, error);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}