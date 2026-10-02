// Three identical sets keep the viewport covered while wrapping in either direction.
export function initLoopingScroller(row: HTMLElement, selector: string, speed: number, paused: () => boolean) {
 const set=row.querySelector<HTMLElement>(selector);
 if(!set)return;
 const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
 let visible=false;
 let pointer: {id:number;x:number;y:number;dragged:boolean}|null=null;
 let suppressClick=false;
 let previous=0;
 let fraction=0;
 // Scroll offsets use layout pixels, unaffected by the hero's entrance scale.
 const width=()=>parseFloat(getComputedStyle(set).width);
 const wrap=()=>{
  if(preference.matches)return;
  const size=width();
  if(!size)return;
  if(row.scrollLeft<size/2)row.scrollLeft+=size;
  else if(row.scrollLeft>size*1.5)row.scrollLeft-=size;
 };
 const centre=()=>{row.scrollLeft=preference.matches?0:width();fraction=0};
 new ResizeObserver(centre).observe(set);
 new IntersectionObserver(([entry])=>{visible=entry.isIntersecting}).observe(row);
 preference.addEventListener('change',centre);
 row.addEventListener('scroll',wrap,{passive:true});
 row.addEventListener('dragstart',event=>event.preventDefault());
 row.addEventListener('pointerdown',event=>{
  if(!event.isPrimary||event.button!==0)return;
  pointer={id:event.pointerId,x:event.clientX,y:event.clientY,dragged:false};
  suppressClick=false;
 });
 row.addEventListener('pointermove',event=>{
  if(!pointer||pointer.id!==event.pointerId)return;
  const dx=event.clientX-pointer.x;
  const dy=event.clientY-pointer.y;
  if(!pointer.dragged){
   if(Math.abs(dx)<6||Math.abs(dx)<=Math.abs(dy))return;
   pointer.dragged=true;
   row.setPointerCapture(event.pointerId);
   row.classList.add('is-dragging');
  }
  event.preventDefault();
  row.scrollLeft-=dx;
  wrap();
  pointer.x=event.clientX;pointer.y=event.clientY;
 });
 const release=(event:PointerEvent)=>{
  if(!pointer||pointer.id!==event.pointerId)return;
  suppressClick=pointer.dragged;
  pointer=null;
  row.classList.remove('is-dragging');
  if(row.hasPointerCapture(event.pointerId))row.releasePointerCapture(event.pointerId);
  // A drag must not follow the project link on the ensuing click.
  window.setTimeout(()=>{suppressClick=false},0);
 };
 window.addEventListener('pointerup',release);
 window.addEventListener('pointercancel',release);
 row.addEventListener('lostpointercapture',release);
 row.addEventListener('click',event=>{if(suppressClick){event.preventDefault();event.stopPropagation()}},true);
 const move=(distance:number)=>{row.scrollLeft+=distance;wrap()};
 row.addEventListener('keydown',event=>{
  if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
  event.preventDefault();move(event.key==='ArrowLeft'?-220:220);
 });
 const advance=(now:number)=>{
  const elapsed=previous?Math.min(now-previous,64):0;previous=now;
  if(visible&&!pointer&&!preference.matches&&!document.hidden&&!paused()&&!row.matches(':focus-visible')&&!row.querySelector(':focus-visible')){
   fraction+=elapsed*speed;
   const pixels=Math.trunc(fraction);
   if(pixels){move(pixels);fraction-=pixels}
  }
  requestAnimationFrame(advance);
 };
 requestAnimationFrame(advance);
 return move;
}
