import test from 'node:test';
import assert from 'node:assert/strict';
import {createBriefSender,emailDraft,readBrief,validateBrief,validEndpoint} from '../src/lib/enquiry.ts';
const brief=readBrief({name:'Test Visitor',email:'visitor@example.test',service:'not-sure',description:'An isolated local test project.'});
test('required fields, service allowlist, email, website and lengths are checked',()=>{
 assert.deepEqual(validateBrief(brief),{});
 assert.equal(Object.keys(validateBrief(readBrief({}))).length,4);
 assert.ok(validateBrief({...brief,email:'bad'}).email);
 assert.ok(validateBrief({...brief,service:'invented'}).service);
 assert.ok(validateBrief({...brief,description:'x'.repeat(5001)}).description);
 assert.ok(validateBrief({...brief,website:'javascript:alert(1)'}).website);
 assert.deepEqual(validateBrief({...brief,website:'example.com'}),{});
});
test('only configured HTTPS or same-origin endpoints are eligible',()=>{
 for(const endpoint of ['','http://example.test','//example.test','/\\example.test','https://user:pass@example.test'])assert.equal(validEndpoint(endpoint),false);
 assert.equal(validEndpoint('/api/enquiries'),true);assert.equal(validEndpoint('https://example.test/enquiries'),true);
});
test('mailbox characters rejected by delivery are rejected before the browser transmits',async()=>{
 let calls=0;
 const send=createBriefSender('/api/enquiries',async()=>{calls++;return Response.json({accepted:true});});
 for(const email of ['one,two@example.test','<visitor>@example.test','visitor@example.test>','visitor@exa<mple.test','visitor@example.test\r\nBcc:other@example.test']){
  assert.ok(validateBrief({...brief,email}).email,email);
  assert.deepEqual(await send({...brief,email}),{ok:false,reason:'invalid'});
 }
 assert.equal(calls,0);
 assert.deepEqual(validateBrief({...brief,email:'visitor+qa@example.test'}),{});
});
test('missing endpoint and invalid form never transmit',async()=>{
 let calls=0;const transport=(async()=>{calls++;throw new Error('should not run')}) as typeof fetch;
 assert.deepEqual(await createBriefSender('',transport)(brief),{ok:false,reason:'unavailable'});
 assert.deepEqual(await createBriefSender('/api/enquiries',transport)({...brief,email:''}),{ok:false,reason:'invalid'});assert.equal(calls,0);
});
test('success requires explicit JSON acceptance, not just HTTP 200',async()=>{
 for(const response of [new Response('<html>OK</html>'),Response.json({}),Response.json({accepted:false}),Response.json({accepted:true},{status:500})]){
  assert.equal((await createBriefSender('/api/enquiries',async()=>response)(brief)).ok,false);
 }
 assert.deepEqual(await createBriefSender('/api/enquiries',async()=>Response.json({accepted:true}))(brief),{ok:true});
});
test('duplicate in-flight submits are blocked and network errors allow retry',async()=>{
 let complete:(response:Response)=>void=()=>{};let calls=0;
 const send=createBriefSender('/api/enquiries',()=>{calls++;return new Promise(resolve=>complete=resolve)});
 const first=send(brief);assert.deepEqual(await send(brief),{ok:false,reason:'rejected'});assert.equal(calls,1);
 complete(Response.json({accepted:true}));assert.deepEqual(await first,{ok:true});
 const failed=createBriefSender('/api/enquiries',async()=>{throw new Error('offline')});
 assert.deepEqual(await failed(brief),{ok:false,reason:'network'});assert.deepEqual(await failed(brief),{ok:false,reason:'network'});
});
test('timeout aborts request and reports uncertain receipt',async()=>{
 const send=createBriefSender('/api/enquiries',(_url,init)=>new Promise((_resolve,reject)=>init?.signal?.addEventListener('abort',()=>reject(new Error('aborted')))),5);
 assert.deepEqual(await send(brief),{ok:false,reason:'timeout'});
});
test('payload contains only expected fields and email draft safely encodes content',async()=>{
 const value=readBrief({...brief,unknown:'ignored',description:'A&B\nNew line'});
 await createBriefSender('/api/enquiries',async(_url,init)=>{assert.deepEqual(JSON.parse(String(init?.body)),value);assert.equal(init?.credentials,'omit');return Response.json({accepted:true})})(value);
 const draft=new URL(emailDraft(value));assert.equal(draft.protocol,'mailto:');assert.equal(draft.pathname,'hello@ashbi.ca');assert.ok(draft.searchParams.get('body')?.includes('A&B\nNew line'));
});

test('retry reuses its submission key; editing the brief creates a new key',async()=>{
 const keys:string[]=[];
 const send=createBriefSender('/api/enquiries',async(_url,init)=>{
  keys.push(new Headers(init?.headers).get('Idempotency-Key')!);throw new Error('lost response');
 });
 await send(brief);await send(brief);await send({...brief,description:'A changed project'});
 assert.match(keys[0],/^[0-9a-f-]{36}$/);assert.equal(keys[0],keys[1]);assert.notEqual(keys[1],keys[2]);
});

test('campaign, project and monthly plan context accept known values only',()=>{
 assert.deepEqual(validateBrief({...brief,campaign:'shopify-design'}),{});
 assert.ok(validateBrief({...brief,campaign:'person@example.test'}).campaign);
 assert.deepEqual(validateBrief({...brief,project:'cocofro'}),{});
 assert.ok(validateBrief({...brief,project:'person@example.test'}).project);
 assert.deepEqual(validateBrief({...brief,service:'design-and-dev-subscription',plan:'40-hours'}),{});
 assert.ok(validateBrief({...brief,service:'design-and-dev-subscription',plan:'person@example.test'}).plan);
 assert.ok(validateBrief({...brief,service:'branding',plan:'40-hours'}).plan);
 assert.equal(readBrief({...brief,utm_term:'private search text'}).campaign,'');
 assert.ok(decodeURIComponent(emailDraft({...brief,campaign:'shopify-design'})).includes('Campaign: shopify-design'));
 assert.ok(decodeURIComponent(emailDraft({...brief,project:'cocofro'})).includes('Project reference: cocofro'));
 assert.ok(decodeURIComponent(emailDraft({...brief,service:'design-and-dev-subscription',plan:'40-hours'})).includes('Monthly option: 40 hours per month'));
});
