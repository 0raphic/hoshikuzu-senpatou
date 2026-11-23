export interface Repo {
  name: string;
  description: string;
  language: string;
  color: string;
  stars: number;
  forks: number;
  updated: string;
  url: string;
  topics: string[];
  /** 置顶 */
  pinned?: boolean;
  /** 私有/实验项目 */
  status?: 'public' | 'wip' | 'archived';
}

/**
 * 仓库数据快照。
 * 现在先手写，之后可以换成构建时请求 GitHub API：
 * https://api.github.com/users/<你的用户名>/repos?sort=updated
 */
export const REPOS: Repo[] = [
  {
    name: 'hoshikuzu-denpatou',
    description: '你现在看到的这个小站。Astro + 手写 CSS + 一堆像素素材。',
    language: 'Astro',
    color: '#ff5a03',
    stars: 42,
    forks: 7,
    updated: '2026-11-22',
    url: 'https://github.com/yourname/hoshikuzu-denpatou',
    topics: ['astro', 'blog', 'retro', 'pixel-art'],
    pinned: true,
  },
  {
    name: 'pixel-asset-forge',
    description: '用 Python + Pillow 批量生成 88×31 按钮、计数器数字和像素封面的小工坊。',
    language: 'Python',
    color: '#3572A5',
    stars: 18,
    forks: 3,
    updated: '2026-11-20',
    url: 'https://github.com/yourname/pixel-asset-forge',
    topics: ['pillow', 'pixel-art', 'generator'],
  },
  {
    name: 'optics-notes',
    description: '大一光学课的笔记与实验报告。LaTeX 排版，含夫琅禾费衍射的拟合脚本。',
    language: 'TeX',
    color: '#3D6117',
    stars: 9,
    forks: 1,
    updated: '2026-11-08',
    url: 'https://github.com/yourname/optics-notes',
    topics: ['optics', 'latex', 'notes'],
  },
  {
    name: 'led-cube-4x4x4',
    description: '4×4×4 光立方的固件与上位机。STM32 驱动、BAM 调光、串口动画协议。',
    language: 'C',
    color: '#555555',
    stars: 6,
    forks: 0,
    updated: '2026-10-30',
    url: 'https://github.com/yourname/led-cube-4x4x4',
    topics: ['stm32', 'led', 'hardware'],
    status: 'wip',
  },
  {
    name: 'chiptune-loom',
    description: '一个用 Web Audio 织芯片音乐的小玩具，支持方波、三角波和噪声轨。',
    language: 'TypeScript',
    color: '#3178c6',
    stars: 27,
    forks: 5,
    updated: '2026-10-12',
    url: 'https://github.com/yourname/chiptune-loom',
    topics: ['web-audio', 'chiptune', 'music'],
  },
  {
    name: 'old-web-snippets',
    description: '收藏的古早网页特效：跑马灯、状态栏文字、闪光 GIF、鼠标拖尾。慎用。',
    language: 'JavaScript',
    color: '#f1e05a',
    stars: 15,
    forks: 2,
    updated: '2026-09-28',
    url: 'https://github.com/yourname/old-web-snippets',
    topics: ['retro', 'snippets', 'y2k'],
  },
  {
    name: 'spectrometer-mini',
    description: '迷你光谱仪的结构件与采集脚本。光栅 + 摄像头 + 一点点玄学校准。',
    language: 'Python',
    color: '#3572A5',
    stars: 4,
    forks: 1,
    updated: '2026-09-15',
    url: 'https://github.com/yourname/spectrometer-mini',
    topics: ['optics', 'spectrum', '3d-printing'],
    status: 'archived',
  },
  {
    name: 'dotfiles',
    description: '按键位、终端配色和一堆没用的 alias。Neovim 配置占了半个仓库。',
    language: 'Lua',
    color: '#000080',
    stars: 3,
    forks: 0,
    updated: '2026-11-18',
    url: 'https://github.com/yourname/dotfiles',
    topics: ['dotfiles', 'neovim'],
  },
];

export const LANG_STATS = [
  { name: 'Astro', value: 34, color: '#ff5a03' },
  { name: 'TypeScript', value: 24, color: '#3178c6' },
  { name: 'Python', value: 19, color: '#3572A5' },
  { name: 'C', value: 12, color: '#555555' },
  { name: 'CSS', value: 8, color: '#563d7c' },
  { name: 'Other', value: 3, color: '#8b8b8b' },
];

/** 按「置顶优先，其次按更新时间倒序」排序 —— 页面统一用这个，别直接 slice 原数组 */
export function sortRepos(list: Repo[] = REPOS): Repo[] {
  return [...list].sort((a, b) => {
    const pin = Number(b.pinned ?? false) - Number(a.pinned ?? false);
    if (pin !== 0) return pin;
    return b.updated.localeCompare(a.updated);
  });
}

/** 快照里最新的一次更新时间（YYYY-MM-DD），用于「数据截至」 */
export const REPOS_LATEST_UPDATE = REPOS.reduce(
  (latest, repo) => (repo.updated > latest ? repo.updated : latest),
  REPOS[0]?.updated ?? '1970-01-01',
);