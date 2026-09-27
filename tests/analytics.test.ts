import test from 'node:test';
import assert from 'node:assert/strict';
import {briefLinkContext} from '../src/lib/analytics.ts';

test('brief CTA attribution keeps known route context without copying arbitrary URL data',()=>{
  assert.deepEqual(briefLinkContext('/contact/?service=web-design&campaign=shopify-design&project=chef-tanya&utm_term=private-search#project-brief','https://ashbi.ca'),{
    service:'web-design',campaign:'shopify-design',project:'chef-tanya',
  });
  assert.deepEqual(briefLinkContext('/contact/?service=person@example.test&project=unknown#project-brief','https://ashbi.ca'),{
    service:undefined,campaign:undefined,project:undefined,
  });
  assert.equal(briefLinkContext('https://other.example/contact/#project-brief','https://ashbi.ca'),null);
  assert.equal(briefLinkContext('/contact/','https://ashbi.ca'),null);
  assert.equal(briefLinkContext('/work/cocofro/','https://ashbi.ca'),null);
});
