import {constants} from 'node:fs';
import {open,lstat,realpath,rename,unlink,chown} from 'node:fs/promises';
import {randomBytes,createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {hashPassword,verifyPassword} from '../server/state.mjs';

const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const withoutPassword=value=>Object.fromEntries(Object.entries(value).filter(([name])=>name!=='password'));
async function safePath(value,{existing=false}={}){
 if(typeof value!=='string'||!value)throw new Error('A file path is required');
 const absolute=path.resolve(value),root=path.parse(absolute).root;
 let cursor=root;
 for(const segment of path.relative(root,absolute).split(path.sep)){
  cursor=path.join(cursor,segment);
  try{const info=await lstat(cursor);if(info.isSymbolicLink())throw new Error('Symbolic links are not supported for recovery paths');}
  catch(error){if(error.code!=='ENOENT'||cursor!==absolute||existing)throw error;}
 }
 const parent=await realpath(path.dirname(absolute));
 return path.join(parent,path.basename(absolute));
}
async function snapshot(file){
 const handle=await open(file,constants.O_RDONLY|(constants.O_NOFOLLOW||0));
 try{
  const info=await handle.stat();if(!info.isFile())throw new Error('Admin state must be a regular file');
  const raw=await handle.readFile();
  return {raw,info,sha:digest(raw)};
 }finally{await handle.close();}
}
async function privateFile(file,bytes,owner){
 const handle=await open(file,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|(constants.O_NOFOLLOW||0),0o600);
 try{
  if(owner&&(owner.uid!==process.getuid()||owner.gid!==process.getgid()))await chown(file,owner.uid,owner.gid);
  await handle.chmod(0o600);await handle.writeFile(bytes);await handle.sync();
  const info=await handle.stat();
  if((info.mode&0o777)!==0o600||owner&&(info.uid!==owner.uid||info.gid!==owner.gid))throw new Error('Private file permissions or ownership could not be verified');
 }catch(error){await unlink(file).catch(()=>{});throw error;}finally{await handle.close();}
}

// Offline only: stop the gateway first. The hash guard is not a substitute for stopping writers.
/** @param {{file?:string,apply?:boolean,expectedSha?:string,credentialFile?:string,expectedUid?:number}} options */
export async function recoverAdmin({file,apply=false,expectedSha='',credentialFile='',expectedUid}={}){
 const target=await safePath(file,{existing:true});
 const initial=await snapshot(target),original=JSON.parse(initial.raw.toString('utf8'));
 if(!original||Array.isArray(original)||typeof original.password!=='string'||!original.password.includes('.'))throw new Error('Configured admin password not found');
 if(expectedUid!==undefined&&(!Number.isSafeInteger(expectedUid)||expectedUid<0||initial.info.uid!==expectedUid))throw new Error('State ownership does not match expected UID');
 const details={configured:true,enabled:original.enabled===true,mailgunConfigured:Boolean(original.mailgun),stateSha:initial.sha,uid:initial.info.uid,gid:initial.info.gid};
 if(!apply)return {...details,changed:false};
 if(expectedSha!==initial.sha)throw new Error('State changed since recovery plan');
 const credentials=await safePath(credentialFile);
 if(credentials===target)throw new Error('Separate private credential file required');
 try{await lstat(credentials);throw new Error('Credential file must not already exist');}catch(error){if(error.code!=='ENOENT')throw error;}
 if(process.platform==='win32')throw new Error('Apply requires POSIX file permissions; Windows chmod cannot guarantee private credentials');
 const suffix=randomBytes(8).toString('hex');
 const backup=`${target}.recovery-${suffix}.bak`,temporary=`${target}.recovery-${suffix}.tmp`,lock=`${target}.recovery.lock`;
 const owner={uid:initial.info.uid,gid:initial.info.gid};
 const password=randomBytes(30).toString('base64url');
 const next={...original,password:await hashPassword(password)};
 let locked=false,credentialWritten=false,temporaryWritten=false,replaced=false;
 try{
  await privateFile(lock,Buffer.from('Offline admin recovery in progress\n'),owner);locked=true;
  const check=await snapshot(target);
  if(check.sha!==initial.sha||check.info.ino!==initial.info.ino||check.info.dev!==initial.info.dev||check.info.uid!==initial.info.uid||check.info.gid!==initial.info.gid)throw new Error('State changed during recovery; no replacement made');
  await privateFile(backup,initial.raw,owner);
  // Mark for cleanup before creation: exclusive creation prevents overwriting any pre-existing file.
  const credentialHandle=await open(credentials,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|(constants.O_NOFOLLOW||0),0o600);
  credentialWritten=true;
  try{
   await credentialHandle.chmod(0o600);
   await credentialHandle.writeFile(`Ashbi Admin\nEmail: cameron@ashbi.ca\nPassword: ${password}\n`);await credentialHandle.sync();
   if(((await credentialHandle.stat()).mode&0o777)!==0o600)throw new Error('Credential permissions could not be verified');
  }finally{await credentialHandle.close();}
  await privateFile(temporary,Buffer.from(JSON.stringify(next)),owner);temporaryWritten=true;
  await safePath(target,{existing:true});const final=await snapshot(target);
  if(final.sha!==initial.sha||final.info.ino!==initial.info.ino||final.info.dev!==initial.info.dev||final.info.uid!==initial.info.uid||final.info.gid!==initial.info.gid)throw new Error('State changed during recovery; no replacement made');
  await rename(temporary,target);temporaryWritten=false;replaced=true;
  const saved=await snapshot(target),persisted=JSON.parse(saved.raw.toString('utf8'));
  if(!isDeepStrictEqual(withoutPassword(persisted),withoutPassword(original))||!await verifyPassword(password,persisted.password))throw new Error('Recovery verification failed; retain private backup for operator review');
  if(saved.info.uid!==owner.uid||saved.info.gid!==owner.gid||(saved.info.mode&0o777)!==0o600)throw new Error('Recovered state ownership or permissions changed');
  return {...details,changed:true,passwordReplaced:true,otherStatePreserved:true,backup,credentialFile:credentials};
 }finally{
  if(temporaryWritten)await unlink(temporary).catch(()=>{});
  if(credentialWritten&&!replaced)await unlink(credentials).catch(()=>{});
  if(locked)await unlink(lock).catch(()=>{});
 }
}

export function parseRecoveryArgs(args){
 const result={apply:false};const names={'--state':'file','--expected-sha':'expectedSha','--credential-file':'credentialFile','--expected-uid':'expectedUid'};
 const seen=new Set();
 for(let index=0;index<args.length;index++){
  const flag=args[index];if(seen.has(flag))throw new Error('Duplicate recovery option');seen.add(flag);
  if(flag==='--apply'){result.apply=true;continue;}
  if(!names[flag]||!args[index+1]||args[index+1].startsWith('--'))throw new Error('Invalid recovery options');
  const value=args[++index];result[names[flag]]=flag==='--expected-uid'?Number(value):value;
 }
 if(!result.file)throw new Error('--state is required');return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{console.log(JSON.stringify(await recoverAdmin(parseRecoveryArgs(process.argv.slice(2)))));}
 catch(error){console.error(error.message);process.exitCode=1;}
}
