import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// 部署到 Cloudflare Pages 时，将 site 换成你的正式域名。
export default defineConfig({
  site: 'https://hoshikuzu.pages.dev',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
    }),
  ],
  markdown: {
    shikiConfig: {
      theme: 'synthwave-84',
      wrap: false,
    },
  },
  devToolbar: {
    enabled: false,
  },
});