import {createBriefSender,emailDraft,knownCampaign,knownPlan,knownProject,planLabel,readBrief,serviceOptions,validEndpoint,validateBrief} from '../lib/enquiry';
import {track} from './tracking';
const form=document.querySelector<HTMLFormElement>('[data-enquiry-form]');
if(form){
  const endpoint=form.dataset.endpoint||'';
  const submit=form.querySelector<HTMLButtonElement>('[data-submit]')!;
  const draft=form.querySelector<HTMLButtonElement>('[data-email-draft]')!;
  const status=form.querySelector<HTMLElement>('[data-form-status]')!;
  const select=form.elements.namedItem('service') as HTMLSelectElement;
  const params=new URLSearchParams(location.search);
  const selected=params.get('service');
  const campaign=knownCampaign(params.get('campaign'));
  const project=knownProject(params.get('project'));
  const plan=knownPlan(params.get('plan'));
  if(selected&&serviceOptions.some(s=>s===selected))select.value=selected;
  const planContext=form.querySelector<HTMLElement>('[data-plan-context]');
  const updatePlanContext=()=>{
    if(!planContext)return;
    planContext.hidden=!plan||select.value!=='design-and-dev-subscription';
    if(!planContext.hidden)planContext.textContent=`You selected ${planLabel(plan)}. We’ll include this starting point with your brief; the final scope is confirmed together.`;
  };
  updatePlanContext();select.addEventListener('change',updatePlanContext);
  const projectContext=form.querySelector<HTMLElement>('[data-project-context]');
  if(project&&projectContext){
    const labels=JSON.parse(projectContext.dataset.projectLabels||'{}') as Record<string,string>;
    projectContext.textContent=`You came from our ${labels[project]||project} project. We’ll include that context with your brief.`;
    projectContext.hidden=false;
  }
  submit.disabled=!validEndpoint(endpoint);draft.disabled=false;
  const send=createBriefSender(endpoint);
  let busy=false;let started=false;
  form.addEventListener('input',()=>{if(!started){started=true;track('brief_start',{service:select.value||'not-sure',campaign,project,plan:select.value==='design-and-dev-subscription'?plan:undefined});}});
  const brief=()=>readBrief({...Object.fromEntries(new FormData(form)),campaign,project,plan:select.value==='design-and-dev-subscription'?plan:''});
  const validate=()=>{
    const value=brief();const errors=validateBrief(value);
    form.querySelectorAll<HTMLElement>('.field-error').forEach(el=>el.textContent='');
    form.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));
    for(const [name,message] of Object.entries(errors)){
      const field=form.elements.namedItem(name) as HTMLElement|null;
      field?.setAttribute('aria-invalid','true');
      const error=form.querySelector(`#error-${name}`);if(error)error.textContent=message;
    }
    if(Object.keys(errors).length){status.textContent='Please check the highlighted fields.';(form.elements.namedItem(Object.keys(errors)[0]) as HTMLElement)?.focus();return null;}
    return value;
  };
  draft.addEventListener('click',()=>{
    const value=validate();if(!value)return;
    track('email_click',{section:'project-brief',service:value.service,project,plan:value.plan||undefined});
    status.textContent='Your email app will open with a draft. Review it and send it there. Nothing has been submitted through this website.';
    window.location.href=emailDraft(value);
  });
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(busy)return;
    if(!validEndpoint(endpoint)){status.textContent='Online submission is unavailable. Please use the email option.';return;}
    const value=validate();if(!value)return;
    busy=true;submit.disabled=true;draft.disabled=true;submit.textContent='Sending…';form.setAttribute('aria-busy','true');status.textContent='Sending your brief…';
    const honeypot=(form.elements.namedItem('fax_number') as HTMLInputElement|null)?.value||'';
    const result=await send({...value,fax_number:honeypot});
    if(result.ok){status.textContent='Thanks — your brief has been received. We’ll be in touch to discuss the next step.';form.reset();updatePlanContext();started=false;track('brief_success',{service:value.service,campaign,project,plan:value.plan||undefined});}
    else{status.textContent=result.reason==='timeout'?'We couldn’t confirm receipt in time. Your details are still here. Please email us to check before trying again.':'We couldn’t confirm that your brief was received. Your details are still here. Please try again or use the email option.';track('brief_failure',{service:value.service,campaign,project,plan:value.plan||undefined});}
    busy=false;submit.disabled=false;draft.disabled=false;submit.textContent='Send project brief ↗';form.removeAttribute('aria-busy');status.focus();
  });
}
