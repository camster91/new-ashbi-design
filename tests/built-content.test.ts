import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,readFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {checkBuiltContent} from '../ops/check-built-content.mjs';

test('built CMS gate requires edited content in the page body, not only metadata',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'ashbi-built-content-'));
 const home=JSON.parse(await readFile(new URL('../src/data/home-content.json',import.meta.url),'utf8'));
 const catalog={'service:branding':{kind:'service',content:{summary:'Unique & editable introduction',fit:'For a product team.'}}};
 try{
  await mkdir(path.join(directory,'services/branding'),{recursive:true});
  await writeFile(path.join(directory,'index.html'),`<html><body>${Object.values(home).map(value=>`<p>${value}</p>`).join('')}</body></html>`);
  const route=path.join(directory,'services/branding/index.html');
  await writeFile(route,'<html><body><p>Unique &amp; editable introduction</p><p>For a product team.</p></body></html>');
  assert.deepEqual(await checkBuiltContent(directory,home,catalog),{pages:2,fields:7});
  await writeFile(route,'<html><body>LOCAL DRAFT PREVIEW<p>Unique &amp; editable introduction</p><p>For a product team.</p></body></html>');
  await assert.rejects(checkBuiltContent(directory,home,catalog),/Draft preview/);
  await checkBuiltContent(directory,home,catalog,{allowDraft:true});
  await writeFile(route,'<html><head><meta content="Unique &amp; editable introduction"></head><body><p>For a product team.</p></body></html>');
  await assert.rejects(checkBuiltContent(directory,home,catalog),/summary/);
 }finally{await rm(directory,{recursive:true,force:true});}
});

test('asset gate checks the intended hero rather than an unrelated image',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'ashbi-built-assets-'));
 const home=JSON.parse(await readFile(new URL('../src/data/home-content.json',import.meta.url),'utf8'));
 const full=JSON.parse(await readFile(new URL('../src/data/editorial-content.json',import.meta.url),'utf8'));
 const entry=full['project:bpm'],catalog={'project:bpm':entry};
 try{
  await mkdir(path.join(directory,'work/bpm'),{recursive:true});
  await writeFile(path.join(directory,'index.html'),`<html><body>${Object.values(home).join(' ')}</body></html>`);
  const words=Object.entries(entry.content).filter(([key])=>!key.endsWith('Asset')).map(([,value])=>value).join(' ');
  await writeFile(path.join(directory,'work/index.html'),'<html><body><a href="/work/bpm/"><img src="/images/ashbi/bpm/web-hero-720.webp"></a></body></html>');
  const route=path.join(directory,'work/bpm/index.html');
  await writeFile(route,`<html><body>${words}<section class="project-hero"><img src="/images/ashbi/bpm/web-hero-1440.webp"></section></body></html>`);
  await checkBuiltContent(directory,home,catalog);
  await writeFile(route,`<html><body>${words}<section class="project-hero"></section><img src="/images/ashbi/bpm/web-hero-1440.webp"></body></html>`);
  await assert.rejects(checkBuiltContent(directory,home,catalog),/heroAsset/);
 }finally{await rm(directory,{recursive:true,force:true});}
});
