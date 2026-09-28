import {createHash} from 'node:crypto';
import {readFile,writeFile,rename,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {validateHomeContent} from '../src/lib/content.ts';

export function reviewedContent(snapshot,current){
 const base=validateHomeContent(current);
 const revision=createHash('sha256').update(JSON.stringify(base)).digest('hex');
 if(snapshot?.version!==1||snapshot.type!=='ashbi-home'||snapshot.baseRevision!==revision||!snapshot.revision||!snapshot.approvedAt||Number.isNaN(Date.parse(snapshot.approvedAt)))throw new Error('Export is unapproved, incompatible, or based on stale website content');
 return validateHomeContent(snapshot.content);
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);
 if(!args[0]||args.some((arg,index)=>index>0&&arg!=='--apply'))throw new Error('Usage: node --experimental-strip-types ops/apply-content.mjs approved.json [--apply]');
 const target=new URL('../src/data/home-content.json',import.meta.url);
 const current=JSON.parse(await readFile(target,'utf8'));
 const next=reviewedContent(JSON.parse(await readFile(args[0],'utf8')),current);
 if(args.includes('--apply')){
  // Retain a named source backup before replacing the reviewable content file.
  const backup=new URL(`../data/content-backups/home-${Date.now()}.json`,import.meta.url);
  const {mkdir}=await import('node:fs/promises');
  await mkdir(new URL('.',backup),{recursive:true,mode:0o700});
  await copyFile(target,backup);
  const temp=new URL('../src/data/home-content.json.tmp',import.meta.url);
  await writeFile(temp,JSON.stringify(next,null,2)+'\n',{flag:'wx'});
  await rename(temp,target);
  process.stdout.write('Approved content applied locally. Review the diff, build and rendered page before release.\n');
 }else process.stdout.write('Approved export matches the current source. Dry run only; use --apply to update locally.\n');
}
