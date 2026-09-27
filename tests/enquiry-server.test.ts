import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {createEnquiryHandler} from '../server/enquiry-handler.mjs';

const origin='https://preview.ashbi.ca';
const valid={name:'Isolated Visitor',email:'visitor@example.test',service:'branding',description:'A fabricated project for a local endpoint test.',company:'Example Studio',website:'example.test',timing:'Next quarter',campaign:'shopify-design',project:'chef-tanya'};

async function withServer(deliver:(brief:typeof valid)=>Promise<void>,run:(url:string)=>Promise<void>,now?:()=>number){
  const server=http.createServer(createEnquiryHandler({origin,deliver,now}));
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address=server.address();
  assert.ok(address&&typeof address!=='string');
  try{await run(`http://127.0.0.1:${address.port}/api/enquiries`);}
  finally{await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));}
}
const post=(url:string,body:unknown,headers:Record<string,string>={})=>fetch(url,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...headers},body:typeof body==='string'?body:JSON.stringify(body)});

test('accepts a validated brief only after the delivery sink succeeds',async()=>{
  const delivered:unknown[]=[];
  await withServer(async brief=>{delivered.push(brief);},async url=>{
    const result=await post(url,valid);
    assert.equal(result.status,200);
    assert.deepEqual(await result.json(),{accepted:true});
    assert.deepEqual(delivered,[valid]);
  });
});

test('rejects wrong origin, invalid payload, oversized payload and failed delivery',async()=>{
  let calls=0;
  await withServer(async()=>{calls++;throw new Error('isolated sink failure');},async url=>{
    assert.equal((await post(url,valid,{Origin:'https://other.example'})).status,403);
    assert.equal((await post(url,{...valid,email:'invalid'})).status,400);
    assert.equal((await post(url,'{bad')).status,400);
    assert.equal((await post(url,{...valid,description:'x'.repeat(9000)})).status,413);
    const result=await post(url,valid);
    assert.equal(result.status,503);
    assert.deepEqual(await result.json(),{accepted:false});
    assert.equal(calls,1);
  });
});

test('honeypot is suppressed and requests are rate limited',async()=>{
  let calls=0;
  await withServer(async()=>{calls++;},async url=>{
    const honeypot=await post(url,{...valid,fax_number:'123'});
    assert.deepEqual(await honeypot.json(),{accepted:true});
    for(let i=0;i<4;i++)assert.equal((await post(url,valid)).status,200);
    assert.equal((await post(url,valid)).status,429);
    assert.equal(calls,4);
  });
});

test('unrecognised campaign and project attribution are rejected before delivery',async()=>{
 let calls=0;
 await withServer(async()=>{calls++;},async url=>{
  assert.equal((await post(url,{...valid,campaign:'private@example.test'})).status,400);
  assert.equal((await post(url,{...valid,project:'private@example.test'})).status,400);
  assert.equal(calls,0);
 });
});

test('real gateway persists attribution and deduplicates accepted retries with an isolated mail sink',async()=>{
 const {mkdtemp,rm}=await import('node:fs/promises');
 const {tmpdir}=await import('node:os');
 const {randomBytes,randomUUID}=await import('node:crypto');
 const {createLeadStore,persistThenDeliver}=await import('../server/lead-store.mjs');
 const {projectBriefMessage}=await import('../server/mailgun.mjs');
 const directory=await mkdtemp(`${tmpdir()}/ashbi-flow-`);
 try{
  const leads=createLeadStore({directory,key:randomBytes(32)});await leads.init();
  const messages:ReturnType<typeof projectBriefMessage>[]=[];
  const deliver=persistThenDeliver(leads,async (brief:typeof valid)=>{messages.push(projectBriefMessage(brief));});
  await withServer(deliver,async url=>{
   const key=randomUUID();
   for(let i=0;i<2;i++){
    const response=await post(url,valid,{'Idempotency-Key':key});
    assert.equal(response.status,200);assert.deepEqual(await response.json(),{accepted:true});
   }
  });
  assert.equal(messages.length,1);assert.match(messages[0].text,/Campaign: shopify-design/);assert.match(messages[0].text,/Project reference: chef-tanya/);
  const records=await leads.list();assert.equal(records.length,1);
  assert.equal(records[0].brief.campaign,'shopify-design');
  assert.equal(records[0].brief.project,'chef-tanya');
  assert.equal(records[0].status,'accepted-by-mailgun');
 }finally{await rm(directory,{recursive:true,force:true});}
});
