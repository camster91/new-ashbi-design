import test from 'node:test';import assert from 'node:assert/strict';
import {readBrief} from '../src/lib/enquiry.ts';
import {HUB_PRIVACY_VERSION,parseHubConfig,validHubBase,loadHubConfig,hubBriefErrors,hubInquiryPayload,createHubSender,type HubBrief} from '../src/lib/hub-inquiry.ts';
const config={enabled:true as const,privacyVersion:HUB_PRIVACY_VERSION,serviceLines:['brand_packaging','web_commerce','managed_support','unknown']};
const brief:HubBrief={...readBrief({name:'Fabricated Person',email:'test@example.invalid',description:'A fabricated product business.',service:'web-design',website:'example.invalid',campaign:'shopify-design',project:'bpm',timing:'exploring'}),requestedOutcome:'A clearer storefront.',consent:true};
const key='ashbi_ca:00000000-0000-4000-8000-000000000000';

test('Hub mode requires a known base and matching, bounded public config',async()=>{
 for(const base of ['https://user:pass@example.invalid/api/client-acquisition','http://example.invalid/api/client-acquisition','//example.invalid/api/client-acquisition','https://example.invalid/anything','https://example.invalid/api/client-acquisition?key=secret'])assert.equal(validHubBase(base),false);
 assert.equal(validHubBase('/api/client-acquisition'),true);assert.equal(validHubBase('https://example.invalid/api/client-acquisition'),true);
 assert.deepEqual(parseHubConfig(config),config);
 for(const bad of [{...config,enabled:false},{...config,privacyVersion:'old'},{...config,serviceLines:['invented']},{...config,ownerId:'private'},{...config,serviceLines:[]}])assert.equal(parseHubConfig(bad),null);
 let requests=0;assert.equal(await loadHubConfig('',async()=>{requests++;return Response.json(config);}),null);assert.equal(requests,0);
 assert.deepEqual(await loadHubConfig('/api/client-acquisition',async(url,init)=>{assert.equal(url,'/api/client-acquisition/config');assert.equal(init?.credentials,'omit');return Response.json(config);}),config);
 assert.equal(await loadHubConfig('/api/client-acquisition',async()=>new Response('<html>login</html>')),null);
});
test('website, service, requested outcome and attribution map to the governed Hub schema',()=>{
 const payload=hubInquiryPayload(brief,config,key,'/contact/');
 assert.equal(payload.serviceLine,'web_commerce');assert.equal(payload.website,'');assert.match(payload.businessContext,/Website: example.invalid/);assert.match(payload.businessContext,/Project reference: bpm/);assert.equal(payload.requestedOutcome,brief.requestedOutcome);assert.equal(payload.consent,true);assert.deepEqual(payload.attribution,{landingPage:'/contact/',campaign:'shopify-design'});
 assert.equal(hubInquiryPayload(brief,config,key,'//outside.invalid/?email=private').attribution.landingPage,'/contact/');
 assert.equal(hubInquiryPayload({...brief,service:'branding'},config,key,'/contact/').serviceLine,'brand_packaging');
 assert.ok(hubBriefErrors({...brief,consent:false},config).consent);assert.throws(()=>hubInquiryPayload({...brief,consent:false},config,key,'/contact/'));
 assert.ok(hubBriefErrors({...brief,requestedOutcome:''},config).requestedOutcome);assert.ok(hubBriefErrors(brief,{...config,serviceLines:['unknown']}).service);
 assert.ok(hubBriefErrors({...brief,timing:'tomorrow'},config).timing);
 assert.throws(()=>hubInquiryPayload({...brief,description:'界'.repeat(4500),requestedOutcome:'界'.repeat(2000)},config,key,'/contact/'));
});
test('Hub acceptance requires an actual recorded/replayed response and keeps retries idempotent',async()=>{
 for(const response of [Response.json({accepted:true}),Response.json({accepted:false,replayed:false}),Response.json({accepted:true,replayed:false},{status:202}),Response.json({accepted:true,replayed:false},{status:503}),new Response('OK')])assert.equal((await createHubSender('/api/client-acquisition',async()=>response)(brief,config,'/contact/')).ok,false);
 const keys:string[]=[];let calls=0;
 const send=createHubSender('/api/client-acquisition',async(url,init)=>{assert.equal(url,'/api/client-acquisition/intake');assert.equal(new Headers(init?.headers).has('Idempotency-Key'),false);assert.equal(init?.credentials,'omit');const payload=JSON.parse(String(init?.body));keys.push(payload.idempotencyKey);calls++;if(calls===1)throw new Error('Lost response');return Response.json({accepted:true,replayed:calls===2},{status:calls===2?200:201});});
 assert.equal((await send(brief,config,'/contact/')).ok,false);assert.deepEqual(await send(brief,config,'/contact/'),{ok:true});assert.deepEqual(await send({...brief,requestedOutcome:'Different desired outcome.'},config,'/contact/'),{ok:true});assert.equal(keys[0],keys[1]);assert.notEqual(keys[1],keys[2]);
});
test('Hub privacy changes, unavailable config, timeout and concurrency fail without losing the brief',async()=>{
 const privacy=createHubSender('/api/client-acquisition',async()=>Response.json({code:'PRIVACY_VERSION_CHANGED'},{status:409}));assert.deepEqual(await privacy(brief,config,'/contact/'),{ok:false,reason:'privacy'});
 let resolve:(response:Response)=>void=()=>{};const send=createHubSender('/api/client-acquisition',()=>new Promise(done=>resolve=done));
 const pending=send(brief,config,'/contact/');assert.deepEqual(await send(brief,config,'/contact/'),{ok:false,reason:'rejected'});resolve(Response.json({accepted:true,replayed:false},{status:201}));assert.deepEqual(await pending,{ok:true});
 const timeout=createHubSender('/api/client-acquisition',(_url,init)=>new Promise((_resolve,reject)=>init?.signal?.addEventListener('abort',()=>reject(new Error('timeout')))),5);assert.deepEqual(await timeout(brief,config,'/contact/'),{ok:false,reason:'timeout'});
 let calls=0;const unavailable=createHubSender('/api/client-acquisition',async()=>{calls++;return Response.json({accepted:true,replayed:false});});assert.deepEqual(await unavailable(brief,null,'/contact/'),{ok:false,reason:'unavailable'});assert.equal(calls,0);assert.equal(brief.email,'test@example.invalid');
});
