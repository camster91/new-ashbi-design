/** "Alerts → stack": store notifications arrive one by one after the sketch reveals the site. */
export function initStoreAlerts(){
  const stack=document.querySelector<HTMLElement>('[data-store-alerts]');
  if(!stack||document.documentElement.dataset.sketch!=='play')return;
  if(document.body.classList.contains('motion-paused'))return;
  stack.dataset.shown='0';
  const timers=[2350,3250,4150].map((at,i)=>window.setTimeout(()=>{stack.dataset.shown=String(i+1);},at));
  document.querySelector('[data-motion-toggle]')?.addEventListener('click',()=>{timers.forEach(clearTimeout);delete stack.dataset.shown;});
}
