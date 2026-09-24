import http from 'node:http';
import {isIP} from 'node:net';
import path from 'node:path';
import {createEnquiryHandler} from './enquiry-handler.mjs';
import {createAdminHandler} from './admin.mjs';
import {createStateStore,encryptionKey} from './state.mjs';
import {projectBriefMessage,sendMailgunMessage} from './mailgun.mjs';

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

const admin=createAdminHandler({
  store,origin,setupToken,trustedProxyAddress,
  sendTest:(config,to)=>sendMailgunMessage(config,{to,subject:'Ashbi project brief delivery test',text:'This is a test of Ashbi project brief delivery. If you received it, return to the admin page and enable submissions.'}),
});
const enquiry=createEnquiryHandler({
  origin,
  trustedProxyAddress,
  deliver:async brief=>{
    const state=store.get();
    if(!state.enabled||!state.mailgun)throw new Error('Delivery unavailable');
    await sendMailgunMessage(state.mailgun,projectBriefMessage(brief));
  },
});

const port=Number(process.env.PORT||3000);
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid PORT');
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
server.listen(port,'0.0.0.0');
