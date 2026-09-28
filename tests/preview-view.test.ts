import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,mkdir,writeFile,symlink,rm} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {previewAsset} from '../server/content-preview-view.mjs';
const id='00000000-0000-4000-8000-000000000000',prefix='/admin/content/preview/'+id;
test('private preview serves confined layout assets with no script or form execution',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'ashbi-preview-view-'));
 try{
  await mkdir(path.join(directory,'dist'));await writeFile(path.join(directory,'dist/index.html'),'<html><head><script>steal()</script><meta http-equiv="refresh" content="0;url=/admin/"></head><body><link href="/page.css"><img src="/asset.webp"><a href="/work/">Work</a><form action="/api/enquiries"></form></body></html>');
  await writeFile(path.join(directory,'dist/page.css'),'body{background:url(/asset.webp)}');await writeFile(path.join(directory,'private.json'),'private');await symlink(path.join(directory,'private.json'),path.join(directory,'dist/outside.html'));
  const asset=await previewAsset({directory,id,pathname:prefix+'/'});assert.ok(asset);const html=asset.body.toString();assert.ok(!html.includes('steal()'));assert.ok(html.includes('animation:none!important'));assert.ok(!html.includes('http-equiv'));assert.ok(html.includes(`src="${prefix}/asset.webp"`));assert.ok(html.includes(`href="${prefix}/work/"`));assert.match(asset.headers['Content-Security-Policy'],/script-src 'none'/);assert.match(asset.headers['Content-Security-Policy'],/form-action 'none'/);assert.equal(asset.headers['Cache-Control'],'no-store');
  const css=await previewAsset({directory,id,pathname:prefix+'/page.css'});assert.ok(css?.body.toString().includes('url('+prefix+'/asset.webp)'));
  for(const route of ['/../private.json','/%2e%2e/private.json','/outside.html','/private.json','/script.js','/bad%zz'])assert.equal(await previewAsset({directory,id,pathname:prefix+route}),null);
 }finally{await rm(directory,{recursive:true,force:true});}
});
