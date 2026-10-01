import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const checker = fileURLToPath(new URL('../ops/check-built-sitemap.mjs', import.meta.url));
const base = 'https://www.ashbi.ca';

test('sitemap gate accepts canonical pages and rejects conflicting search signals', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'ashbi-sitemap-'));
  try {
    await writeFile(path.join(directory, 'sitemap-index.xml'), `<sitemapindex><sitemap><loc>${base}/sitemap-0.xml</loc></sitemap></sitemapindex>`);
    await mkdir(path.join(directory, 'work', 'cocofro'), {recursive:true});
    const html = path.join(directory, 'work', 'cocofro', 'index.html');
    const sitemap = path.join(directory, 'sitemap-0.xml');
    const location = `${base}/work/cocofro/`;
    const run = () => spawnSync(process.execPath, [checker, directory], {encoding:'utf8'});
    const list = (urls:string[]) => `<urlset>${urls.map(url => `<url><loc>${url}</loc></url>`).join('')}</urlset>`;
    await writeFile(sitemap, list([location]));
    await writeFile(html, `<link rel="canonical" href="${location}">`);
    assert.equal(run().status, 0);

    await writeFile(html, `<link rel="canonical" href="${base}/work/other/">`);
    const noncanonical = run();
    assert.equal(noncanonical.status, 1);
    assert.match(noncanonical.stderr, /Noncanonical sitemap URL/);

    await writeFile(html, `<link rel="canonical" href="${location}"><meta name="robots" content="noindex, follow">`);
    const noindex = run();
    assert.equal(noindex.status, 1);
    assert.match(noindex.stderr, /Noindex page in sitemap/);

    await writeFile(html, `<link rel="canonical" href="${location}">`);
    await writeFile(sitemap, list([location, location]));
    const duplicate = run();
    assert.equal(duplicate.status, 1);
    assert.match(duplicate.stderr, /Duplicate sitemap URL/);

    await writeFile(sitemap, list([`${base}/missing/`]));
    const missing = run();
    assert.equal(missing.status, 1);
    assert.match(missing.stderr, /Missing built page/);
  } finally {
    await rm(directory, {recursive:true, force:true});
  }
});
