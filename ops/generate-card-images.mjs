import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

// Commit the generated assets so production remains a plain static build.
const catalog = JSON.parse(await readFile('src/data/editorial-assets.json', 'utf8'));
const sources = new Set(Object.values(catalog).map(choices => choices['default-card']?.src).filter(Boolean));
sources.add('/images/ashbi/gallery/marin-food-05-1800.webp');
const manifest = {};
for (const src of [...sources].sort()) {
  if (!src.startsWith('/images/ashbi/') || src.includes('..')) throw new Error(`Invalid card path: ${src}`);
  const input = path.join('public', src);
  const { width } = await sharp(input).metadata();
  const candidates = [...new Set([360, 720, 1080].map(size => Math.min(size, width)))];
  manifest[src] = [];
  for (const size of candidates) {
    const output = `/images/ashbi/responsive/${src.slice('/images/ashbi/'.length).replace(/\.[^.]+$/, '')}-${size}.webp`;
    const destination = path.join('public', output);
    await mkdir(path.dirname(destination), { recursive: true });
    await sharp(input).rotate().resize({ width: size, withoutEnlargement: true }).webp({ quality: 78, effort: 6 }).toFile(destination);
    manifest[src].push({ src: output, width: size });
  }
}
await writeFile('src/data/card-image-variants.json', `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated responsive variants for ${sources.size} card images.`);
