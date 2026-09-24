import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {createEnquiryHandler} from '../server/enquiry-handler.mjs';

const origin='https://preview.ashbi.ca';
const valid={name:'Isolated Visitor',email:'visitor@example.test',service:'branding',description:'A fabricated project for a local endpoint test.',company:'Example Studio',website:'example.test',timing:'Next quarter'};

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
