import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {createAdminHandler} from '../server/admin.mjs';
import {createStateStore,encryptionKey,hashPassword,verifyPassword} from '../server/state.mjs';
import {sendMailgunMessage,validateMailgunSettings,projectBriefMessage} from '../server/mailgun.mjs';
import {clientIdentity,chargeBucket} from '../server/client-identity.mjs';

test('only an explicitly trusted proxy can supply the visitor IP; buckets expire and remain bounded',()=>{
  const req={socket:{remoteAddress:'10.0.0.2'},headers:{'x-real-ip':'203.0.113.9'}} as any;
  assert.equal(clientIdentity(req),'10.0.0.2');
  assert.equal(clientIdentity(req,'10.0.0.2'),'203.0.113.9');
  req.headers['x-real-ip']='not-an-ip';
  assert.equal(clientIdentity(req,'10.0.0.2'),'10.0.0.2');
  let time=0;const buckets=new Map();
  assert.equal(chargeBucket(buckets,'first',{windowMs:100,max:1,now:()=>time,limit:1}),false);
  assert.equal(chargeBucket(buckets,'first',{windowMs:100,max:1,now:()=>time,limit:1}),true);
  time=101;
  assert.equal(chargeBucket(buckets,'second',{windowMs:100,max:1,now:()=>time,limit:1}),false);
  assert.equal(buckets.has('first'),false);
});

test('encrypted settings persist without exposing the Mailgun key; password hashes verify',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'ashbi-admin-'));
  try{
    const file=path.join(dir,'admin-state.json'),key=randomBytes(32);
    const store=createStateStore({file,key});await store.init();
    const password=await hashPassword('a strong local test password');
    await store.update((state:any)=>{state.password=password;state.mailgun={region:'US',domain:'mg.ashbi.ca',from:'hello@mg.ashbi.ca',apiKey:'key-local-test-only'};});
    assert.equal(await verifyPassword('a strong local test password',password),true);
    assert.equal(await verifyPassword('wrong',password),false);
    const onDisk=await readFile(file,'utf8');
    assert.equal(onDisk.includes('key-local-test-only'),false);
    const reopened=createStateStore({file,key});await reopened.init();
    assert.equal((reopened.get() as any).mailgun.apiKey,'key-local-test-only');
    await assert.rejects(createStateStore({file,key:randomBytes(32)}).init());
    assert.throws(()=>encryptionKey('weak'));
  }finally{await rm(dir,{recursive:true,force:true});}
});

test('Mailgun request uses fixed regional API, domain sending key and plain text',async()=>{
  const config=validateMailgunSettings({region:'EU',domain:'mg.ashbi.ca',from:'hello@mg.ashbi.ca',apiKey:'key-local-test-only'});
  let seenUrl='',seenInit:RequestInit|undefined;
  const transport=async(url:any,init:any)=>{seenUrl=String(url);seenInit=init;return Response.json({id:'test-id'});};
  await sendMailgunMessage(config,{to:'cameron@ashbi.ca',subject:'Test',text:'Fabricated content',testMode:true},transport);
  assert.equal(seenUrl,'https://api.eu.mailgun.net/v3/mg.ashbi.ca/messages');
  assert.equal((seenInit?.body as FormData).get('o:testmode'),'yes');
  assert.equal((seenInit?.body as FormData).get('text'),'Fabricated content');
  assert.equal(seenUrl.includes('key-local'),false);
  assert.match(String((seenInit?.headers as Record<string,string>).Authorization),/^Basic /);
  assert.equal(projectBriefMessage({email:'person@example.test',name:'A',service:'branding',description:'Mock',company:'',website:'',timing:''}).to,'hello@ashbi.ca');
  assert.throws(()=>validateMailgunSettings({...config,from:'bad@other.test'}));
  await assert.rejects(sendMailgunMessage(config,{to:'cameron@ashbi.ca',subject:'Test',text:'Mock'},async()=>new Response('no',{status:401})));
  await assert.rejects(sendMailgunMessage(config,{to:'cameron@ashbi.ca',subject:'Test',text:'Mock'},async()=>Response.json({})));
});

