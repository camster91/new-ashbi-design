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
  await writeFile(route,'<html><head><meta content="Unique &amp; editable introduction"></head><body><p>For a product team.</p></body></html>');
  await assert.rejects(checkBuiltContent(directory,home,catalog),/summary/);
 }finally{await rm(directory,{recursive:true,force:true});}
});
