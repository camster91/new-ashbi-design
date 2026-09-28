// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
export default defineConfig({
  site: process.env.SITE_URL || 'https://www.ashbi.ca',
  output: 'static',
  compressHTML: true,
  cacheDir: './.astro/cache',
  // Draft builds share read-only dependencies; keep Vite's cache in the workspace.
  vite: { cacheDir: '.astro/vite' },
  integrations: [sitemap({filter: page => !/\/(401|404|privacy|pricing|ashbi-design-services-catalog-and-hourly-estimates)\/?$/.test(page) && !/\/campaigns\//.test(page) && !/\/work\/(blend|natural-matcha|tyson-media|durabuild|the-octavia-fund|production-work|splashtown)\/?$/.test(page) && !/\/(branding-projects|web-design-projects)\/(blend|natural-matcha|durabuild|the-octavia-fund|production-work)\/?$/.test(page)})],
});
