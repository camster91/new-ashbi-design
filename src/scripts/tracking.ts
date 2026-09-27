import {knownCampaign} from '../lib/enquiry';
import {briefLinkContext} from '../lib/analytics';
type EventName='page_view'|'project_view'|'service_view'|'campaign_view'|'contact_click'|'brief_click'|'booking_calendar_click'|'brief_start'|'brief_success'|'brief_failure'|'email_click';
type Context={section?:string;service?:string;project?:string;campaign?:string};
// Local hooks only: no network requests, form values, cookies, or persistent identifiers.
export function track(event:EventName,context:Context={}){
  window.dispatchEvent(new CustomEvent('ashbi:analytics',{detail:{event,page:location.pathname,...context}}));
}
const project=document.querySelector<HTMLElement>('[data-project-view]')?.dataset.projectView;
const service=document.querySelector<HTMLElement>('[data-service-view]')?.dataset.serviceView;
const campaign=knownCampaign(document.querySelector<HTMLElement>('[data-campaign-view]')?.dataset.campaignView);
if(campaign)document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(link=>{const url=new URL(link.href);if(url.origin===location.origin&&url.pathname==='/contact/'){url.searchParams.set('campaign',campaign);link.href=url.toString();}});
track('page_view');
if(project)track('project_view',{project});
if(service)track('service_view',{service});
if(campaign)track('campaign_view',{campaign});
document.addEventListener('click',event=>{
  const link=(event.target as Element)?.closest<HTMLAnchorElement>('a[href]');if(!link)return;
  const section=link.closest('section')?.id||link.closest('footer')&&'footer'||link.closest('header')&&'header'||'page';
  if(link.href.startsWith('mailto:')){track('email_click',{section});return;}
  if(link.dataset.track==='booking_calendar_click'){track('booking_calendar_click',{section,campaign});return;}
  const context=briefLinkContext(link.href,location.origin);
  if(context){track('brief_click',{section,...context});return;}
  const url=new URL(link.href);
  if(url.origin===location.origin&&url.pathname==='/contact/')track('contact_click',{section});
});
