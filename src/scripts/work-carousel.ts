const mobileWork=window.matchMedia('(max-width: 760px)');
const reducedWork=window.matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll<HTMLElement>('[data-work-carousel]').forEach(track=>{
 const controls=document.querySelector<HTMLElement>(`[data-carousel-controls="${track.id}"]`);
 if(!controls)return;
 const cards=()=>Array.from(track.children).filter((node):node is HTMLElement=>node instanceof HTMLElement&&!node.hidden);
 const buttons=Array.from(controls.querySelectorAll<HTMLButtonElement>('button'));
 const position=controls.querySelector<HTMLElement>('[data-carousel-position]')!;
 const index=()=>{
  const left=track.getBoundingClientRect().left;
  return cards().reduce((best,card,i,all)=>Math.abs(card.getBoundingClientRect().left-left)<Math.abs(all[best].getBoundingClientRect().left-left)?i:best,0);
 };
 const update=()=>{
  const count=cards().length,active=index();
  controls.hidden=!mobileWork.matches||count<2;
  track.tabIndex=mobileWork.matches?0:-1;
  position.textContent=`${active+1} / ${count} · Swipe to explore`;
  buttons[0].disabled=track.scrollLeft<=2;
  buttons[1].disabled=track.scrollLeft>=track.scrollWidth-track.clientWidth-2;
 };
 const move=(step:number)=>{
  const items=cards();const card=items[Math.max(0,Math.min(items.length-1,index()+step))];
  if(card)track.scrollBy({left:card.getBoundingClientRect().left-track.getBoundingClientRect().left-2,behavior:reducedWork.matches?'instant':'smooth'});
 };
 buttons.forEach(button=>button.addEventListener('click',()=>move(Number(button.dataset.carouselStep))));
 track.addEventListener('keydown',event=>{
  if(!mobileWork.matches||event.target!==track)return;
  if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();move(event.key==='ArrowRight'?1:-1);}
 });
 let timer:ReturnType<typeof setTimeout>;
 track.addEventListener('scroll',()=>{clearTimeout(timer);timer=setTimeout(update,120)},{passive:true});
 new ResizeObserver(update).observe(track);
 mobileWork.addEventListener('change',update);
 update();
});
