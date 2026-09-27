import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || 'dist');
if (!existsSync(root) || !statSync(root).isDirectory()) {
  console.error(`Built site directory is missing: ${root}`);
  process.exit(1);
}

const files = [];
function visit(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) visit(fullPath);
    else if (entry.isFile() && /\.(html|css)$/.test(entry.name)) files.push(fullPath);
  }
}
visit(root);

const failures = [];
let checked = 0;

function check(reference, source) {
  const value = reference.trim();
  if (!value || value.startsWith('#') || value.startsWith('//')) return;
  if (/^(?:[a-z][a-z\d+.-]*:)/i.test(value)) return;

  const sourcePath = path.relative(root, source).split(path.sep).join('/');
  const sourceUrl = sourcePath.endsWith('/index.html')
    ? `/${sourcePath.slice(0, -'index.html'.length)}`
    : `/${sourcePath}`;
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(value, `https://ashbi.local${sourceUrl}`).pathname);
  } catch {
    failures.push(`${sourcePath}: invalid URL ${JSON.stringify(value)}`);
    return;
  }

  const destination = path.resolve(root, `.${pathname}`);
  if (destination !== root && !destination.startsWith(`${root}${path.sep}`)) {
    failures.push(`${sourcePath}: path escapes built site ${JSON.stringify(value)}`);
    return;
  }

  checked++;
  const candidate = pathname.endsWith('/') ? path.join(destination, 'index.html') : destination;
  if (existsSync(candidate)) {
    if (statSync(candidate).isFile()) return;
    if (statSync(candidate).isDirectory() && existsSync(path.join(candidate, 'index.html'))) return;
  }
  failures.push(`${sourcePath}: missing ${JSON.stringify(value)}`);
}

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  if (file.endsWith('.html')) {
    for (const match of content.matchAll(/\b(?:src|href|poster)\s*=\s*["']([^"']+)["']/gi)) {
      check(match[1], file);
    }
    for (const match of content.matchAll(/\bsrcset\s*=\s*["']([^"']+)["']/gi)) {
      for (const item of match[1].split(',')) check(item.trim().split(/\s+/)[0], file);
    }
  }
  for (const match of content.matchAll(/url\(\s*["']?([^)'"\s]+)["']?\s*\)/gi)) {
    check(match[1], file);
  }
}

if (failures.length) {
  console.error(`Broken built-site references (${failures.length} of ${checked} checked):`);
  for (const failure of failures.slice(0, 50)) console.error(`  ${failure}`);
  if (failures.length > 50) console.error(`  …and ${failures.length - 50} more`);
  process.exit(1);
}

console.log(`Checked ${checked} local links and assets in ${files.length} built HTML/CSS files.`);
