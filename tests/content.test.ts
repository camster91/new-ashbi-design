import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {randomBytes} from 'node:crypto';
import {validateHomeContent,validateContent,validateArticleBody} from '../src/lib/content.ts';
import {createContentStore,createEditorialStores} from '../server/content-store.mjs';
import {createStateStore,hashPassword} from '../server/state.mjs';
import {createAdminHandler} from '../server/admin.mjs';
import {reviewedContent,reviewedDocument} from '../ops/apply-content.mjs';
const base=JSON.parse(await readFile(new URL('../src/data/home-content.json',import.meta.url),'utf8'));
const catalog=JSON.parse(await readFile(new URL('../src/data/editorial-content.json',import.meta.url),'utf8'));

test('CMS validates plain text and rejects missing, oversized and unknown fields',()=>{
 assert.deepEqual(validateHomeContent(base),base);
 for(const invalid of [{...base,heroIntro:'<script>bad()</script>'},{...base,heroIntro:''},{...base,heroIntro:'a'.repeat(401)},{...base,price:'999'},{}])assert.throws(()=>validateHomeContent(invalid));
});

test('services and campaigns have isolated drafts; restoring a revision revokes approval',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'ashbi-editorial-'));
 try{
  const documents=await createEditorialStores({directory,home:base,catalog});
  assert.equal(Object.keys(documents).length,1+Object.keys(catalog).length);
  const id='service:web-design',service=documents[id].store;
  const original=service.get();
  const changed=await service.save({...original.content,summary:'Fabricated service draft.'},original.revision);
  assert.equal(documents['campaign:shopify-design'].store.get().content.intro,catalog['campaign:shopify-design'].content.intro);
  await service.approve(changed.revision);
  const snapshot=service.export();
  const applied=reviewedDocument(snapshot,catalog);
  assert.equal(applied[id].content.summary,'Fabricated service draft.');
  assert.deepEqual(applied['campaign:shopify-design'],catalog['campaign:shopify-design']);
  assert.throws(()=>reviewedDocument({...snapshot,documentId:'../../state'},catalog));
  assert.throws(()=>reviewedDocument({...snapshot,kind:'campaign'},catalog));
  assert.throws(()=>validateContent('service',{...original.content,price:'$1'}));
  const history=await service.history();assert.equal(history.length,2);assert.ok(history.some(record=>record.revision===original.revision));
  await assert.rejects(service.restore('../../state',service.get().revision));
  await assert.rejects(service.restore(original.revision,'stale'));
  const restored=await service.restore(original.revision,service.get().revision);
  assert.equal(restored.status,'draft');assert.deepEqual(restored.content,original.content);assert.throws(()=>service.export());
  const restart=await createEditorialStores({directory,home:base,catalog});assert.deepEqual(restart[id].store.get().content,original.content);assert.ok((await restart[id].store.history()).length>=3);
 }finally{await rm(directory,{recursive:true,force:true});}
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
 const documents=await createEditorialStores({directory:path.join(directory,'documents'),home:base,catalog});
 let handler:any;
 const server=http.createServer((req,res)=>{void handler(req,res);});
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 const address=server.address();assert.ok(address&&typeof address!=='string');const origin=`http://127.0.0.1:${address.port}`;
 handler=createAdminHandler({store,origin,content,documents:{'campaign:shopify-design':documents['campaign:shopify-design'],'article:brand-designer-what-is-it-and-how-to-become-one':documents['article:brand-designer-what-is-it-and-how-to-become-one']},sendTest:async()=>{throw new Error('No email in CMS tests');}});
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
  assert.equal((await fetch(origin+'/admin/content?document=../../state',{headers:{Cookie:cookie}})).status,404);
  const campaign=documents['campaign:shopify-design'].store,original=campaign.get();
  const invalidSave=await post('/admin/content/save',{...original.content,intro:'a'.repeat(1001),document:'campaign:shopify-design',csrf,revision:original.revision},cookie);
  assert.equal(invalidSave.status,400);const recovery=await invalidSave.text();assert.match(recovery,/draft was not saved/);assert.ok(recovery.includes('a'.repeat(1001)));assert.deepEqual(campaign.get().content,original.content);
  assert.equal((await post('/admin/content/save',{...original.content,intro:'Fabricated campaign draft.',document:'campaign:shopify-design',csrf,revision:original.revision},cookie)).status,303);
  const staleSave=await post('/admin/content/save',{...original.content,intro:'Stale tab words.',document:'campaign:shopify-design',csrf,revision:original.revision},cookie);
  assert.equal(staleSave.status,400);const staleHtml=await staleSave.text();const saveForm=staleHtml.match(/<form method="post" action="\/admin\/content\/save"[\s\S]*?<\/form>/)?.[0]||'';
  assert.ok(saveForm.includes(`name="revision" value="${original.revision}"`));assert.equal(campaign.get().content.intro,'Fabricated campaign draft.');
  const campaignPage=await (await fetch(origin+'/admin/content?document=campaign:shopify-design',{headers:{Cookie:cookie}})).text();assert.match(campaignPage,/Fabricated campaign draft/);assert.match(campaignPage,/Earlier revisions/);
  assert.equal(content.get().content.heroIntro,'Fabricated saved draft.');
  assert.equal((await post('/admin/content/restore',{document:'campaign:shopify-design',csrf:'bad',revision:campaign.get().revision,restoreRevision:original.revision,confirm:'yes'},cookie)).status,403);
  assert.equal((await post('/admin/content/restore',{document:'campaign:shopify-design',csrf,revision:campaign.get().revision,restoreRevision:original.revision,confirm:'yes'},cookie)).status,303);
  assert.deepEqual(campaign.get().content,original.content);assert.equal(campaign.get().status,'draft');
  const articleId='article:brand-designer-what-is-it-and-how-to-become-one',article=documents[articleId].store;
  const articlePage=await (await fetch(origin+'/admin/content?document='+articleId,{headers:{Cookie:cookie}})).text();assert.match(articlePage,/Choose content document/);assert.match(articlePage,/&lt;h2&gt;/);
  const longBody='<p>'+ 'Long fabricated article words. '.repeat(900)+'</p>';
  assert.ok(new URLSearchParams({body:longBody}).toString().length>12000);
  assert.equal((await post('/admin/content/save',{...article.get().content,body:longBody,document:articleId,csrf,revision:article.get().revision},cookie)).status,303);
  assert.equal(article.get().content.body,longBody);
  const unsafe=await post('/admin/content/save',{...article.get().content,body:'<script>bad()</script>',document:articleId,csrf,revision:article.get().revision},cookie);assert.equal(unsafe.status,400);assert.ok((await unsafe.text()).includes('&lt;script&gt;bad()&lt;/script&gt;'));assert.equal(article.get().content.body,longBody);

 }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));await rm(directory,{recursive:true,force:true});}
});


