import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,mkdir,writeFile,readFile,access,symlink,rm} from 'node:fs/promises';import path from 'node:path';import os from 'node:os';
import {createPreviewWorkspace} from '../server/content-preview-workspace.mjs';
test('preview workspace locks one worker and sweeps only expired owned sessions',async()=>{
 const parent=await mkdtemp(path.join(os.tmpdir(),'ashbi-preview-workspace-'));let clock=1000;
 try{
  for(const name of ['session-OLD001','session-NEW001','session-RAW001'])await mkdir(path.join(parent,name));
  for(const [name,createdAt] of [['session-OLD001',0],['session-NEW001',950]] as const)await writeFile(path.join(parent,name,'preview-session.json'),JSON.stringify({type:'ashbi-layout-preview-session',session:name,createdAt}));
  const outside=await mkdtemp(path.join(os.tmpdir(),'ashbi-preview-outside-'));await symlink(outside,path.join(parent,'session-LINK01'));
  try{
   const workspace=await createPreviewWorkspace({parent,ttlMs:100,now:()=>clock});
   await assert.rejects(access(path.join(parent,'session-OLD001')));await access(path.join(parent,'session-NEW001'));await access(path.join(parent,'session-RAW001'));await access(outside);
   await assert.rejects(createPreviewWorkspace({parent}),/locked/);clock=1100;await workspace.sweep();await assert.rejects(access(path.join(parent,'session-NEW001')));await access(workspace.directory);await workspace.release();await assert.rejects(access(workspace.directory));await assert.rejects(access(path.join(parent,'worker.lock')));
   const next=await createPreviewWorkspace({parent});await next.release();await workspace.release();
  }finally{await rm(outside,{recursive:true,force:true});}
 }finally{await rm(parent,{recursive:true,force:true});}
});
test('an abandoned worker lock fails closed rather than guessing or deleting it',async()=>{
 const parent=await mkdtemp(path.join(os.tmpdir(),'ashbi-preview-lock-'));
 try{const raw=JSON.stringify({type:'ashbi-preview-worker',token:'fixture',pid:999999});await writeFile(path.join(parent,'worker.lock'),raw);await assert.rejects(createPreviewWorkspace({parent}),/operator recovery/);assert.equal(await readFile(path.join(parent,'worker.lock'),'utf8'),raw);}
 finally{await rm(parent,{recursive:true,force:true});}
});
