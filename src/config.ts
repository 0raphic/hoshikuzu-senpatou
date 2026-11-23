import type { NavItem } from './types';

/**
 * 全站配置 —— 想改名字、简介、链接，基本只需要动这个文件。
 * 修改后重启 dev 服务器即可。
 */
export const SITE = {
  title: '星屑電波塔',
  titleReading: 'HOSHIKUZU DENPATOU',
  subtitle: '从月面发回的、没有营养的电波。',
  description:
    '一个古早二次元风格的个人小站：博客、作品集、碎碎念、仓库，还有一些没什么用但很好玩的东西。',
  url: 'https://hoshikuzu.pages.dev',
  lang: 'zh-CN',
  locale: 'zh_CN',
  themeColor: '#ff6ec7',
  since: '2026.09',
  author: {
    name: '安媞莉娅',
    handle: 'anthelia',
    avatar: '/img/avatar.png',
    bio: '光电专业大一 / 业余前端 / 深夜动画放映员',
    location: '某座靠海的城市',
    email: 'hello@example.com',
    github: 'https://github.com/yourname',
    bilibili: 'https://space.bilibili.com/0',
    bangumi: 'https://bgm.tv/user/yourname',
    rss: '/rss.xml',
  },
  status: {
    doing: '把博客从赛博废墟里一点点挖出来',
    watching: '《孤独摇滚》重刷中',
    listening: '鳥の詩 / Lia',
    reading: '《光学》赵凯华',
  },
  nowPlaying: {
    title: '鳥の詩',
    artist: 'Lia',
    note: 'Air (2000) OP',
  },
  announcement:
    '★ 欢迎来到星屑电波塔 ★ 本站已重新接通电源 ★ 留言板已开放，请留下你的电波 ★ 建议使用 1024×768 以上分辨率浏览 ★',
  icp: '',
};

export const NAV: NavItem[] = [
  { label: '主页', labelEn: 'HOME', href: '/', icon: '⌂' },
  { label: '博客', labelEn: 'BLOG', href: '/blog/', icon: '✎' },
  { label: '作品集', labelEn: 'WORKS', href: '/works/', icon: '✧' },
  { label: '碎碎念', labelEn: 'NOTES', href: '/notes/', icon: '…' },
  { label: '仓库', labelEn: 'REPOS', href: '/repos/', icon: '⌗' },
  { label: '关于', labelEn: 'ABOUT', href: '/about/', icon: '☺' },
];

export const SUB_NAV: NavItem[] = [
  { label: '归档', labelEn: 'ARCHIVE', href: '/archive/' },
  { label: '标签', labelEn: 'TAGS', href: '/tags/' },
  { label: '友链', labelEn: 'LINKS', href: '/friends/' },
  { label: '留言板', labelEn: 'GUESTBOOK', href: '/guestbook/' },
];

export const SOCIALS = [
  { label: 'GitHub', href: SITE.author.github, icon: 'git' },
  { label: 'Bilibili', href: SITE.author.bilibili, icon: 'tv' },
  { label: 'Bangumi', href: SITE.author.bangumi, icon: 'star' },
  { label: 'RSS', href: '/rss.xml', icon: 'rss' },
];

/** 站点徽章（88×31），放在页脚和友链页 */
export const BADGES = [
  { src: '/img/badges/hoshikuzu.png', alt: '星屑電波塔' },
  { src: '/img/badges/astro.png', alt: 'Powered by Astro' },
  { src: '/img/badges/cloudflare.png', alt: 'Cloudflare' },
  { src: '/img/badges/y2k.png', alt: 'Y2K forever' },
  { src: '/img/badges/webring.png', alt: 'Night Webring' },
];

/** 随机电波 / 一言 */
export const HITOKOTO = [
  '电波，是看不见的星星。',
  '如果代码跑不起来，就先去睡觉，明天它可能会自己好。',
  '所有的光，最终都会抵达某个人眼睛里。',
  '白天做光电人，晚上做互联网幽灵。',
  '把喜欢的东西留在网上，它们就不会消失。',
  '缓存会过期，但夏天不会。',
  '你现在的努力，会在将来的某个晚上突然发光。',
  '不要害怕做出很土的东西，土是很有生命力的。',
  '在 1024×768 的世界里，一切都很清楚。',
  '关机之前，记得保存。',
];

/** 今日运势（按日期取种子，大家看到的一样） */
export const FORTUNES = [
  { level: '大吉', text: '适合发布新文章，也适合向喜欢的人发送一条电波。', color: 'pink' },
  { level: '中吉', text: '实验数据会乖乖听话，但记得多测一组对照组。', color: 'cyan' },
  { level: '小吉', text: '今天会遇到一个让你「咦」一下的小灵感，记下来。', color: 'mint' },
  { level: '吉', text: '适合整理收藏夹，把三年前存的教程翻出来看看。', color: 'yellow' },
  { level: '末吉', text: '网速可能不太好，但刚好够听完一首老歌。', color: 'violet' },
  { level: '凶', text: '记得备份。今天的凶只是提醒，不是诅咒。', color: 'red' },
];

export const WEBRING = {
  name: '深夜电波环',
  prev: { label: '前のサイト', href: '#' },
  random: { label: 'ランダム', href: '#' },
  next: { label: '次のサイト', href: '#' },
};