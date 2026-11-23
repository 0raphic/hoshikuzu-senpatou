import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../config';
import { sortByDateDesc, isPublished } from '../utils';

export async function GET(context) {
  const posts = sortByDateDesc(await getCollection('blog', isPublished));
  const site = context.site ?? SITE.url;

  return rss({
    title: `${SITE.title} · 电波日志`,
    description: SITE.description,
    site,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    customData: [
      '<language>zh-CN</language>',
      `<copyright>© ${new Date().getFullYear()} ${SITE.author.name}</copyright>`,
      `<managingEditor>${SITE.author.email} (${SITE.author.name})</managingEditor>`,
      `<webMaster>${SITE.author.email} (${SITE.author.name})</webMaster>`,
      '<ttl>60</ttl>',
    ].join(''),
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/blog/${post.id}/`,
      categories: post.data.tags,
      author: SITE.author.name,
    })),
  });
}