test('admin setup, login, settings, test and enable require session and confirmation',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'ashbi-admin-flow-'));
  const store=createStateStore({file:path.join(dir,'state.json'),key:randomBytes(32)});
  await store.init();
  let handler:ReturnType<typeof createAdminHandler>;
  const server=http.createServer((req,res)=>{void handler(req,res);});
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  const addr=server.address();assert.ok(addr&&typeof addr!=='string');
  const origin=`http://127.0.0.1:${addr.port}`;
  let testsSent=0,holdTest=false,signalTest:()=>void=()=>{},releaseTest:()=>void=()=>{};
  handler=createAdminHandler({store,origin,setupToken:'x'.repeat(32),sendTest:async()=>{testsSent++;if(holdTest){signalTest();await new Promise<void>(resolve=>{releaseTest=resolve;});}}});
  const get=(cookie='')=>fetch(`${origin}/admin/`,{headers:{Cookie:cookie}});
  const post=(route:string,form:Record<string,string>,cookie='',requestOrigin=origin)=>fetch(`${origin}${route}`,{method:'POST',redirect:'manual',headers:{Origin:requestOrigin,Cookie:cookie,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(form)});
  try{
    assert.match(await (await get()).text(),/Set up your studio login/);
    assert.equal((await post('/admin/setup',{token:'x'.repeat(32),password:'local test password 123'},'','https://wrong.test')).status,403);
    const setup=await post('/admin/setup',{token:'x'.repeat(32),password:'local test password 123'});
    assert.equal(setup.status,303);
    const cookie=setup.headers.get('set-cookie')?.split(';')[0]||'';
    assert.ok(cookie);
    const dashboard=await (await get(cookie)).text();
    const csrf=dashboard.match(/name="csrf" value="([^"]+)"/)?.[1]||'';
    assert.ok(csrf);
    assert.equal((await post('/admin/settings',{csrf:'wrong',region:'US'},cookie)).status,403);
    const saved=await post('/admin/settings',{csrf,region:'US',domain:'mg.ashbi.ca',from:'hello@mg.ashbi.ca',apiKey:'key-local-test-only'},cookie);
    assert.equal(saved.status,303);
    assert.equal(store.get().enabled,false);
    assert.equal((await (await get(cookie)).text()).includes('key-local-test-only'),false);
    assert.equal((await post('/admin/enable',{csrf,received:'yes'},cookie)).status,400);
    assert.equal((await post('/admin/test',{csrf,confirm:'yes'},cookie)).status,303);
    assert.equal(testsSent,1);
    assert.equal((await post('/admin/enable',{csrf,received:'yes'},cookie)).status,303);
    assert.equal(store.get().enabled,true);
    assert.equal((await post('/admin/disable',{csrf},cookie)).status,303);
    assert.equal(store.get().enabled,false);
    assert.equal((await post('/admin/logout',{csrf},cookie)).status,303);
    assert.match(await (await get(cookie)).text(),/Welcome back, Cameron/);
    assert.equal((await post('/admin/login',{email:'cameron@ashbi.ca',password:'wrong'})).status,403);
    const login=await post('/admin/login',{email:'cameron@ashbi.ca',password:'local test password 123'},'','null');
    assert.equal(login.status,303);
    const freshCookie=login.headers.get('set-cookie')?.split(';')[0]||'';
    const freshPage=await (await get(freshCookie)).text();
    const freshCsrf=freshPage.match(/name="csrf" value="([^"]+)"/)?.[1]||'';
    const revision=freshPage.match(/name="revision" value="([^"]*)"/)?.[1]||'';
    assert.ok(revision);
    holdTest=true;
    const entered=new Promise<void>(resolve=>{signalTest=resolve;});
    const inFlight=post('/admin/test',{csrf:freshCsrf,confirm:'yes'},freshCookie);
    await entered;
    assert.equal((await post('/admin/settings',{csrf:freshCsrf,revision,region:'US',domain:'mg.ashbi.ca',from:'hello@mg.ashbi.ca',apiKey:''},freshCookie)).status,303);
    releaseTest();
    assert.equal((await inFlight).status,400);
    assert.equal(store.get().lastTestAt,null);
    assert.equal((await post('/admin/settings',{csrf:freshCsrf,revision,region:'US',domain:'mg.ashbi.ca',from:'hello@mg.ashbi.ca',apiKey:''},freshCookie)).status,400);
  }finally{
    await new Promise<void>(resolve=>server.close(()=>resolve()));
    await rm(dir,{recursive:true,force:true});
  }
});
