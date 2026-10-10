import test from 'node:test';import assert from 'node:assert/strict';import http from 'node:http';import os from 'node:os';import path from 'node:path';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';import {randomBytes} from 'node:crypto';
import {createContentStore} from '../server/content-store.mjs';import {createAdminHandler} from '../server/admin.mjs';import {createStateStore,hashPassword} from '../server/state.mjs';
const base=JSON.parse(await readFile(new URL('../src/data/home-content.json',import.meta.url),'utf8'));
test('source reconciliation preserves approved copy and history, requires both guards and revokes approval',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'ashbi-reconcile-'));
 try{
  const old=createContentStore({directory,base});await old.init();await old.save({...base,heroIntro:'Saved editorial words.'},old.get().revision);await old.approve(old.get().revision);const approved=old.get();
  const current=createContentStore({directory,base:{...base,heroIntro:'Current release words.'}});await current.init();const review=current.reconciliation();assert.equal(current.get().sourceChanged,true);assert.deepEqual(review.differences,[{field:'heroIntro',source:'Current release words.',draft:'Saved editorial words.'}]);
  await assert.rejects(current.reconcile('stale',review.sourceBaseline));await assert.rejects(current.reconcile(approved.revision,'a'.repeat(64)));await assert.rejects(current.reconcile(approved.revision,''));assert.deepEqual(current.get(),{...approved,sourceChanged:true});
  const attempts=await Promise.allSettled([current.reconcile(approved.revision,review.sourceBaseline),current.reconcile(approved.revision,review.sourceBaseline)]);assert.equal(attempts.filter(x=>x.status==='fulfilled').length,1);
  const reconciled=current.get();assert.equal(reconciled.sourceChanged,false);assert.equal(reconciled.status,'draft');assert.equal(reconciled.approvedAt,null);assert.notEqual(reconciled.revision,approved.revision);assert.deepEqual(reconciled.content,approved.content);assert.throws(()=>current.export());
  assert.ok((await current.history()).some(entry=>entry.revision===approved.revision&&entry.status==='approved'));
  await assert.rejects(current.reconcile(reconciled.revision,review.sourceBaseline),/already uses/);assert.deepEqual(current.get(),reconciled);
  const restart=createContentStore({directory,base:{...base,heroIntro:'Current release words.'}});await restart.init();assert.deepEqual(restart.get(),reconciled);await restart.save(reconciled.content,reconciled.revision);await restart.approve(restart.get().revision);assert.equal(restart.export().content.heroIntro,'Saved editorial words.');
 }finally{await rm(directory,{recursive:true,force:true});}
});
test('reconciliation retains validated project asset compatibility and rejects unknown fields',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'ashbi-reconcile-assets-'));
 const catalog=JSON.parse(await readFile(new URL('../src/data/editorial-content.json',import.meta.url),'utf8')),id='project:bpm',project=catalog[id].content;
 try{
  const store=createContentStore({directory,base:project,id,kind:'project'});await store.init();await store.save(project,store.get().revision);
  const file=path.join(directory,'project-bpm.json'),saved=JSON.parse(await readFile(file,'utf8'));saved.baseRevision='a'.repeat(64);delete saved.content.cardAsset;delete saved.content.heroAsset;await writeFile(file,JSON.stringify(saved));
  const current=createContentStore({directory,base:project,id,kind:'project'});await current.init();assert.equal(current.get().content.cardAsset,project.cardAsset);await current.reconcile(current.get().revision,current.reconciliation().sourceBaseline);assert.deepEqual(current.get().content,project);
  saved.content.unsupported='bad';await writeFile(file,JSON.stringify(saved));await assert.rejects(createContentStore({directory,base:project,id,kind:'project'}).init());
 }finally{await rm(directory,{recursive:true,force:true});}
});
test('admin reconciliation compares source/draft and requires login, CSRF, origin, confirmation and exact revisions',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'ashbi-reconcile-admin-'));let server:http.Server|undefined;
 try{
  const state=createStateStore({file:path.join(directory,'state.json'),key:randomBytes(32)});await state.init();await state.update(async (next:any)=>{next.password=await hashPassword('synthetic-admin-password');});
  const old=createContentStore({directory:path.join(directory,'content'),base});await old.init();await old.save({...base,heroIntro:'Private draft words.'},old.get().revision);await old.approve(old.get().revision);
  const content=createContentStore({directory:path.join(directory,'content'),base:{...base,heroIntro:'New source words.'}});await content.init();let handler:any;server=http.createServer((req,res)=>void handler(req,res));await new Promise<void>(resolve=>server!.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+((server.address() as {port:number}).port);handler=createAdminHandler({store:state,origin,content,sendTest:async()=>{throw new Error('No email');}});
  const post=(body:Record<string,string>,cookie='',requestOrigin=origin,route='/admin/content/reconcile')=>fetch(origin+route,{method:'POST',redirect:'manual',headers:{Origin:requestOrigin,Cookie:cookie,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(body)});
  assert.equal((await post({})).status,303);const login=await post({email:'cameron@ashbi.ca',password:'synthetic-admin-password'},'',origin,'/admin/login');const cookie=login.headers.get('set-cookie')!.split(';')[0];
  const html=await(await fetch(origin+'/admin/content',{headers:{Cookie:cookie}})).text();assert.match(html,/Current website source/);assert.match(html,/New source words/);assert.match(html,/Private draft words/);assert.match(html,/Reconcile saved draft/);
  const csrf=html.match(/name="csrf" value="([^"]+)"/)![1],body={csrf,document:'home',revision:content.get().revision,sourceBaseline:content.reconciliation().sourceBaseline,confirm:'yes'};
  assert.equal((await post({...body,csrf:'wrong'},cookie)).status,403);assert.equal((await post(body,cookie,'https://wrong.test')).status,403);assert.equal((await post({...body,confirm:''},cookie)).status,400);assert.equal((await post({...body,revision:'stale'},cookie)).status,400);assert.equal((await post({...body,sourceBaseline:'b'.repeat(64)},cookie)).status,400);assert.equal(content.get().sourceChanged,true);
  assert.equal((await post(body,cookie)).status,303);assert.equal(content.get().status,'draft');assert.equal(content.get().sourceChanged,false);assert.throws(()=>content.export());assert.equal((await post(body,cookie)).status,400);
  const fresh=await(await fetch(origin+'/admin/content',{headers:{Cookie:cookie}})).text();assert.equal(fresh.includes('Reconcile saved draft'),false);assert.match(fresh,/Private draft words/);
 }finally{if(server){server.closeAllConnections();await new Promise<void>(resolve=>server!.close(()=>resolve()));}await rm(directory,{recursive:true,force:true});}
});
