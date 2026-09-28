import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,cp,symlink,realpath,readdir,lstat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {reviewedContent,reviewedDocument} from './apply-content.mjs';
import {checkBuiltContent} from './check-built-content.mjs';
import {previewEnvironment,runBoundedNode} from './preview-runner.mjs';

const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const inputs=['src','public','astro.config.mjs','package.json','package-lock.json','tsconfig.json'];
/** Content digest for actual build inputs, including assets; no env/data/Git secrets. */
export async function releaseInputDigest(root){
 const digest=createHash('sha256');
 async function visit(relative){
  const file=path.join(root,relative),info=await lstat(file);
  if(info.isSymbolicLink())throw new Error('Release inputs must not contain symlinks');
  if(info.isDirectory()){for(const name of (await readdir(file)).sort())await visit(path.join(relative,name));return;}
  if(!info.isFile())throw new Error('Unsupported release input');
  const bytes=await readFile(file);digest.update(JSON.stringify([relative,bytes.length]));digest.update(bytes);
 }
 for(const item of inputs)await visit(item);return digest.digest('hex');
}
/** Resolve each approved document against the same baseline; duplicates never overwrite. */
export function contentReleaseChanges(snapshots,home,catalog){
 if(!Array.isArray(snapshots)||snapshots.length<1||snapshots.length>36)throw new Error('Provide one to 36 approved exports');
 let nextHome=home;const nextCatalog=structuredClone(catalog),seen=new Set(),changes=[];
 for(const snapshot of snapshots){
  const id=snapshot?.type==='ashbi-home'?'home':snapshot?.documentId;
  if(typeof id!=='string'||seen.has(id))throw new Error('Duplicate or missing document export');
  seen.add(id);
  const after=id==='home'?reviewedContent(snapshot,home):reviewedDocument(snapshot,catalog)[id].content;
  const before=id==='home'?home:catalog[id].content;
  const fields=Object.keys(after).filter(field=>after[field]!==before[field]).map(field=>({field,before:before[field],after:after[field]}));
  if(fields.length===0)throw new Error('Approved export has no source changes');
  if(id==='home')nextHome=after;else nextCatalog[id]={...nextCatalog[id],content:after};
  changes.push({documentId:id,revision:snapshot.revision,approvedAt:snapshot.approvedAt,baseRevision:snapshot.baseRevision,fields});
 }
 return {home:nextHome,catalog:nextCatalog,changes};
}
/** Private, isolated candidate. No source apply, Git mutation, network release or credentials. */
export async function prepareContentRelease({root,snapshots,directory}){
 root=await realpath(root);directory=path.join(await realpath(path.dirname(directory)),path.basename(directory));
 const relative=path.relative(root,directory);
 if(relative===''||(!relative.startsWith('..'+path.sep)&&!path.isAbsolute(relative)&&!relative.startsWith('data'+path.sep)))throw new Error('Keep private candidates outside the checkout or under ignored data/');
 const sourceInputs=await releaseInputDigest(root);
 const home=JSON.parse(await readFile(path.join(root,'src/data/home-content.json'),'utf8'));
 const catalog=JSON.parse(await readFile(path.join(root,'src/data/editorial-content.json'),'utf8'));
 const next=contentReleaseChanges(snapshots,home,catalog);
 await mkdir(directory,{mode:0o700});
 const workspace=path.join(directory,'workspace');await mkdir(workspace,{mode:0o700});
 for(const item of inputs)await cp(path.join(root,item),path.join(workspace,item),{recursive:true});
 await symlink(await realpath(path.join(root,'node_modules')),path.join(workspace,'node_modules'));
 if(await releaseInputDigest(workspace)!==sourceInputs)throw new Error('Source inputs changed during candidate copy; prepare again');
 await mkdir(path.join(directory,'rollback'),{mode:0o700});
 const write=(file,value)=>writeFile(file,JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
 await write(path.join(directory,'rollback/home-content.json'),home);
 await write(path.join(directory,'rollback/editorial-content.json'),catalog);
 await writeFile(path.join(workspace,'src/data/home-content.json'),JSON.stringify(next.home,null,2)+'\n');
 await writeFile(path.join(workspace,'src/data/editorial-content.json'),JSON.stringify(next.catalog,null,2)+'\n');
 // Fixed preview destination. Enquiries are deliberately unconfigured in this review artifact.
 const environment={...previewEnvironment(),ASHBI_DRAFT_PREVIEW:'0',SITE_URL:'https://preview.ashbi.ca'};
 const cli=path.join(root,'node_modules/astro/bin/astro.mjs');
 await runBoundedNode({args:[cli,'build'],directory:workspace,environment});
 await runBoundedNode({args:[path.join(root,'ops/check-built-links.mjs'),'dist'],directory:workspace,environment});
 const checked=await checkBuiltContent(path.join(workspace,'dist'),next.home,next.catalog);
 if(await releaseInputDigest(root)!==sourceInputs)throw new Error('Source inputs changed while building; candidate is not ready');
 const manifest={version:1,type:'ashbi-content-release-candidate',status:'prepared-local',createdAt:new Date().toISOString(),source:{inputs:sourceInputs,home:hash(home),catalog:hash(catalog)},result:{inputs:await releaseInputDigest(workspace),home:hash(next.home),catalog:hash(next.catalog)},changes:next.changes,checks:{content:checked,localLinks:true},build:{site:'https://preview.ashbi.ca',enquiryMode:'mailgun',enquiryEndpoint:'',hubBase:''},remaining:['Rendered review of every changed page','Review source diff and commit through normal repository release','Explicit push/merge/preview release authorization','Final CI environment and deployed release marker/journey verification']};
 await write(path.join(directory,'release-candidate.json'),manifest);
 await writeFile(path.join(directory,'REVIEW.md'),`# Prepared Ashbi content candidate\n\nState: local only. No source files, Git state or hosted site changed.\n\nChanged documents: ${next.changes.map(change=>change.documentId).join(', ')}.\n\nReview release-candidate.json for exact before/after fields and approval revisions. The workspace contains a full static layout with enquiries unconfigured. It is not the production configuration.\n\nUse rollback/ only against matching result hashes after source application; do not blindly replace newer content. Apply the original approved exports to a reconciled checkout using ops/apply-content.mjs, review the diff and use the existing CI release path. No publish or deployment is performed by this command.\n`,{flag:'wx',mode:0o600});
 return manifest;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);if(args.length<2)throw new Error('Usage: node --experimental-strip-types ops/prepare-content-release.mjs /new/private/candidate-directory approved.json [approved-2.json ...]');
 const snapshots=await Promise.all(args.slice(1).map(async file=>JSON.parse(await readFile(file,'utf8'))));
 const result=await prepareContentRelease({root:fileURLToPath(new URL('..',import.meta.url)),snapshots,directory:path.resolve(args[0])});
 process.stdout.write(`Prepared ${result.changes.length} documents; verified ${result.checks.content.fields} fields. Local candidate only.\n`);
}
