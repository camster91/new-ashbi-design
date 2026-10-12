/** "Island → live": shows the studio's local Toronto time, opening from a dot like a Dynamic Island. */
export function initStudioIsland(){
  const island=document.querySelector<HTMLElement>('[data-studio-island]');
  const time=island?.querySelector<HTMLElement>('[data-island-time]');
  if(!island||!time)return;
  let format:Intl.DateTimeFormat;
  try{format=new Intl.DateTimeFormat('en-CA',{hour:'numeric',minute:'2-digit',timeZone:'America/Toronto'});}catch{return;}
  const tick=()=>{time.textContent=`${format.format(new Date()).replace(/\./g,'').toUpperCase()} in Toronto`;};
  tick();
  window.setInterval(tick,30000);
  const still=window.matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('motion-paused');
  if(still)return;
  island.dataset.island='closed';
  window.setTimeout(()=>{delete island.dataset.island;},900);
}
