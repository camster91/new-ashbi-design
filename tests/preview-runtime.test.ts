import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {mkdtemp,readdir,readFile,rm} from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
async function freePort(){
 const server=http.createServer();await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 const address=server.address();assert.ok(address&&typeof address==='object');
 await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));return address.port;
}
function worker(port:number,directory:string,key:string){
 const child=spawn(process.execPath,['--experimental-strip-types','server/index.mjs'],{cwd:root,env:{PATH:process.env.PATH,PORT:String(port),ENQUIRY_ORIGIN:`http://127.0.0.1:${port}`,CONFIG_ENCRYPTION_KEY:key,DATA_DIR:directory,CONTENT_PREVIEW_SOURCE_ROOT:root},stdio:['ignore','ignore','pipe']});
 let diagnostic='';child.stderr.on('data',chunk=>{diagnostic=(diagnostic+chunk.toString()).slice(-4000);});
 const exited=new Promise<number|null>(resolve=>child.once('exit',resolve));
 return {child,exited,diagnostic:()=>diagnostic};
}
test('optional runtime locks a single worker and releases only its private workspace on shutdown',{timeout:15000},async()=>{
 const directory=await mkdtemp('/private/tmp/ashbi-runtime-test-');const key=randomBytes(32).toString('base64');
 const port=await freePort();const first=worker(port,directory,key);let second:ReturnType<typeof worker>|undefined;
 const occupiedDirectory=await mkdtemp('/private/tmp/ashbi-runtime-busy-test-');let busy:ReturnType<typeof worker>|undefined;
 try{
  let ready=false;
  for(let attempt=0;attempt<60;attempt++){
   if(first.child.exitCode!==null)throw new Error('Preview runtime exited before readiness');
   try{const response=await fetch(`http://127.0.0.1:${port}/health`,{signal:AbortSignal.timeout(300)});ready=response.status===200;}catch{}
   if(ready)break;await new Promise(resolve=>setTimeout(resolve,50));
  }
  assert.equal(ready,true);
  const parent=path.join(directory,'layout-previews');
  assert.equal(JSON.parse(await readFile(path.join(parent,'worker.lock'),'utf8')).type,'ashbi-preview-worker');
  assert.equal((await readdir(parent)).filter(name=>name.startsWith('session-')).length,1);
  second=worker(await freePort(),directory,key);assert.equal(await second.exited,1);
  assert.match(second.diagnostic(),/Preview worker is locked/);
  busy=worker(port,occupiedDirectory,key);assert.equal(await busy.exited,1);
  assert.match(busy.diagnostic(),/Gateway startup failed/);
  assert.deepEqual(await readdir(path.join(occupiedDirectory,'layout-previews')),[]);
  first.child.kill('SIGTERM');assert.equal(await first.exited,0);
  assert.deepEqual(await readdir(parent),[]);
  assert.ok((await readdir(directory)).includes('content'));
 }finally{
  if(first.child.exitCode===null)first.child.kill('SIGKILL');
  if(second&&second.child.exitCode===null)second.child.kill('SIGKILL');
  if(busy&&busy.child.exitCode===null)busy.child.kill('SIGKILL');
  await first.exited;if(second)await second.exited;if(busy)await busy.exited;
  await rm(directory,{recursive:true,force:true});await rm(occupiedDirectory,{recursive:true,force:true});
 }
});
