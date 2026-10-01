import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || 'dist');
const failures = [];
const seen = new Set();
const index = readFileSync(path.join(root, 'sitemap-index.xml'), 'utf8');
const locations = xml => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
const withinBuild = pathname => {
  const target = path.resolve(root, `.${decodeURIComponent(pathname)}`);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) throw new Error('Path escapes build');
  return target;
};

for (const sitemap of locations(index)) {
  const xml = readFileSync(withinBuild(new URL(sitemap).pathname), 'utf8');
  for (const location of locations(xml)) {
    if (seen.has(location)) failures.push(`Duplicate sitemap URL: ${location}`);
    seen.add(location);
    const url = new URL(location);
    const file = path.join(withinBuild(url.pathname), 'index.html');
    if (!existsSync(file)) {
      failures.push(`Missing built page: ${location}`);
      continue;
    }
    const html = readFileSync(file, 'utf8');
    const tags = html.match(/<link\b[^>]*>/gi) || [];
    const canonical = tags.find(tag => /\brel=["']canonical["']/i.test(tag));
    const href = canonical?.match(/\bhref=["']([^"']+)["']/i)?.[1];
    if (href !== location) failures.push(`Noncanonical sitemap URL: ${location} -> ${href || 'missing canonical'}`);
    const robots = (html.match(/<meta\b[^>]*>/gi) || []).filter(tag => /\bname=["']robots["']/i.test(tag));
    if (robots.some(tag => /\bnoindex\b/i.test(tag))) failures.push(`Noindex page in sitemap: ${location}`);
  }
}

if (!seen.size) failures.push('Sitemap contains no page URLs');
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`Sitemap passed: ${seen.size} unique, canonical, indexable built pages.`);
