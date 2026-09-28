import {spawn} from 'node:child_process';
/** Draft builders receive no gateway credentials or caller-controlled build options. */
export function previewEnvironment(source=process.env){
 const env={};
 for(const key of ['PATH','SystemRoot','TMPDIR','TMP','TEMP','LANG','LC_ALL'])if(source[key])env[key]=source[key];
 return {...env,ASTRO_TELEMETRY_DISABLED:'1',ASHBI_DRAFT_PREVIEW:'1',PUBLIC_ENQUIRY_ENDPOINT:'',PUBLIC_ENQUIRY_MODE:'mailgun',PUBLIC_HUB_INQUIRY_BASE:'',SITE_URL:'http://127.0.0.1:4357'};
}
/** Reap timed-out builders before reporting completion; logs remain private and bounded. */
export function runPreviewBuild({cli,directory,timeoutMs=90000,killGraceMs=1000,environment=process.env}){
 return runBoundedNode({args:[cli,'build'],directory,timeoutMs,killGraceMs,environment:previewEnvironment(environment)});
}
/** Trusted local tools only: args and environment never come from public requests. */
export function runBoundedNode({args,directory,timeoutMs=90000,killGraceMs=1000,environment}){
 return new Promise((resolve,reject)=>{
  let log='',timedOut=false,settled=false;
  const child=spawn(process.execPath,args,{cwd:directory,env:environment,stdio:['ignore','pipe','pipe']});
  const append=chunk=>{log=(log+chunk).slice(-20000);};
  child.stdout.on('data',append);child.stderr.on('data',append);
  let killTimer;
  const timer=setTimeout(()=>{timedOut=true;child.kill('SIGTERM');killTimer=setTimeout(()=>child.kill('SIGKILL'),killGraceMs);},timeoutMs);
  const finish=(error)=>{if(settled)return;settled=true;clearTimeout(timer);clearTimeout(killTimer);error?reject(error):resolve(null);};
  child.once('error',error=>finish(error));
  child.once('close',code=>finish(timedOut?new Error('Preview build exceeded its time limit'):code===0?null:new Error(`Preview build failed (${code}): ${log}`)));
 });
}
