import {createHash} from 'node:crypto';
import {readFile,writeFile,cp,mkdir,symlink,realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {validateContent,validateHomeContent} from '../src/lib/content.ts';
import {checkBuiltContent} from './check-built-content.mjs';

export function previewContent(snapshot,home,catalog){
 if(snapshot?.version!==1||snapshot.type!=='ashbi-draft'||!snapshot.revision)throw new Error('Use a saved draft export for preview');
 const isHome=snapshot.documentId==='home';
 const entry=isHome?{kind:'home',content:home}:Object.hasOwn(catalog,snapshot.documentId)?catalog[snapshot.documentId]:null;
 if(!entry||entry.kind!==snapshot.kind)throw new Error('Unknown draft document');
 const base=validateContent(entry.kind,entry.content,snapshot.documentId);
 if(createHash('sha256').update(JSON.stringify(base)).digest('hex')!==snapshot.baseRevision)throw new Error('Draft is based on a different source release');
 const content=validateContent(entry.kind,snapshot.content,snapshot.documentId);
 return {home:isHome?validateHomeContent(content):home,catalog:isHome?catalog:{...catalog,[snapshot.documentId]:{...entry,content}}};
}
/** Create a new private directory; never apply a draft in the working checkout. */
export async function buildContentPreview({root,snapshot,directory}){
 const home=JSON.parse(await readFile(path.join(root,'src/data/home-content.json'),'utf8'));
 const catalog=JSON.parse(await readFile(path.join(root,'src/data/editorial-content.json'),'utf8'));
 const next=previewContent(snapshot,home,catalog);
 await mkdir(directory,{mode:0o700}); // Existing directories are rejected.
 for(const item of ['src','astro.config.mjs','package.json','package-lock.json','tsconfig.json'])await cp(path.join(root,item),path.join(directory,item),{recursive:true});
 await symlink(await realpath(path.join(root,'node_modules')),path.join(directory,'node_modules'));
 await symlink(await realpath(path.join(root,'public')),path.join(directory,'public'));
 await writeFile(path.join(directory,'src/data/home-content.json'),JSON.stringify(next.home,null,2));
 await writeFile(path.join(directory,'src/data/editorial-content.json'),JSON.stringify(next.catalog,null,2));
 const astroPackage=JSON.parse(await readFile(path.join(root,'node_modules/astro/package.json'),'utf8'));
 const cli=path.resolve(root,'node_modules/astro',astroPackage.bin.astro);
 const environment={...process.env,ASHBI_DRAFT_PREVIEW:'1',PUBLIC_ENQUIRY_ENDPOINT:'',SITE_URL:'http://127.0.0.1:4357'};
 delete environment.NODE_OPTIONS;
 await new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,[cli,'build'],{cwd:directory,env:environment,stdio:['ignore','pipe','pipe']});
  let log='';child.stdout.on('data',chunk=>{log=(log+chunk).slice(-20000);});child.stderr.on('data',chunk=>{log=(log+chunk).slice(-20000);});
  child.once('error',reject);child.once('exit',code=>code===0?resolve(null):reject(new Error(`Preview build failed (${code}): ${log}`)));
 });
 const checked=await checkBuiltContent(path.join(directory,'dist'),next.home,next.catalog,{allowDraft:true});
 const route=snapshot.documentId==='home'?'/':snapshot.kind==='article'?`/${snapshot.documentId.split(':')[1]}/`:`/${snapshot.kind==='project'?'work':snapshot.kind==='service'?'services':'campaigns'}/${snapshot.documentId.split(':')[1]}/`;
 await writeFile(path.join(directory,'preview.json'),JSON.stringify({documentId:snapshot.documentId,revision:snapshot.revision,route,checked},null,2),{mode:0o600});
 return {directory,route,checked};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 if(process.argv.length!==4)throw new Error('Usage: node --experimental-strip-types ops/preview-content.mjs draft.json /new/private/preview-directory');
 const root=fileURLToPath(new URL('..',import.meta.url));
 const snapshot=JSON.parse(await readFile(process.argv[2],'utf8'));
 const result=await buildContentPreview({root,snapshot,directory:path.resolve(process.argv[3])});
 process.stdout.write(JSON.stringify(result,null,2)+'\n');
}