test('article bodies reject active HTML, unbalanced tags and unapproved references',()=>{
 assert.equal(validateArticleBody('<h2>A heading</h2><p>Safe <strong>copy</strong>.</p>'),'<h2>A heading</h2><p>Safe <strong>copy</strong>.</p>');
 for(const body of ['<script>alert(1)</script>','<img src=x onerror=alert(1)>','<p style="color:red">Text</p>','<p>Unclosed','<p><strong>Bad</p></strong>','<a href="javascript:alert(1)">Link</a>','<a href="https://example.com">Link</a>','<a href="https://help.elements.envato.com" onclick="bad()">Link</a>'])assert.throws(()=>validateArticleBody(body));
 for(const entry of Object.values(catalog) as Array<{kind:any,content:any}>)assert.doesNotThrow(()=>validateContent(entry.kind,entry.content));
 assert.throws(()=>validateContent('project',{intro:'Draft',approach:'Draft',outcome:'Draft',services:'Invented role'}));
});

test('article and project changes remain isolated through reviewed export',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'ashbi-article-project-'));
 try{
  const documents=await createEditorialStores({directory,home:base,catalog});
  const article=documents['article:prepare-for-a-shopify-redesign'].store;
  const original=article.get();const draft=await article.save({...original.content,body:'<h2>Fabricated heading</h2><p>Isolated article words.</p>'},original.revision);
  await article.approve(draft.revision);const next=reviewedDocument(article.export(),catalog);
  assert.equal(next['article:prepare-for-a-shopify-redesign'].content.body,'<h2>Fabricated heading</h2><p>Isolated article words.</p>');
  assert.deepEqual(next['project:bpm'],catalog['project:bpm']);
  const project=documents['project:bpm'].store;const prior=project.get();await project.save({...prior.content,intro:'Fabricated project words.'},prior.revision);
  assert.equal(article.get().status,'approved');assert.equal(project.get().status,'draft');assert.throws(()=>project.export());
 }finally{await rm(directory,{recursive:true,force:true});}
});
