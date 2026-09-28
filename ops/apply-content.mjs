import {createHash} from 'node:crypto';
import {readFile,writeFile,rename,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {validateHomeContent,validateContent} from '../src/lib/content.ts';

export function reviewedContent(snapshot,current){
 const base=validateHomeContent(current);
 const revision=createHash('sha256').update(JSON.stringify(base)).digest('hex');
 if(snapshot?.version!==1||snapshot.type!=='ashbi-home'||snapshot.baseRevision!==revision||!snapshot.revision||!snapshot.approvedAt||Number.isNaN(Date.parse(snapshot.approvedAt)))throw new Error('Export is unapproved, incompatible, or based on stale website content');
 return validateHomeContent(snapshot.content);
}

export function reviewedDocument(snapshot,catalog){
 if(snapshot?.version!==1||snapshot.type!=='ashbi-document'||!Object.hasOwn(catalog,snapshot.documentId))throw new Error('Unknown document export');
 const entry=catalog[snapshot.documentId];
 if(entry.kind!==snapshot.kind)throw new Error('Document type mismatch');
 const base=validateContent(entry.kind,entry.content);
 const revision=createHash('sha256').update(JSON.stringify(base)).digest('hex');
 if(snapshot.baseRevision!==revision||!snapshot.revision||!snapshot.approvedAt||Number.isNaN(Date.parse(snapshot.approvedAt)))throw new Error('Unapproved or stale document export');
 return {...catalog,[snapshot.documentId]:{...entry,content:validateContent(entry.kind,snapshot.content)}};
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);
 if(!args[0]||args.some((arg,index)=>index>0&&arg!=='--apply'))throw new Error('Usage: node --experimental-strip-types ops/apply-content.mjs approved.json [--apply]');
 const snapshot=JSON.parse(await readFile(args[0],'utf8'));
 const isHome=snapshot.type==='ashbi-home';
 const target=new URL(isHome?'../src/data/home-content.json':'../src/data/editorial-content.json',import.meta.url);
 const current=JSON.parse(await readFile(target,'utf8'));
 const next=isHome?reviewedContent(snapshot,current):reviewedDocument(snapshot,current);
 if(args.includes('--apply')){
  // Retain a named source backup before replacing the reviewable content file.
  const backup=new URL(`../data/content-backups/${isHome?'home':'editorial'}-${Date.now()}.json`,import.meta.url);
  const {mkdir}=await import('node:fs/promises');
  await mkdir(new URL('.',backup),{recursive:true,mode:0o700});
  await copyFile(target,backup);
  const temp=new URL(`${target.href}.tmp`);
  await writeFile(temp,JSON.stringify(next,null,2)+'\n',{flag:'wx'});
  await rename(temp,target);
  process.stdout.write('Approved content applied locally. Review the diff, build and rendered page before release.\n');
 }else process.stdout.write('Approved export matches the current source. Dry run only; use --apply to update locally.\n');
}
