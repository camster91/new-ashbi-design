type EventName='project_view'|'service_view'|'campaign_view'|'booking_click'|'booking_calendar_click'|'brief_start'|'brief_success'|'brief_failure'|'email_click';
type Context={section?:string;service?:string;project?:string;campaign?:string};
// Local hooks only: no network requests, form values, cookies, or persistent identifiers.
export function track(event:EventName,context:Context={}){
  window.dispatchEvent(new CustomEvent('ashbi:analytics',{detail:{event,page:location.pathname,...context}}));
}
const project=document.querySelector<HTMLElement>('[data-project-view]')?.dataset.projectView;
const service=document.querySelector<HTMLElement>('[data-service-view]')?.dataset.serviceView;
const campaign=document.querySelector<HTMLElement>('[data-campaign-view]')?.dataset.campaignView;
if(project)track('project_view',{project});
if(service)track('service_view',{service});
if(campaign)track('campaign_view',{campaign});
document.addEventListener('click',event=>{
  const link=(event.target as Element)?.closest<HTMLAnchorElement>('a[href]');if(!link)return;
  const section=link.closest('section')?.id||link.closest('footer')&&'footer'||link.closest('header')&&'header'||'page';
  if(link.href.startsWith('mailto:'))track('email_click',{section});
  else if(link.dataset.track==='booking_calendar_click')track('booking_calendar_click',{section});
  else if(link.getAttribute('href')==='/contact/'||link.dataset.track==='booking_click')track('booking_click',{section});
});
