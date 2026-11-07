import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handleRequest} from '../edge/worker.mjs';

test('apex redirects to the existing www canonical and retains the query', async()=>{
  const response=await handleRequest(new Request('https://ashbi.ca/work/?page=2'),()=>{throw Error('unexpected fetch');});
  assert.equal(response.status,308);
  assert.equal(response.headers.get('location'),'https://www.ashbi.ca/work/?page=2');
});
test('private gateway requests retain the original URL, body and cookies',async()=>{
  const request=new Request('https://www.ashbi.ca/admin/login',{method:'POST',headers:{cookie:'session=example',origin:'https://www.ashbi.ca'},body:'example'});
  const response=await handleRequest(request,async input=>{
    assert.equal(input,request);
    assert.equal(await input.text(),'example');
    return new Response('private',{headers:{'set-cookie':'session=next; Secure'}});
  });
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.equal(response.headers.get('set-cookie'),'session=next; Secure');
});
test('the enquiry API always reaches the original server',async()=>{
  const request=new Request('https://www.ashbi.ca/api/enquiries',{method:'POST',body:'{}'});
  const response=await handleRequest(request,async input=>{assert.equal(input,request);return Response.json({accepted:false},{status:400});});
  assert.equal(response.status,400);
});
test('static pages use Pages without forwarding visitor credentials or query data',async()=>{
  const response=await handleRequest(new Request('https://www.ashbi.ca/work/?private=value',{headers:{cookie:'session=example',authorization:'secret'}}),async input=>{
    assert.ok(input instanceof Request);
    assert.equal(input.url,'https://ashbi-design.pages.dev/work/');
    assert.equal(input.headers.get('cookie'),null);
    assert.equal(input.headers.get('authorization'),null);
    return new Response('site',{headers:{'x-robots-tag':'noindex','set-cookie':'unexpected=yes'}});
  });
  assert.equal(await response.text(),'site');
  assert.equal(response.headers.get('set-cookie'),null);
  assert.equal(response.headers.get('x-robots-tag'),null);
  assert.equal(response.headers.get('x-ashbi-hosting'),'cloudflare-pages');
});
test('Pages redirects stay on the public domain and retain the original query',async()=>{
  const response=await handleRequest(new Request('https://www.ashbi.ca/work?q=hello'),async()=>new Response(null,{status:308,headers:{location:'https://ashbi-design.pages.dev/work/'}}));
  assert.equal(response.headers.get('location'),'https://www.ashbi.ca/work/?q=hello');
});
test('missing static pages preserve their 404 status',async()=>{
  const response=await handleRequest(new Request('https://www.ashbi.ca/missing'),async()=>new Response('missing',{status:404}));
  assert.equal(response.status,404);
});
test('a double-slash path cannot change the Pages upstream host',async()=>{
  const response=await handleRequest(new Request('https://www.ashbi.ca//untrusted.example/path'),async input=>{
    assert.ok(input instanceof Request);
    assert.equal(new URL(input.url).hostname,'ashbi-design.pages.dev');
    return new Response('missing',{status:404});
  });
  assert.equal(response.status,404);
});
test('failed gateway requests return an error without retrying a submission',async()=>{
  let calls=0;
  const response=await handleRequest(new Request('https://www.ashbi.ca/api/enquiries',{method:'POST',body:'{}'}),async()=>{calls++;throw Error('offline');});
  assert.equal(response.status,502);
  assert.equal(calls,1);
});
test('unexpected hosts and static POST requests do not proxy',async()=>{
  const noFetch=()=>{throw Error('unexpected fetch');};
  assert.equal((await handleRequest(new Request('https://example.com/'),noFetch)).status,404);
  assert.equal((await handleRequest(new Request('https://www.ashbi.ca/contact/',{method:'POST'}),noFetch)).status,405);
});
