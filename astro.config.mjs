// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
export default defineConfig({
  site: process.env.SITE_URL || 'https://www.ashbi.ca',
  output: 'static',
  compressHTML: true,
  integrations: [sitemap({filter: page => !/\/(401|404|privacy|pricing|ashbi-design-services-catalog-and-hourly-estimates)\/?$/.test(page) && !/\/campaigns\//.test(page)})],
});
