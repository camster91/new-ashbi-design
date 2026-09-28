import path from 'node:path';
import {tmpdir} from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,mkdtemp,mkdir,writeFile,symlink,rm} from 'node:fs/promises';
import {contentReleaseChanges,releaseInputDigest} from '../ops/prepare-content-release.mjs';
const home=JSON.parse(await readFile(new URL('../src/data/home-content.json',import.meta.url),'utf8'));
const catalog=JSON.parse(await readFile(new URL('../src/data/editorial-content.json',import.meta.url),'utf8'));
const hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const approval={version:1,revision:'facade00-facd-4000-8000-000000000001',approvedAt:'2026-09-28T12:00:00Z'};
test('release candidate reconciles multiple approvals without changing the baseline or structural fields',()=>{
 const before=JSON.stringify({home,catalog});
 const homeExport={...approval,type:'ashbi-home',baseRevision:hash(home),content:{...home,heroIntro:'Fabricated approved homepage copy.'}};
 const id='service:web-design';const serviceExport={...approval,type:'ashbi-document',documentId:id,kind:'service',baseRevision:hash(catalog[id].content),content:{...catalog[id].content,summary:'Fabricated approved service copy.'}};
 const next=contentReleaseChanges([homeExport,serviceExport],home,catalog);
 assert.equal(next.home.heroIntro,homeExport.content.heroIntro);assert.equal(next.catalog[id].content.summary,serviceExport.content.summary);
 assert.deepEqual(next.changes.map(change=>change.documentId),['home',id]);
 assert.deepEqual(next.changes[1].fields,[{field:'summary',before:catalog[id].content.summary,after:serviceExport.content.summary}]);
 assert.equal(JSON.stringify({home,catalog}),before);
 assert.deepEqual(next.catalog['project:della'],catalog['project:della']);
 for(const exports of [[],[homeExport,homeExport],[{...homeExport,type:'ashbi-draft'}],[{...serviceExport,baseRevision:'stale'}],[{...homeExport,approvedAt:null}],[{...homeExport,content:home}],[{...serviceExport,content:{...serviceExport.content,price:'$1'}}]])assert.throws(()=>contentReleaseChanges(exports,home,catalog));
});
test('candidate integrity binds nested source/assets and excludes private configuration',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'ashbi-release-inputs-'));
 try{
  await mkdir(root+'/src');await mkdir(root+'/public');
  for(const name of ['astro.config.mjs','package.json','package-lock.json','tsconfig.json'])await writeFile(root+'/'+name,'fixture');
  await writeFile(root+'/src/copy.json','original');await writeFile(root+'/public/image.svg','original');
  const original=await releaseInputDigest(root);await writeFile(root+'/.env','PRIVATE_FIXTURE=not-real');
  assert.equal(await releaseInputDigest(root),original);
  await writeFile(root+'/public/image.svg','changed');assert.notEqual(await releaseInputDigest(root),original);
  await writeFile(root+'/public/image.svg','original');await symlink(root+'/.env',root+'/public/private-link');
  await assert.rejects(releaseInputDigest(root),/must not contain symlinks/);
 }finally{await rm(root,{recursive:true,force:true});}
});
