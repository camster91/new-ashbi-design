import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,readdir,rm,stat,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {recoverAdmin,parseRecoveryArgs} from '../ops/recover-admin.mjs';
import {verifyPassword} from '../server/state.mjs';

const fixture={password:'old-salt.old-hash',mailgun:'ciphertext-preserved-verbatim',enabled:true,lastTestAt:'2026-10-01',configRevision:'unchanged',future:{nested:[1,2,'unknown field']}};
async function isolated(run:(file:string,directory:string,raw:Buffer)=>Promise<void>){
 const directory=await mkdtemp(path.join(tmpdir(),'ashbi-recovery-'));const file=path.join(directory,'state.json');
 const raw=Buffer.from(JSON.stringify(fixture,null,2)+'\n');await writeFile(file,raw,{mode:0o600});
 try{await run(file,directory,raw);}finally{await rm(directory,{recursive:true,force:true});}
}
test('recovery plan is read-only and prints no secrets',async()=>isolated(async(file,directory,raw)=>{
 const plan=await recoverAdmin({file});assert.equal(plan.changed,false);assert.equal(plan.stateSha.length,64);
 assert.deepEqual(await readFile(file),raw);assert.deepEqual(await readdir(directory),['state.json']);
 const output=JSON.stringify(plan);assert.equal(output.includes(fixture.password),false);assert.equal(output.includes(fixture.mailgun),false);
 const cli=spawnSync(process.execPath,['ops/recover-admin.mjs','--state',file],{encoding:'utf8'});
 assert.equal(cli.status,0);assert.equal(JSON.parse(cli.stdout).changed,false);assert.equal(cli.stdout.includes(fixture.password),false);
}));
test('CAS mismatch and UID mismatch fail without any writes',async()=>isolated(async(file,directory,raw)=>{
 const plan=await recoverAdmin({file});await assert.rejects(recoverAdmin({file,apply:true,expectedSha:'0'.repeat(64),credentialFile:path.join(directory,'credential')}),/changed since/);
 await assert.rejects(recoverAdmin({file,expectedUid:plan.uid+1}),/expected UID/);
 assert.deepEqual(await readFile(file),raw);assert.deepEqual(await readdir(directory),['state.json']);
}));
test('credentials cannot overwrite state or existing files',async()=>isolated(async(file,directory,raw)=>{
 const plan=await recoverAdmin({file});
 await assert.rejects(recoverAdmin({file,apply:true,expectedSha:plan.stateSha,credentialFile:file}),/Separate/);
 const credentials=path.join(directory,'existing');await writeFile(credentials,'Keep existing');
 await assert.rejects(recoverAdmin({file,apply:true,expectedSha:plan.stateSha,credentialFile:credentials}),/already exist/);
 assert.equal(await readFile(credentials,'utf8'),'Keep existing');assert.deepEqual(await readFile(file),raw);
}));
test('parser requires explicit apply and rejects malformed or duplicate options',()=>{
 assert.deepEqual(parseRecoveryArgs(['--state','/private/state']),{apply:false,file:'/private/state'});
 assert.throws(()=>parseRecoveryArgs(['--state']));assert.throws(()=>parseRecoveryArgs(['--unknown','value']));
 assert.throws(()=>parseRecoveryArgs(['--state','a','--state','b']));assert.throws(()=>parseRecoveryArgs(['--apply']));
});
test('malformed or unconfigured state is not replaced',async()=>isolated(async(file,directory)=>{
 await writeFile(file,'{}');await assert.rejects(recoverAdmin({file}),/Configured/);
 await writeFile(file,'{bad');await assert.rejects(recoverAdmin({file}));assert.deepEqual(await readdir(directory),['state.json']);
}));
test('Windows apply refuses unenforceable POSIX permissions before writing',{skip:process.platform!=='win32'},async()=>isolated(async(file,directory,raw)=>{
 const plan=await recoverAdmin({file});await assert.rejects(recoverAdmin({file,apply:true,expectedSha:plan.stateSha,credentialFile:path.join(directory,'credential')}),/POSIX/);
 assert.deepEqual(await readFile(file),raw);assert.deepEqual(await readdir(directory),['state.json']);
}));
test('POSIX apply backs up exact bytes, preserves unknown fields, owner and ciphertext, and emits no password',{skip:process.platform==='win32'},async()=>isolated(async(file,directory,raw)=>{
 const info=await stat(file),plan=await recoverAdmin({file});const credentialFile=path.join(directory,'credentials');
 const result=await recoverAdmin({file,apply:true,expectedSha:plan.stateSha,credentialFile,expectedUid:info.uid});
 assert.ok('passwordReplaced' in result);assert.ok('backup' in result);
 assert.equal(result.passwordReplaced,true);assert.deepEqual(await readFile(result.backup),raw);
 const saved=JSON.parse(await readFile(file,'utf8'));const password=(await readFile(credentialFile,'utf8')).match(/Password: (.+)/)![1];
 assert.equal(password.length,40);assert.equal(await verifyPassword(password,saved.password),true);assert.equal(JSON.stringify(result).includes(password),false);
 const {password:oldHash,...before}=fixture;const {password:newHash,...after}=saved;assert.notEqual(newHash,oldHash);assert.deepEqual(after,before);
 for(const item of [file,result.backup,credentialFile])assert.equal((await stat(item)).mode&0o777,0o600);
 assert.equal((await stat(file)).uid,info.uid);assert.equal((await stat(file)).gid,info.gid);
 assert.equal((await readdir(directory)).some(name=>name.endsWith('.tmp')||name.endsWith('.lock')),false);
}));
test('POSIX recovery refuses state, credential and ancestor symlinks',{skip:process.platform==='win32'},async()=>isolated(async(file,directory)=>{
 const stateLink=path.join(directory,'state-link');await symlink(file,stateLink);await assert.rejects(recoverAdmin({file:stateLink}),/Symbolic/);
 const plan=await recoverAdmin({file}),credentialLink=path.join(directory,'credential-link');await symlink(file,credentialLink);
 await assert.rejects(recoverAdmin({file,apply:true,expectedSha:plan.stateSha,credentialFile:credentialLink}),/Symbolic/);
 const parentLink=path.join(directory,'parent-link');await symlink(directory,parentLink);
 await assert.rejects(recoverAdmin({file:path.join(parentLink,'state.json')}),/Symbolic/);
}));
