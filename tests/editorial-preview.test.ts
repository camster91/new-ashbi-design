import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,mkdtemp,rm,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import os from 'node:os';import path from 'node:path';
import {assetChoices,projectAsset} from '../src/lib/editorial-assets.ts';
import {validateContent} from '../src/lib/content.ts';
import {createEditorialStores} from '../server/content-store.mjs';
import {previewContent} from '../ops/preview-content.mjs';
import {reviewedContent,reviewedDocument} from '../ops/apply-content.mjs';
const home=JSON.parse(await readFile(new URL('../src/data/home-content.json',import.meta.url),'utf8'));
const catalog=JSON.parse(await readFile(new URL('../src/data/editorial-content.json',import.meta.url),'utf8'));

test('project image choices are existing local files scoped to a known project',async()=>{
 for(const [id,entry] of Object.entries(catalog) as Array<[string,{kind:any,content:any}]>){
  if(entry.kind!=='project')continue;
  for(const asset of Object.values(assetChoices(id))){assert.match(asset.src,/^\/images\/ashbi\//);await access(new URL('../public'+asset.src,import.meta.url));assert.ok(asset.alt);}
  assert.doesNotThrow(()=>validateContent('project',entry.content,id));
 }
 const bpm=catalog['project:bpm'].content;
 for(const value of ['../../state','https://example.com/fake.jpg','../della/view-01','__proto__'])assert.throws(()=>validateContent('project',{...bpm,cardAsset:value},'project:bpm'));
 assert.throws(()=>projectAsset('project:unknown','default-card'));
 assert.throws(()=>validateContent('project',bpm,'article:bpm'));
 assert.equal(projectAsset('project:bpm','view-02').src,'/images/ashbi/bpm/web-product-1440.webp');
 assert.ok(!Object.values(assetChoices('project:marin-food')).some(asset=>/tote/i.test(asset.alt)));
});

test('saved draft preview is isolated, source-bound, and rejected by release application',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'ashbi-preview-test-'));
 try{
  const documents=await createEditorialStores({directory,home,catalog});
  const project=documents['project:bpm'].store;const previous=project.get();
  await project.save({...previous.content,cardAsset:'view-02',intro:'Fabricated preview introduction.'},previous.revision);
  const draft=project.draft();const result=previewContent(draft,home,catalog);
  assert.equal(result.catalog['project:bpm'].content.cardAsset,'view-02');assert.equal(result.catalog['project:bpm'].content.intro,'Fabricated preview introduction.');
  assert.deepEqual(result.home,home);assert.deepEqual(result.catalog['project:della'],catalog['project:della']);assert.equal(catalog['project:bpm'].content.cardAsset,'default-card');
  assert.throws(()=>reviewedDocument(draft,catalog));assert.throws(()=>reviewedContent(draft,home));
  assert.throws(()=>previewContent({...draft,baseRevision:'wrong'},home,catalog));
  assert.throws(()=>previewContent({...draft,documentId:'../../private'},home,catalog));
  assert.throws(()=>previewContent({...draft,kind:'article'},home,catalog));
  const homeDraft=documents.home.store.draft();assert.deepEqual(previewContent(homeDraft,home,catalog).home,home);
 }finally{await rm(directory,{recursive:true,force:true});}
});


test('pre-selector project drafts remain readable and require source reconciliation',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'ashbi-legacy-draft-'));
 try{
  const {cardAsset,heroAsset,...legacy}=catalog['project:bpm'].content;
  const oldHash=createHash('sha256').update(JSON.stringify(legacy)).digest('hex');
  await writeFile(path.join(directory,'project-bpm.json'),JSON.stringify({version:1,baseRevision:oldHash,revision:oldHash,status:'draft',content:legacy,updatedAt:null,approvedAt:null}));
  await mkdir(path.join(directory,'project-bpm-history'));await writeFile(path.join(directory,'project-bpm-history',oldHash+'.json'),await readFile(path.join(directory,'project-bpm.json')));
  const documents=await createEditorialStores({directory,home,catalog});const store=documents['project:bpm'].store;
  assert.equal((await store.history())[0].content.intro,legacy.intro);
  assert.equal(store.get().sourceChanged,true);assert.equal(store.get().content.intro,legacy.intro);assert.equal(store.get().content.cardAsset,'default-card');
  assert.throws(()=>store.draft());assert.throws(()=>store.export());await assert.rejects(store.save(store.get().content,store.get().revision));
 }finally{await rm(directory,{recursive:true,force:true});}
});
