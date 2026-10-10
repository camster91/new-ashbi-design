import {commerceProjectSlugs} from '../data/commerce-project-slugs.ts';
import {validMailbox} from './mailbox.ts';
export const serviceOptions=['branding','web-design','packaging-design-services','design-and-dev-subscription','not-sure'] as const;
export const campaignOptions=['creative-partner','shopify-design','packaging-design','brand-launch','website-redesign'] as const;
export const planOptions=['20-hours','40-hours','80-hours'] as const;
export function knownCampaign(value:unknown):string{return typeof value==='string'&&campaignOptions.some(slug=>slug===value)?value:'';}
export function knownProject(value:unknown):string{return typeof value==='string'&&commerceProjectSlugs.some(slug=>slug===value)?value:'';}
export function knownPlan(value:unknown):string{return typeof value==='string'&&planOptions.some(slug=>slug===value)?value:'';}
export function planLabel(value:unknown):string{return knownPlan(value)?`${(value as string).split('-')[0]} hours per month`:'';}
export type Brief={name:string;email:string;service:string;description:string;company:string;website:string;timing:string;campaign:string;project:string;plan:string};
export type Errors=Partial<Record<keyof Brief,string>>;
const limits:Record<keyof Brief,number>={name:100,email:254,service:60,description:5000,company:150,website:300,timing:200,campaign:60,project:60,plan:20};
export function readBrief(values:Record<string,unknown>):Brief {
  return Object.fromEntries(Object.keys(limits).map(key=>[key,typeof values[key]==='string'?(values[key] as string).trim():''])) as Brief;
}
export function validateBrief(brief:Brief):Errors {
  const errors:Errors={};
  for(const field of ['name','email','service','description'] as const)if(!brief[field])errors[field]='Please complete this field.';
  for(const field of Object.keys(limits) as (keyof Brief)[])if(brief[field].length>limits[field])errors[field]=`Please use ${limits[field]} characters or fewer.`;
  if(brief.email&&!validMailbox(brief.email))errors.email='Please enter a valid email address.';
  if(brief.service&&!serviceOptions.some(s=>s===brief.service))errors.service='Please choose one of the listed services.';
  if(brief.campaign&&!knownCampaign(brief.campaign))errors.campaign='Unknown campaign.';
  if(brief.project&&!knownProject(brief.project))errors.project='Unknown project.';
  if(brief.plan&&(!knownPlan(brief.plan)||brief.service!=='design-and-dev-subscription'))errors.plan='Unknown monthly option.';
  if(brief.website){try{const url=new URL(/^https?:\/\//i.test(brief.website)?brief.website:`https://${brief.website}`);if(!['https:','http:'].includes(url.protocol)||!url.hostname.includes('.')||url.username||url.password||/\s/.test(brief.website))throw new Error();}catch{errors.website='Please enter a website such as example.com.';}}
  return errors;
}
export function validEndpoint(endpoint:string):boolean {
  if(endpoint.startsWith('/')&&!endpoint.startsWith('//')&&!/[\s\\#?]/.test(endpoint))return true;
  try{const url=new URL(endpoint);return url.protocol==='https:'&&!url.username&&!url.password&&!url.hash;}catch{return false;}
}
export type DeliveryResult={ok:true}|{ok:false;reason:'unavailable'|'invalid'|'network'|'rejected'|'timeout'};
export function createBriefSender(endpoint:string,transport:typeof fetch=fetch,timeoutMs=12000){
  let active=false,previousBody="",submissionId="";
  return async(brief:Brief & {fax_number?:string}):Promise<DeliveryResult>=>{
    if(!validEndpoint(endpoint))return {ok:false,reason:'unavailable'};
    if(Object.keys(validateBrief(brief)).length)return {ok:false,reason:'invalid'};
    if(active)return {ok:false,reason:'rejected'};
    const body=JSON.stringify(brief);
    if(body!==previousBody){submissionId=crypto.randomUUID();previousBody=body;}
    active=true;const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);
    try{
      const response=await transport(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json','Idempotency-Key':submissionId},credentials:'omit',referrerPolicy:'no-referrer',body,signal:controller.signal});
      if(!response.ok||!response.headers.get('content-type')?.includes('application/json'))return {ok:false,reason:'rejected'};
      const result=await response.json();
      return result?.accepted===true?{ok:true}:{ok:false,reason:'rejected'};
    }catch{return {ok:false,reason:controller.signal.aborted?'timeout':'network'};}
    finally{clearTimeout(timer);active=false;}
  };
}
export function emailDraft(brief:Brief):string {
  const body=`Name: ${brief.name}\nEmail: ${brief.email}\nService: ${brief.service}\nMonthly option: ${planLabel(brief.plan)||'—'}\nCompany: ${brief.company||'—'}\nWebsite: ${brief.website||'—'}\nTiming: ${brief.timing||'—'}\nCampaign: ${brief.campaign||'Direct enquiry'}\nProject reference: ${brief.project||'—'}\n\n${brief.description}`;
  return `mailto:hello@ashbi.ca?subject=${encodeURIComponent('A project for Ashbi')}&body=${encodeURIComponent(body)}`;
}
