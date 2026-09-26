import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readdir,readFile,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {createLeadStore,persistThenDeliver} from '../server/lead-store.mjs';

test('brief persists encrypted before delivery, survives failure and restart',async()=>{
  const directory=await mkdtemp(path.join(tmpdir(),'ashbi-leads-'));
  const key=randomBytes(32),brief={name:'Fabricated Visitor',email:'example@example.test',description:'Isolated test'};
  try{
    const leads=createLeadStore({directory,key});await leads.init();
    const deliver=persistThenDeliver(leads,async()=>{
      const files=await readdir(directory);assert.equal(files.length,1);
      assert.equal((await leads.read(files[0].replace('.json',''))).status,'pending');
      throw new Error('Simulated transport failure');
    });
    await assert.rejects(deliver(brief));
    const [file]=await readdir(directory);
    assert.equal((await readFile(path.join(directory,file),'utf8')).includes(brief.email),false);
    assert.equal((await stat(path.join(directory,file))).mode&0o777,0o600);
    const restored=createLeadStore({directory,key});await restored.init();
    const record=await restored.read(file.replace('.json',''));
    assert.equal(record.status,'delivery-failed');assert.deepEqual(record.brief,brief);
    await assert.rejects(restored.read('../admin-state'));
  }finally{await rm(directory,{recursive:true,force:true});}
});

test('storage failure prevents sending; successful transport records acceptance, not inbox delivery',async()=>{
  let sent=false;
  await assert.rejects(persistThenDeliver({reserve:async()=>{throw new Error('Storage unavailable');}},async()=>{sent=true;})({}));
  assert.equal(sent,false);
  const events:string[]=[];
  const leads={reserve:async()=>{events.push('saved');return {created:true,record:{}};},mark:async(id:string,status:string)=>{events.push(status);}};
  await persistThenDeliver(leads,async()=>{events.push('sent');})({});
  assert.deepEqual(events,['saved','sent','accepted-by-mailgun']);
});

test('same submission is sent once across concurrent requests and process restarts',async()=>{
  const directory=await mkdtemp(path.join(tmpdir(),'ashbi-once-')),key=randomBytes(32);
  const id='12345678-1234-4234-8234-123456789012',brief={email:'isolated@example.test'};
  try{
    const store=createLeadStore({directory,key});await store.init();
    let sends=0,release:()=>void=()=>{};
    const gate=new Promise<void>(resolve=>{release=resolve;});
    const deliver=persistThenDeliver(store,async()=>{sends++;await gate;});
    const first=deliver(brief,id);
    while(!sends)await new Promise(resolve=>setTimeout(resolve,1));
    await assert.rejects(deliver(brief,id));release();await first;
    const restored=createLeadStore({directory,key});await restored.init();
    await persistThenDeliver(restored,async()=>{sends++;})(brief,id);
    assert.equal(sends,1);assert.equal((await readdir(directory)).length,1);
    await assert.rejects(deliver({email:'different@example.test'},id));
    assert.equal(sends,1);
  }finally{await rm(directory,{recursive:true,force:true});}
});

test('uncertain transport failure is not automatically retried',async()=>{
  const directory=await mkdtemp(path.join(tmpdir(),'ashbi-uncertain-')),key=randomBytes(32);
  try{
    const store=createLeadStore({directory,key});await store.init();let sends=0;
    const deliver=persistThenDeliver(store,async()=>{sends++;throw new Error('Timeout after possible acceptance');});
    const id='12345678-1234-4234-8234-123456789012';
    await assert.rejects(deliver({},id));await assert.rejects(deliver({},id));
    assert.equal(sends,1);assert.equal((await store.list()).length,1);
  }finally{await rm(directory,{recursive:true,force:true});}
});
