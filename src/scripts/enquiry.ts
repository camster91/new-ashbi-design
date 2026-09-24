import {createBriefSender,emailDraft,readBrief,serviceOptions,validEndpoint,validateBrief} from '../lib/enquiry';
import {track} from './tracking';
const form=document.querySelector<HTMLFormElement>('[data-enquiry-form]');
if(form){
  const endpoint=form.dataset.endpoint||'';
  const submit=form.querySelector<HTMLButtonElement>('[data-submit]')!;
  const draft=form.querySelector<HTMLButtonElement>('[data-email-draft]')!;
  const status=form.querySelector<HTMLElement>('[data-form-status]')!;
  const select=form.elements.namedItem('service') as HTMLSelectElement;
  const selected=new URLSearchParams(location.search).get('service');
  if(selected&&serviceOptions.some(s=>s===selected))select.value=selected;
  submit.disabled=!validEndpoint(endpoint);draft.disabled=false;
  const send=createBriefSender(endpoint);
  let busy=false;let started=false;
  form.addEventListener('input',()=>{if(!started){started=true;track('brief_start',{service:select.value||'not-sure'});}});
  const brief=()=>readBrief(Object.fromEntries(new FormData(form)));
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
    track('email_click',{section:'project-brief',service:value.service});
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
    if(result.ok){status.textContent='Thanks — your brief has been received. We’ll be in touch to discuss the next step.';form.reset();started=false;track('brief_success',{service:value.service});}
    else{status.textContent=result.reason==='timeout'?'We couldn’t confirm receipt in time. Your details are still here. Please email us to check before trying again.':'We couldn’t confirm that your brief was received. Your details are still here. Please try again or use the email option.';track('brief_failure',{service:value.service});}
    busy=false;submit.disabled=false;draft.disabled=false;submit.textContent='Send project brief ↗';form.removeAttribute('aria-busy');status.focus();
  });
}
