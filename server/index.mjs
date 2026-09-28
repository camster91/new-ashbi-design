import http from 'node:http';
import {isIP} from 'node:net';
import path from 'node:path';
import {readFile,realpath} from 'node:fs/promises';
import {createEditorialStores} from './content-store.mjs';
import {createLeadStore,persistThenDeliver} from './lead-store.mjs';
import {createEnquiryHandler} from './enquiry-handler.mjs';
import {createAdminHandler} from './admin.mjs';
import {createStateStore,encryptionKey} from './state.mjs';
import {projectBriefMessage,sendMailgunMessage} from './mailgun.mjs';

const port=Number(process.env.PORT||3000);
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid PORT');
const origin=process.env.ENQUIRY_ORIGIN;
if(!origin)throw new Error('ENQUIRY_ORIGIN is required');
if(new URL(origin).origin!==origin||!/^https?:\/\//.test(origin))throw new Error('ENQUIRY_ORIGIN must be an HTTP(S) origin');
if(origin.startsWith('http:')&&!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))throw new Error('Admin origin must use HTTPS');
const key=encryptionKey(process.env.CONFIG_ENCRYPTION_KEY);
const setupToken=process.env.ADMIN_SETUP_TOKEN||'';
const trustedProxyAddress=process.env.TRUSTED_PROXY_ADDRESS||'';
if(trustedProxyAddress&&!isIP(trustedProxyAddress))throw new Error('TRUSTED_PROXY_ADDRESS must be the reverse proxy IP');
if(origin.startsWith('https://')&&!trustedProxyAddress)throw new Error('TRUSTED_PROXY_ADDRESS is required for HTTPS deployment');
if(setupToken&&setupToken.length<32)throw new Error('ADMIN_SETUP_TOKEN must contain at least 32 characters');
const dataDir=process.env.DATA_DIR||path.join(process.cwd(),'data');
const store=createStateStore({file:path.join(dataDir,'admin-state.json'),key});
await store.init();
const leads=createLeadStore({directory:path.join(dataDir,'leads'),key});
await leads.init();
const documents=await createEditorialStores({directory:path.join(dataDir,'content'),home:JSON.parse(await readFile(new URL('../src/data/home-content.json',import.meta.url),'utf8')),catalog:JSON.parse(await readFile(new URL('../src/data/editorial-content.json',import.meta.url),'utf8'))});

// Optional trusted-source runtime. The default gateway image remains an editor only.
let previews=null,previewWorkspace=null,previewSweep=null;
if(process.env.CONTENT_PREVIEW_SOURCE_ROOT){
  const root=await realpath(process.env.CONTENT_PREVIEW_SOURCE_ROOT);
  const {buildContentPreview}=await import('../ops/preview-content.mjs');
  const {createPreviewQueue}=await import('./content-preview-queue.mjs');
  const {createPreviewWorkspace}=await import('./content-preview-workspace.mjs');
  previewWorkspace=await createPreviewWorkspace({parent:path.join(dataDir,'layout-previews')});
  try{previews=createPreviewQueue({directory:previewWorkspace.directory,build:options=>buildContentPreview({root,...options})});await previews.init();}catch(error){await previewWorkspace.release();throw error;}
  previewSweep=setInterval(()=>void previewWorkspace.sweep().catch(()=>console.error('Preview cleanup requires operator review.')),5*60*1000);previewSweep.unref();
}
const admin=createAdminHandler({
  store,origin,setupToken,trustedProxyAddress,leads,documents,previews,
  sendTest:(config,to)=>sendMailgunMessage(config,{to,subject:'Ashbi project brief delivery test',text:'This is a test of Ashbi project brief delivery. If you received it, return to the admin page and enable submissions.'}),
});
const enquiry=createEnquiryHandler({
  origin,
  trustedProxyAddress,
  deliver:async (brief,submissionId)=>{
    const state=store.get();
    if(!state.enabled||!state.mailgun)throw new Error('Delivery unavailable');
    await persistThenDeliver(leads,entry=>sendMailgunMessage(state.mailgun,projectBriefMessage(entry)))(brief,submissionId);
  },
});

const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url||'/',origin).pathname;
  if(pathname==='/admin'||pathname.startsWith('/admin/')){
    void admin(req,res).then(handled=>{if(!handled&&!res.headersSent){res.writeHead(404);res.end();}});
    return;
  }
  void enquiry(req,res);
});
server.headersTimeout=10000;
server.requestTimeout=15000;
server.timeout=20000;
server.maxRequestsPerSocket=100;
server.once('error',()=>{console.error('Gateway startup failed; check the configured port and runtime.');void stopPreviewWorker().finally(()=>process.exit(1));});
server.listen(port,'0.0.0.0');

async function stopPreviewWorker(){
 if(previewSweep)clearInterval(previewSweep);
 previews?.close();await previews?.idle();
 await previewWorkspace?.release();
}
for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>{server.close();void stopPreviewWorker().finally(()=>process.exit(0));});
