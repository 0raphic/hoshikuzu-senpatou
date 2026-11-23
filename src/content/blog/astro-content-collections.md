---
title: 内容集合的一点点心得
description: Astro 的 content collections 怎么做类型校验、怎么过滤草稿，以及我踩过的两个小坑。
date: 2026-09-18
tags: ['Astro', '前端', '教程']
cover: /img/covers/astro-content-collections.png
---

# 内容集合的一点点心得

用 Astro 写博客最舒服的部分，大概就是 **content collections**：文章是 Markdown，但取出来的时候有完整的类型提示。

## 先定义 schema

在 `src/content.config.ts` 里，用 Zod 描述每一篇文章长什么样：

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
```

`z.coerce.date()` 很好用。Markdown 的 frontmatter 里写 `date: 2026-09-18`，取出来直接就是 `Date` 对象，不需要在每个页面里手动 `new Date()`。

## 取数据

```ts
const posts = (await getCollection('blog'))
  .filter((post) => !post.data.draft)
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
```

注意 `getCollection` 返回的是**全部**文章，包括草稿。生产环境最好在构建时过滤掉，而不是靠 CSS 隐藏。

### 两个小坑

1. **草稿也会被 RSS 读到。** 如果 `rss.xml.js` 里直接用 `getCollection('blog')`，草稿就跟着发出去了。所以我把过滤逻辑抽成了 `isPublished()`，所有入口统一调用。
2. **日期排序不要用字符串。** `2026-9-1` 和 `2026-09-01` 在字符串比较下顺序是错的，一定要转成时间戳。

## 给每篇文章一个稳定的 URL

文件叫 `hello-world.md`，那 `post.id` 就是 `hello-world`，路由用 `[...slug].astro` 接住：

```astro
---
export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}
const { post } = Astro.props;
const { Content } = await render(post);
---
<article class="post-content prose">
  <Content />
</article>
```

文件名就是永久链接，所以起名字的时候要认真一点。我第一篇文章的文件名改过三次，改一次就等于换一次地址——虽然现在还没人看，但总得为将来考虑。

## 一点感慨

类型系统不能帮你写出好文章，但它能让你在改字段的时候少崩几次。对于一个只有一个人的项目来说，这已经很温柔了。