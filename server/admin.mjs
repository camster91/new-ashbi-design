import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';
import {hashPassword,verifyPassword} from './state.mjs';
import {validateMailgunSettings} from './mailgun.mjs';
import {clientIdentity,chargeBucket} from './client-identity.mjs';

const ADMIN_EMAIL='cameron@ashbi.ca';
const SESSION_MS=8*60*60*1000;
const ATTEMPT_MS=15*60*1000;
const notices={
  saved:'Mailgun settings saved. Send a test email before enabling visitor briefs.',
  tested:'Mailgun accepted the test email. Check cameron@ashbi.ca for actual receipt.',
  enabled:'Project brief delivery is enabled.',
  disabled:'Project brief delivery is disabled.',
  password:'Password changed. Please sign in again.',
  failed:'That action could not be completed. Check the settings and try again.',
};
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const tokenHash=value=>createHash('sha256').update(value).digest('hex');
function equalSecret(a,b){
  const left=Buffer.from(String(a||'')),right=Buffer.from(String(b||''));
  return left.length===right.length&&left.length>0&&timingSafeEqual(left,right);
}

const css=`:root{font-family:Inter,ui-sans-serif,system-ui,sans-serif;color:#272b4a;background:#f9faf5}*{box-sizing:border-box}body{margin:0}header{padding:22px max(24px,5vw);display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #dde2dc;background:#fff}header strong{font-size:27px;font-style:italic;letter-spacing:-2px}header span{font-size:12px;text-transform:uppercase;letter-spacing:.14em}main{max-width:1050px;margin:clamp(36px,6vw,84px) auto;padding:0 24px 80px}h1{font-size:clamp(38px,6vw,70px);line-height:1.04;letter-spacing:-.055em;margin:12px 0 20px}h2{font-size:24px;letter-spacing:-.035em;margin:0 0 14px}p{line-height:1.6;color:#5b6173}.eyebrow{font-size:12px;letter-spacing:.16em;font-weight:700;text-transform:uppercase}.intro{max-width:670px;margin-bottom:35px}.grid{display:grid;grid-template-columns:1.3fr 1fr;gap:22px;align-items:start}.grid .settings{grid-column:1;grid-row:1}.grid .actions{grid-column:2;grid-row:1 / span 2}.grid .account{grid-column:1;grid-row:2}.card{border:1px solid #d9dedb;border-radius:24px;padding:clamp(22px,3vw,34px);background:#fff;box-shadow:0 18px 50px #272b4a0b}.card.lime{background:#f3facd}.stack{display:grid;gap:16px}label{display:grid;gap:7px;font-size:14px;font-weight:650}input,select{font:inherit;color:#272b4a;border:1px solid #c8ceca;border-radius:12px;padding:12px 14px;width:100%;background:#fff}input:focus,select:focus,button:focus-visible{outline:3px solid #a9c6ff;outline-offset:2px}button{font:inherit;font-weight:750;cursor:pointer;border:0;border-radius:999px;background:#272b4a;color:#fff;padding:13px 19px}button.secondary{background:transparent;color:#272b4a;border:1px solid #272b4a}button.danger{background:#a13c49}.row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.notice{padding:13px 17px;border-radius:12px;background:#eaf6dd;color:#263f27;margin:20px 0}.error{background:#fce9eb;color:#6d222a}.muted{font-size:13px;color:#687083}.status{font-size:14px;font-weight:700;padding:6px 12px;border-radius:999px;background:#e9eceb}.status.on{background:#e2f1c3;color:#304b1a}hr{border:0;border-top:1px solid #e5e8e4;margin:26px 0}.check{display:flex;align-items:flex-start;gap:10px;font-weight:500}.check input{width:auto;margin-top:4px}a{color:inherit}.field-note{font-size:12px;color:#687083;font-weight:400}@media(max-width:760px){.grid{grid-template-columns:1fr}.grid .settings,.grid .actions,.grid .account{grid-column:1;grid-row:auto}header span{display:none}}`;

