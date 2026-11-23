export interface Friend {
  name: string;
  url: string;
  desc: string;
  avatar: string;
  badge?: string;
  /** 友链排序用，越小越靠前 */
  order?: number;
  /** 最近一次串门时间 */
  visited?: string;
}

/**
 * 友链数据。头像和徽章都是脚本生成的像素图，替换成你自己的即可。
 */
export const FRIENDS: Friend[] = [
  {
    name: '月面电台',
    url: '#',
    desc: '一个只在深夜播出的电台，主播是一只戴耳机的兔子。',
    avatar: '/img/friends/rabbit.png',
    badge: '/img/badges/friend-moon.png',
    order: 1,
    visited: '2026.11.21',
  },
  {
    name: '电子之海',
    url: '#',
    desc: '关于合成器、旧电脑和城市夜景的博客。',
    avatar: '/img/friends/robot.png',
    badge: '/img/badges/friend-sea.png',
    order: 2,
    visited: '2026.11.19',
  },
  {
    name: '薄荷汽水',
    url: '#',
    desc: '画画的，偶尔写一点 CSS。喜欢绿色和猫。',
    avatar: '/img/friends/cat.png',
    badge: '/img/badges/friend-mint.png',
    order: 3,
    visited: '2026.11.16',
  },
  {
    name: '像素锅炉房',
    url: '#',
    desc: 'Game Boy 开发、像素美术、以及永远做不完的 RPG。',
    avatar: '/img/friends/ghost.png',
    badge: '/img/badges/friend-pixel.png',
    order: 4,
    visited: '2026.11.11',
  },
  {
    name: '光学迷路',
    url: '#',
    desc: '光学专业学生的实验记录，附带大量失败照片。',
    avatar: '/img/friends/star.png',
    badge: '/img/badges/friend-optics.png',
    order: 5,
    visited: '2026.11.02',
  },
  {
    name: '旧书摊',
    url: '#',
    desc: '扫描、整理 1990s—2000s 的中文网络文化资料。',
    avatar: '/img/friends/book.png',
    badge: '/img/badges/friend-book.png',
    order: 6,
    visited: '2026.10.24',
  },
];

export const APPLY_STEPS = [
  '在评论区或邮件里告诉我你的站名、地址、一句话简介和头像（32×32 最好）。',
  '本站只接受原创内容为主的个人站点，不接受纯导航、采集站和商业推广站。',
  '交换友链后，请把本站的徽章放到你的友链页：',
  '站点还在建设中也没关系，但请保留至少 3 篇自己的内容再来串门。',
];