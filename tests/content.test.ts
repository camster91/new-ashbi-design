import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {randomBytes} from 'node:crypto';
import {validateHomeContent} from '../src/lib/content.ts';
import {createContentStore} from '../server/content-store.mjs';
import {createStateStore,hashPassword} from '../server/state.mjs';
import {createAdminHandler} from '../server/admin.mjs';
import {reviewedContent} from '../ops/apply-content.mjs';
const base=JSON.parse(await readFile(new URL('../src/data/home-content.json',import.meta.url),'utf8'));

test('CMS validates plain text and rejects missing, oversized and unknown fields',()=>{
 assert.deepEqual(validateHomeContent(base),base);
 for(const invalid of [{...base,heroIntro:'<script>bad()</script>'},{...base,heroIntro:''},{...base,heroIntro:'a'.repeat(401)},{...base,price:'999'},{}])assert.throws(()=>validateHomeContent(invalid));
});

test('CMS draft revisions, approval and source compatibility survive restart',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'ashbi-content-'));
 try{
  const store=createContentStore({directory,base});await store.init();
  assert.throws(()=>store.export());
  const initial=store.get();
  const draft=await store.save({...base,heroIntro:'Fabricated review copy.'},initial.revision);
  await assert.rejects(store.save(base,initial.revision));
  assert.throws(()=>store.export());
  await store.approve(draft.revision);
  const exported=store.export();
  assert.equal(reviewedContent(exported,base).heroIntro,'Fabricated review copy.');
  assert.throws(()=>reviewedContent(exported,{...base,heroIntro:'Different release.'}));
  assert.throws(()=>reviewedContent({...exported,approvedAt:null},base));
  const restart=createContentStore({directory,base});await restart.init();assert.deepEqual(restart.export(),exported);
  const next=await restart.save(base,restart.get().revision);assert.equal(next.status,'draft');assert.throws(()=>restart.export());
  const changed=createContentStore({directory,base:{...base,heroIntro:'New release.'}});await changed.init();assert.equal(changed.get().sourceChanged,true);await assert.rejects(changed.approve(changed.get().revision));
 }finally{await rm(directory,{recursive:true,force:true});}
});

test('CMS admin requires login, CSRF, current revision and explicit approval',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'ashbi-content-admin-'));
 const store=createStateStore({file:path.join(directory,'state.json'),key:randomBytes(32)});await store.init();
 const password=await hashPassword('fabricated local password');
 await store.update((state:any)=>{state.password=password;});
 const content=createContentStore({directory:path.join(directory,'content'),base});await content.init();
 let handler:any;
 const server=http.createServer((req,res)=>{void handler(req,res);});
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 const address=server.address();assert.ok(address&&typeof address!=='string');const origin=`http://127.0.0.1:${address.port}`;
 handler=createAdminHandler({store,origin,content,sendTest:async()=>{throw new Error('No email in CMS tests');}});
 const post=(route:string,form:Record<string,string>,cookie='')=>fetch(origin+route,{method:'POST',redirect:'manual',headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(form)});
 try{
  assert.equal((await fetch(origin+'/admin/content/export',{redirect:'manual'})).status,303);
  const login=await post('/admin/login',{email:'cameron@ashbi.ca',password:'fabricated local password'});
  const cookie=login.headers.get('set-cookie')?.split(';')[0]||'';assert.ok(cookie);
  const page=await fetch(origin+'/admin/content',{headers:{Cookie:cookie}});assert.equal(page.status,200);assert.equal(page.headers.get('cache-control'),'no-store');
  const html=await page.text();const csrf=html.match(/name="csrf" value="([^"]+)"/)?.[1]||'';assert.ok(csrf);
  assert.equal((await post('/admin/content/save',{...base,csrf:'wrong',revision:content.get().revision},cookie)).status,403);
  assert.equal((await post('/admin/content/save',{...base,csrf,revision:content.get().revision,heroIntro:'Fabricated saved draft.'},cookie)).status,303);
  assert.equal((await fetch(origin+'/admin/content/export',{headers:{Cookie:cookie}})).status,400);
  assert.equal((await post('/admin/content/approve',{csrf,revision:content.get().revision},cookie)).status,400);
  assert.equal((await post('/admin/content/approve',{csrf,revision:content.get().revision,confirm:'yes'},cookie)).status,303);
  const exported=await fetch(origin+'/admin/content/export',{headers:{Cookie:cookie}});assert.equal(exported.status,200);assert.match(exported.headers.get('content-disposition')||'',/attachment/);assert.equal((await exported.json()).content.heroIntro,'Fabricated saved draft.');
 }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));await rm(directory,{recursive:true,force:true});}
});