function page(content,{notice='',error=''}={}){
  const message=error?`<p class="notice error" role="alert">${esc(error)}</p>`:notice?`<p class="notice" role="status">${esc(notices[notice]||'')}</p>`:'';
  return `<!doctype html><html lang="en-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ashbi Admin</title><style>${css}</style></head><body><header><strong>ashbi.</strong><span>Private studio settings</span></header><main>${message}${content}</main></body></html>`;
}
function sendHtml(res,status,html){
  res.writeHead(status,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"});
  res.end(html);
}
function redirect(res,path){res.writeHead(303,{Location:path,'Cache-Control':'no-store'});res.end();}
function cookie(req,name){return (req.headers.cookie||'').split(';').map(item=>item.trim()).find(item=>item.startsWith(`${name}=`))?.slice(name.length+1)||'';}
async function formBody(req){
  if(!/^application\/x-www-form-urlencoded(?:\s*;|$)/i.test(req.headers['content-type']||''))throw new Error('Invalid form encoding');
  let size=0,body='';
  for await(const chunk of req){size+=chunk.length;if(size>12000)throw new Error('Form too large');body+=chunk;}
  const values=new URLSearchParams(body);
  return name=>{const entries=values.getAll(name);return entries.length===1?entries[0]:'';};
}
function setupPage(enabled,error=''){
  return page(`<div class="intro"><span class="eyebrow">PRIVATE SETUP</span><h1>Set up your studio login.</h1><p>This one-time step creates the account for ${ADMIN_EMAIL}. Enter the setup token from the private server configuration and choose a password of at least 16 characters.</p></div>${enabled?`<div class="card" style="max-width:560px"><form class="stack" method="post" action="/admin/setup"><label>Setup token<input type="password" name="token" required autocomplete="off"></label><label>Password<input type="password" name="password" required minlength="16" maxlength="128" autocomplete="new-password"></label><button type="submit">Create admin account →</button></form></div>`:'<div class="card">Admin setup is waiting for a private setup token in the server configuration.</div>'}`,{error});
}
function loginPage(error=''){
  return page(`<div class="intro"><span class="eyebrow">ASHBI ADMIN</span><h1>Welcome back, Cameron.</h1><p>Sign in to manage project brief delivery.</p></div><div class="card" style="max-width:560px"><form class="stack" method="post" action="/admin/login"><label>Email<input name="email" type="email" required autocomplete="username" value="${ADMIN_EMAIL}"></label><label>Password<input name="password" type="password" required autocomplete="current-password"></label><button type="submit">Sign in →</button></form></div>`,{error});
}
function dashboard(state,csrf,notice){
  const config=state.mailgun;
  const status=state.enabled?'<span class="status on">Brief delivery on</span>':'<span class="status">Brief delivery off</span>';
  const hidden=`<input type="hidden" name="csrf" value="${esc(csrf)}">`;
  const settings=`<section class="card settings"><span class="eyebrow">01 / MAILGUN</span><h2>Sending settings</h2><p>Use a Mailgun domain sending key. The key is encrypted on the server and never shown again here. Saving changes turns brief delivery off until retested.</p><form method="post" action="/admin/settings" class="stack">${hidden}<input type="hidden" name="revision" value="${esc(state.configRevision||'')}"><label>Mailgun region<select name="region"><option value="US" ${config?.region==='US'?'selected':''}>United States</option><option value="EU" ${config?.region==='EU'?'selected':''}>European Union</option></select></label><label>Sending domain<input name="domain" required placeholder="mg.ashbi.ca" value="${esc(config?.domain||'')}"><span class="field-note">The domain configured in Mailgun, not the inbox domain unless they are the same.</span></label><label>From address<input name="from" type="email" required placeholder="hello@mg.ashbi.ca" value="${esc(config?.from||'')}"></label><label>Mailgun domain sending key<input name="apiKey" type="password" autocomplete="new-password" placeholder="${config?'Leave blank to keep saved key':'Paste key'}" ${config?'':'required'}><span class="field-note">${config?'A key is saved. Leave this blank unless replacing it.':'No key saved yet.'}</span></label><button type="submit">Save settings →</button></form></section>`;
  const actions=`<section class="card lime actions"><span class="eyebrow">02 / DELIVERY</span><h2>Ready when you are.</h2><div class="row">${status}</div><p>Project briefs go to <strong>hello@ashbi.ca</strong>. Your login and test mailbox is <strong>${ADMIN_EMAIL}</strong>.</p>${config?`<p class="muted">Last Mailgun test accepted: ${state.lastTestAt?esc(new Date(state.lastTestAt).toLocaleString('en-CA',{timeZone:'America/Toronto'})):'Not tested'}</p><hr><form method="post" action="/admin/test" class="stack">${hidden}<label class="check"><input type="checkbox" name="confirm" value="yes" required>Send a real test email to ${ADMIN_EMAIL}. Mailgun may charge for it.</label><button class="secondary" type="submit">Send test email ↗</button></form><hr>${state.enabled?`<form method="post" action="/admin/disable">${hidden}<button class="danger" type="submit">Disable brief delivery</button></form>`:state.lastTestAt?`<form method="post" action="/admin/enable" class="stack">${hidden}<label class="check"><input type="checkbox" name="received" value="yes" required>I checked ${ADMIN_EMAIL} and received the test email.</label><button type="submit">Enable brief delivery →</button></form>`:'<p>Send a test email and check receipt before enabling visitor briefs.</p>'}`:'<p>Save your Mailgun settings to continue.</p>'}</section>`;
  const account=`<section class="card account"><span class="eyebrow">03 / ACCOUNT</span><h2>Login security</h2><p>Only ${ADMIN_EMAIL} can sign in. Sessions expire after eight hours.</p><form method="post" action="/admin/password" class="stack">${hidden}<label>Current password<input type="password" name="current" autocomplete="current-password" required></label><label>New password<input type="password" name="password" autocomplete="new-password" minlength="16" maxlength="128" required></label><button class="secondary" type="submit">Change password</button></form><hr><form method="post" action="/admin/logout">${hidden}<button class="secondary" type="submit">Sign out</button></form></section>`;
  return page(`<div class="intro"><span class="eyebrow">STUDIO OPERATIONS</span><h1>Project brief delivery.</h1><p>Set up Mailgun, confirm a test reaches your inbox, then turn on direct submissions. The public form stays off until the website is built with its endpoint.</p></div><div class="grid">${settings}${actions}${account}</div>`,{notice});
}

export function createAdminHandler({store,origin,setupToken='',sendTest,now=Date.now,trustedProxyAddress=''}){
  const sessions=new Map(),attempts=new Map();
  const secure=origin.startsWith('https://');
  const cookieName=secure?'__Host-ashbi_admin':'ashbi_admin_local';
  function sessionFor(req){
    const raw=cookie(req,cookieName);
    const item=sessions.get(tokenHash(raw));
    if(!item||item.expires<now())return null;
    return {raw,...item};
  }
  function newSession(res){
    const raw=randomBytes(32).toString('base64url');
    const item={csrf:randomBytes(32).toString('base64url'),expires:now()+SESSION_MS};
    sessions.set(tokenHash(raw),item);
    res.setHeader('Set-Cookie',`${cookieName}=${raw}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800${secure?'; Secure':''}`);
  }
  function attemptKey(req){return clientIdentity(req,trustedProxyAddress);}
  function limited(req){
    const record=attempts.get(attemptKey(req));
    if(record&&now()-record.start>=ATTEMPT_MS){attempts.delete(attemptKey(req));return false;}
    return Boolean(record&&record.count>=8);
  }
  function failed(req){chargeBucket(attempts,attemptKey(req),{windowMs:ATTEMPT_MS,max:8,now});}
  function currentSession(session){return session&&sessions.get(tokenHash(session.raw))?.csrf===session.csrf&&session.expires>=now();}
  return async function admin(req,res){
    const pathname=new URL(req.url||'/',origin).pathname;
    if(pathname==='/admin')return redirect(res,'/admin/');
    if(!pathname.startsWith('/admin/'))return false;
    try{
      const state=store.get();
      const session=sessionFor(req);
      if(req.method==='GET'&&pathname==='/admin/'){
        const notice=new URL(req.url,origin).searchParams.get('notice')||'';
        sendHtml(res,200,!state.password?setupPage(Boolean(setupToken)):!session?loginPage():dashboard(state,session.csrf,notice));
        return true;
      }
      // Opaque-origin in-app browsers submit Origin: null. The setup token, password,
      // and authenticated per-session CSRF still protect their respective routes.
      if(req.method!=='POST'||![origin,'null'].includes(req.headers.origin)){sendHtml(res,403,page('<h1>Request denied.</h1>'));return true;}
      if(pathname==='/admin/setup'){
        if(state.password||!setupToken||limited(req)){sendHtml(res,403,setupPage(Boolean(setupToken),'Setup is unavailable.'));return true;}
        const value=await formBody(req);
        if(!equalSecret(value('token'),setupToken)){failed(req);sendHtml(res,403,setupPage(true,'The setup token was not accepted.'));return true;}
        const password=await hashPassword(value('password'));
        await store.update(next=>{if(next.password)throw new Error('Already set up');next.password=password;});
        newSession(res);redirect(res,'/admin/');return true;
      }
      if(pathname==='/admin/login'){
        if(!state.password||limited(req)){sendHtml(res,429,loginPage('Sign-in is temporarily unavailable.'));return true;}
        const value=await formBody(req);
        const valid=await verifyPassword(value('password'),state.password);
        if(value('email').toLowerCase()!==ADMIN_EMAIL||!valid){failed(req);sendHtml(res,403,loginPage('Email or password not recognised.'));return true;}
        attempts.delete(attemptKey(req));
        newSession(res);redirect(res,'/admin/');return true;
      }
      if(!session){redirect(res,'/admin/');return true;}
      const value=await formBody(req);
      if(!equalSecret(value('csrf'),session.csrf)||!currentSession(session)){sendHtml(res,403,page('<h1>Request denied.</h1>'));return true;}
      if(pathname==='/admin/logout'){
        sessions.delete(tokenHash(session.raw));
        res.setHeader('Set-Cookie',`${cookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure?'; Secure':''}`);
        redirect(res,'/admin/');return true;
      }
      if(pathname==='/admin/settings'){
        await store.update(next=>{
          if(!currentSession(session)||value('revision')!==(next.configRevision||''))throw new Error('Stale settings');
          next.mailgun=validateMailgunSettings({region:value('region'),domain:value('domain'),from:value('from'),apiKey:value('apiKey')||next.mailgun?.apiKey});
          next.configRevision=randomBytes(16).toString('hex');
          next.enabled=false;next.lastTestAt=null;
        });
        redirect(res,'/admin/?notice=saved');return true;
      }
      if(pathname==='/admin/test'){
        if(value('confirm')!=='yes'||!state.mailgun)throw new Error('Test not confirmed');
        if(!currentSession(session))throw new Error('Session expired');
        await sendTest(state.mailgun,ADMIN_EMAIL);
        await store.update(next=>{
          if(!currentSession(session)||next.configRevision!==state.configRevision)throw new Error('Settings changed');
          next.lastTestAt=new Date(now()).toISOString();next.enabled=false;
        });
        redirect(res,'/admin/?notice=tested');return true;
      }
      if(pathname==='/admin/enable'){
        if(value('received')!=='yes'||!state.mailgun||!state.lastTestAt)throw new Error('Receipt not confirmed');
        await store.update(next=>{if(!currentSession(session)||!next.mailgun||!next.lastTestAt||next.configRevision!==state.configRevision)throw new Error('Settings changed');next.enabled=true;});
        redirect(res,'/admin/?notice=enabled');return true;
      }
      if(pathname==='/admin/disable'){
        await store.update(next=>{if(!currentSession(session))throw new Error('Session expired');next.enabled=false;});
        redirect(res,'/admin/?notice=disabled');return true;
      }
      if(pathname==='/admin/password'){
        if(!await verifyPassword(value('current'),state.password))throw new Error('Invalid current password');
        const password=await hashPassword(value('password'));
        await store.update(next=>{if(!currentSession(session)||next.password!==state.password)throw new Error('Session changed');next.password=password;});
        sessions.clear();
        res.setHeader('Set-Cookie',`${cookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure?'; Secure':''}`);
        redirect(res,'/admin/?notice=password');return true;
      }
      sendHtml(res,404,page('<h1>Page not found.</h1>'));return true;
    }catch{
      sendHtml(res,400,page('<h1>Could not complete that request.</h1><p>Please return to <a href="/admin/">admin</a> and check the details.</p>'));
      return true;
    }
  };
}
