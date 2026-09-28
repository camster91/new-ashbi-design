import {randomUUID} from 'node:crypto';
import {open,mkdir,mkdtemp,readFile,writeFile,readdir,lstat,rm} from 'node:fs/promises';
import path from 'node:path';
/** Own ephemeral layout builds only; never sweep unmarked or symlinked directories. */
export async function createPreviewWorkspace({parent,now=Date.now,ttlMs=30*60*1000}){
 await mkdir(parent,{recursive:true,mode:0o700});
 const lockPath=path.join(parent,'worker.lock');let lock;
 try{lock=await open(lockPath,'wx',0o600);}catch(error){if(error.code==='EEXIST')throw new Error('Preview worker is locked. Verify the prior worker stopped before operator recovery.');throw error;}
 const token=randomUUID();
 let directory,closed=false;
 async function sweep(){
  const names=await readdir(parent);
  for(const name of names){
   if(!/^session-[a-zA-Z0-9]{6}$/.test(name)||path.join(parent,name)===directory)continue;
   const target=path.join(parent,name);
   try{
    const info=await lstat(target);if(!info.isDirectory()||info.isSymbolicLink())continue;
    const marker=JSON.parse(await readFile(path.join(target,'preview-session.json'),'utf8'));
    if(marker.type!=='ashbi-layout-preview-session'||marker.session!==name||!Number.isFinite(marker.createdAt)||now()-marker.createdAt<ttlMs)continue;
    await rm(target,{recursive:true,force:true});
   }catch(error){if(['ENOENT','ENOTDIR'].includes(error.code)||error instanceof SyntaxError)continue;throw error;}
  }
 }
 async function release(){
  if(closed)return;closed=true;
  try{if(directory)await rm(directory,{recursive:true,force:true});}
  finally{await lock.close();const current=JSON.parse(await readFile(lockPath,'utf8').catch(()=> '{}'));if(current.token===token)await rm(lockPath,{force:true});}
 }
 try{
  await lock.writeFile(JSON.stringify({type:'ashbi-preview-worker',token,pid:process.pid,createdAt:now()}));
  await sweep();directory=await mkdtemp(path.join(parent,'session-'));
  await writeFile(path.join(directory,'preview-session.json'),JSON.stringify({type:'ashbi-layout-preview-session',session:path.basename(directory),createdAt:now()}),{flag:'wx',mode:0o600});
  return {directory,sweep,release};
 }catch(error){await release();throw error;}
}
