import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {previewEnvironment,runPreviewBuild} from '../ops/preview-runner.mjs';
test('preview environment removes gateway secrets, telemetry and arbitrary node/build options',()=>{
 const env=previewEnvironment({PATH:'/bin',CONFIG_ENCRYPTION_KEY:'private',ADMIN_SETUP_TOKEN:'private',GH_TOKEN:'private',PUBLIC_ENQUIRY_ENDPOINT:'/api/enquiries',PUBLIC_ENQUIRY_MODE:'hub',PUBLIC_HUB_INQUIRY_BASE:'https://private.invalid/api/client-acquisition',NODE_OPTIONS:'--inspect',NODE_ENV:'production',PUBLIC_TRACKING_ID:'private'});
 assert.deepEqual(env,{PATH:'/bin',ASHBI_DRAFT_PREVIEW:'1',PUBLIC_ENQUIRY_ENDPOINT:'',PUBLIC_ENQUIRY_MODE:'mailgun',PUBLIC_HUB_INQUIRY_BASE:'',SITE_URL:'http://127.0.0.1:4357'});
});
test('preview runner builds in isolation and kills overdue children before returning',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'ashbi-preview-runner-'));
 try{
  const cli=path.join(dir,'fixture.mjs');await writeFile(cli,"import fs from 'node:fs';fs.writeFileSync('env.json',JSON.stringify(process.env));");
  await runPreviewBuild({cli,directory:dir,environment:{CONFIG_ENCRYPTION_KEY:'private',NODE_OPTIONS:'--bad-option'}});
  const env=JSON.parse(await readFile(path.join(dir,'env.json'),'utf8'));assert.equal(env.CONFIG_ENCRYPTION_KEY,undefined);assert.equal(env.NODE_OPTIONS,undefined);assert.equal(env.PUBLIC_ENQUIRY_MODE,'mailgun');
  await writeFile(cli,"process.on('SIGTERM',()=>{});setInterval(()=>{},10);");
  await assert.rejects(runPreviewBuild({cli,directory:dir,timeoutMs:100,killGraceMs:20}),/time limit/);
  await writeFile(cli,"process.stderr.write('x'.repeat(30000));process.exit(2);");
  await assert.rejects(runPreviewBuild({cli,directory:dir}),error=>error instanceof Error&&error.message.length<20100&&error.message.includes('failed (2)'));
 }finally{await rm(dir,{recursive:true,force:true});}
});
