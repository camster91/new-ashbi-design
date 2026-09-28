import {type Brief,validateBrief,knownCampaign,planLabel} from './enquiry.ts';
// Mirrors ashbi-platform client-acquisition.contract.js (#426), verified 28 September 2026.
export const HUB_PRIVACY_VERSION='ashbi-inquiry-2026-09-28';
export const HUB_SERVICE_LINES=['brand_packaging','web_commerce','custom_platform','ai_automation','managed_support','unknown'] as const;
export const HUB_TIMING_OPTIONS=['urgent_30_days','one_to_three_months','three_to_six_months','exploring'] as const;
const mapping:Record<string,typeof HUB_SERVICE_LINES[number]>={branding:'brand_packaging','packaging-design-services':'brand_packaging','web-design':'web_commerce','design-and-dev-subscription':'managed_support','not-sure':'unknown'};
export type HubConfig={enabled:true;privacyVersion:string;serviceLines:string[]};
export type HubBrief=Brief&{requestedOutcome:string;consent:boolean;fax_number?:string};
export type HubResult={ok:true}|{ok:false;reason:'unavailable'|'invalid'|'network'|'rejected'|'timeout'|'privacy'};
export function validHubBase(base:string){
 if(base==='/api/client-acquisition')return true;
 try{const url=new URL(base);return url.protocol==='https:'&&!url.username&&!url.password&&!url.search&&!url.hash&&url.pathname==='/api/client-acquisition';}catch{return false;}
}
export function parseHubConfig(value:unknown):HubConfig|null{
 if(!value||typeof value!=='object')return null;
 const config=value as Record<string,unknown>;
 if(Object.keys(config).some(key=>!['enabled','privacyVersion','serviceLines'].includes(key)))return null;
 if(config.enabled!==true||config.privacyVersion!==HUB_PRIVACY_VERSION||!Array.isArray(config.serviceLines)||!config.serviceLines.length||config.serviceLines.some(line=>!HUB_SERVICE_LINES.includes(line)))return null;
 return {enabled:true,privacyVersion:HUB_PRIVACY_VERSION,serviceLines:[...config.serviceLines]};
}
export async function loadHubConfig(base:string,transport:typeof fetch=fetch):Promise<HubConfig|null>{
 if(!validHubBase(base))return null;
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000);
 try{const response=await transport(base+'/config',{credentials:'omit',referrerPolicy:'no-referrer',headers:{Accept:'application/json'},signal:controller.signal});if(!response.ok||!response.headers.get('content-type')?.includes('application/json'))return null;return parseHubConfig(await response.json());}catch{return null;}finally{clearTimeout(timer);}
}
export function hubBriefErrors(brief:HubBrief,config:HubConfig|null,requireConsent=true):Record<string,string>{
 const errors:Record<string,string>={...validateBrief(brief)};
 if(brief.description.length>4500)errors.description='Please use 4,500 characters or fewer.';
 if(!brief.requestedOutcome.trim()||brief.requestedOutcome.length>2000)errors.requestedOutcome='Tell us what you would like to achieve, using 2,000 characters or fewer.';
 if(brief.timing&&!HUB_TIMING_OPTIONS.some(value=>value===brief.timing))errors.timing='Choose one of the listed timing options.';
 if(requireConsent&&brief.consent!==true)errors.consent='Please read the privacy notice and agree to enquiry processing.';
 if(config&&!config.serviceLines.includes(mapping[brief.service]))errors.service='This service is not available for online enquiries. Please use email.';
 return errors;
}
export function hubInquiryPayload(brief:HubBrief,config:HubConfig,idempotencyKey:string,pathname:string){
 if(!parseHubConfig(config)||Object.keys(hubBriefErrors(brief,config)).length||!/^ashbi_ca:[a-f0-9-]{36}$/i.test(idempotencyKey))throw new Error('Invalid inquiry');
 const businessContext=[brief.description,brief.website&&`Website: ${brief.website}`,brief.project&&`Project reference: ${brief.project}`,brief.plan&&`Monthly option: ${planLabel(brief.plan)}`].filter(Boolean).join('\n\n');
 if(businessContext.length>5000)throw new Error('Brief context too long');
 const landingPage=/^\/(?!\/)[^?#\u0000-\u001f]{0,499}$/.test(pathname)?pathname:'/contact/';
 const payload={idempotencyKey,name:brief.name.trim(),email:brief.email.trim().toLowerCase(),company:brief.company||undefined,serviceLine:mapping[brief.service],businessContext,requestedOutcome:brief.requestedOutcome.trim(),timing:brief.timing||undefined,consent:true,privacyVersion:config.privacyVersion,attribution:{landingPage,...(knownCampaign(brief.campaign)?{campaign:brief.campaign}:{})},website:brief.fax_number||''};
 if(new TextEncoder().encode(JSON.stringify(payload)).length>16*1024)throw new Error('Inquiry exceeds transport limit');
 return payload;
}
export function createHubSender(base:string,transport:typeof fetch=fetch,timeoutMs=12000){
 let active=false,previous='',key='';
 return async(brief:HubBrief,config:HubConfig|null,pathname:string):Promise<HubResult>=>{
  if(!validHubBase(base)||!config)return {ok:false,reason:'unavailable'};
  if(active)return {ok:false,reason:'rejected'};
  let payload:ReturnType<typeof hubInquiryPayload>;
  try{
   const provisional=hubInquiryPayload(brief,config,'ashbi_ca:00000000-0000-4000-8000-000000000000',pathname);
   const fingerprint=JSON.stringify({...provisional,idempotencyKey:undefined});
   if(fingerprint!==previous){key='ashbi_ca:'+crypto.randomUUID();previous=fingerprint;}
   payload={...provisional,idempotencyKey:key};
  }catch{return {ok:false,reason:'invalid'};}
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);active=true;
  try{
   const response=await transport(base+'/intake',{method:'POST',credentials:'omit',referrerPolicy:'no-referrer',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload),signal:controller.signal});
   if(!response.headers.get('content-type')?.includes('application/json'))return {ok:false,reason:'rejected'};
   const result=await response.json();
   if(response.status===409&&result?.code==='PRIVACY_VERSION_CHANGED')return {ok:false,reason:'privacy'};
   return [200,201].includes(response.status)&&result?.accepted===true&&typeof result.replayed==='boolean'?{ok:true}:{ok:false,reason:'rejected'};
  }catch{return {ok:false,reason:controller.signal.aborted?'timeout':'network'};}finally{clearTimeout(timer);active=false;}
 };
}
