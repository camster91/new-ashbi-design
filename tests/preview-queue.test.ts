import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,mkdir,writeFile,access,rm} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {createPreviewQueue} from '../server/content-preview-queue.mjs';
const draft={version:1,type:'ashbi-draft',documentId:'home',kind:'home',revision:'00000000-0000-4000-8000-000000000000',baseRevision:'a'.repeat(64),content:{copy:'Fabricated'}};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('CMS preview queue coalesces a revision, serializes builds and keeps paths private',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'ashbi-preview-queue-'));let release=()=>{},entered=()=>{};const started=new Promise<void>(done=>entered=done);let running=0,peak=0;
 const queue=createPreviewQueue({directory,build:async({directory:jobDir,snapshot}:{directory:string;snapshot:typeof draft})=>{running++;peak=Math.max(peak,running);assert.equal(snapshot.content.copy,'Fabricated');await mkdir(jobDir);if(snapshot.documentId==='home')await new Promise<void>(done=>{release=done;entered();});running--;return {route:'/'};}});
 try{
  await queue.init();const first=await queue.request(draft);await started;const same=await queue.request(draft);assert.equal(first.id,same.id);assert.equal(queue.get(first.id)?.status,'building');assert.equal(queue.artifact(first.id),null);assert.equal(Object.hasOwn(first,'directory'),false);
  const next=await queue.request({...draft,documentId:'service:web-design'});assert.equal(next.status,'queued');release();await queue.idle();assert.equal(peak,1);assert.equal(queue.get(next.id)?.status,'ready');assert.ok(queue.artifact(next.id)?.startsWith(directory+path.sep));
  await assert.rejects(queue.request({...draft,documentId:'../../admin-state'}));queue.close();await assert.rejects(queue.request(draft));
 }finally{queue.close();await rm(directory,{recursive:true,force:true});}
});
test('CMS preview failures are generic; capacity and expiry bound completed artifacts',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'ashbi-preview-expiry-'));let clock=0;
 const queue=createPreviewQueue({directory,maxJobs:1,ttlMs:100,now:()=>clock,build:async({directory:jobDir}:{directory:string})=>{await mkdir(jobDir);await writeFile(path.join(jobDir,'private.log'),'fixture');throw new Error('private compiler details');}});
 try{
  await queue.init();const job=await queue.request(draft);await queue.idle();assert.equal(queue.get(job.id)?.status,'failed');assert.equal(JSON.stringify(queue.get(job.id)).includes('private'),false);await assert.rejects(queue.request({...draft,documentId:'service:web-design'}),/capacity/);
  clock=101;assert.equal(queue.get(job.id),null);assert.equal(queue.artifact(job.id),null);await queue.request({...draft,documentId:'service:web-design'});await assert.rejects(access(path.join(directory,job.id)));
 }finally{queue.close();await queue.idle();await rm(directory,{recursive:true,force:true});}
});
