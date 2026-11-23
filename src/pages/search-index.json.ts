import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { isPublished, sortByDateDesc, stripMarkdown } from '../utils';

const MAX_BODY = 700;

function clip(text: string): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > MAX_BODY ? `${flat.slice(0, MAX_BODY)}…` : flat;
}

export const GET: APIRoute = async () => {
  const [posts, works, notes] = await Promise.all([
    getCollection('blog', isPublished),
    getCollection('works', isPublished),
    getCollection('notes', isPublished),
  ]);

  const entries = [
    ...sortByDateDesc(posts).map((post) => ({
      title: post.data.title,
      url: `/blog/${post.id}/`,
      type: '文章',
      description: post.data.description,
      tags: post.data.tags,
      body: clip(stripMarkdown(post.body ?? '')),
    })),
    ...works
      .sort((a, b) => a.data.order - b.data.order)
      .map((work) => ({
        title: work.data.title,
        url: `/works/${work.id}/`,
        type: '作品',
        description: work.data.description,
        tags: [...work.data.tags, ...work.data.stack],
        body: clip(`${work.data.tagline} ${stripMarkdown(work.body ?? '')}`),
      })),
    ...sortByDateDesc(notes).map((note) => ({
      title: `碎碎念 · ${note.data.date.toISOString().slice(0, 10)}`,
      url: '/notes/',
      type: '碎碎念',
      description: clip(stripMarkdown(note.body ?? '')).slice(0, 90),
      tags: note.data.tags,
      body: clip(stripMarkdown(note.body ?? '')),
    })),
  ];

  return new Response(JSON.stringify({ generatedAt: new Date().toISOString(), entries }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};