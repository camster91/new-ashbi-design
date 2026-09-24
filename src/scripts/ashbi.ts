import './tracking';
import './enquiry';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const menu=document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
const nav=document.querySelector<HTMLElement>('#main-nav');
const setMenu=(open:boolean,restoreFocus=false)=>{
 document.body.classList.toggle('menu-open',open);
 menu?.setAttribute('aria-expanded',String(open));menu?.setAttribute('aria-label',open?'Close menu':'Open menu');
 document.querySelectorAll<HTMLElement>('main,.site-footer').forEach(el=>{el.inert=open});
 if(open)nav?.querySelector<HTMLAnchorElement>('a')?.focus();
 else if(restoreFocus)menu?.focus();
};
menu?.addEventListener('click',()=>setMenu(!document.body.classList.contains('menu-open')));
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
document.addEventListener('keydown',e=>{
 if(!document.body.classList.contains('menu-open'))return;
 if(e.key==='Escape'){e.preventDefault();setMenu(false,true);}
 if(e.key==='Tab'){
  const items=[...nav!.querySelectorAll<HTMLAnchorElement>('a'),menu!];
  const index=items.indexOf(document.activeElement as HTMLAnchorElement);
  if(e.shiftKey&&(index<=0)){e.preventDefault();items.at(-1)?.focus();}
  else if(!e.shiftKey&&(index===items.length-1)){e.preventDefault();items[0]?.focus();}
 }
});
window.matchMedia('(min-width:761px)').addEventListener('change',event=>{if(event.matches)setMenu(false)});
const header=document.querySelector('[data-header]');
window.addEventListener('scroll',()=>header?.classList.toggle('is-scrolled',window.scrollY>20),{passive:true});
const motion=document.querySelector<HTMLButtonElement>('[data-motion-toggle]');
motion?.addEventListener('click',()=>{const paused=document.body.classList.toggle('motion-paused');motion.setAttribute('aria-pressed',String(paused));motion.setAttribute('aria-label',paused?'Resume gallery motion':'Pause gallery motion');const icon=motion.querySelector('span');if(icon)icon.textContent=paused?'▶':'Ⅱ';});
const gallery=document.querySelector<HTMLElement>('.hero-reel-stage');
const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
const rows=[...document.querySelectorAll<HTMLElement>('[data-hero-reel]')];
const moveRows: ((direction:number)=>void)[]=[];
let lastGalleryInput=-Infinity;
let galleryVisible=true;
if(gallery)new IntersectionObserver(([entry])=>{galleryVisible=entry.isIntersecting}).observe(gallery);
rows.forEach((reel,index)=>{
  const set=reel.querySelector<HTMLElement>('.hero-reel-set');
  const direction=Number(reel.dataset.direction)||1;
  let pointerStart: {x:number;left:number}|null=null;
  let dragged=false;
  let fraction=0;
  const setWidth=()=>set?.getBoundingClientRect().width||0;
  const wrap=()=>{const width=setWidth();if(width&&reel.scrollLeft>=width)reel.scrollLeft-=width;};
  const move=(stepDirection:number)=>{
    const card=reel.querySelector<HTMLElement>('.reel-card');
    const step=(card?parseFloat(getComputedStyle(card).width):240)+parseFloat(getComputedStyle(set!).gap);
    if(stepDirection<0&&reel.scrollLeft<step)reel.scrollLeft+=setWidth();
    reel.scrollBy({left:stepDirection*step,behavior:motionPreference.matches?'auto':'smooth'});
    lastGalleryInput=performance.now();
  };
  moveRows.push(move);
  // Both rows start on the same inset and baseline; depth comes from the card treatment.
  reel.addEventListener('scroll',wrap,{passive:true});
  reel.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();move(event.key==='ArrowLeft'?-1:1)}});
  reel.addEventListener('pointerdown',event=>{
    lastGalleryInput=performance.now();
    if(event.pointerType!=='mouse')return;
    pointerStart={x:event.clientX,left:reel.scrollLeft};dragged=false;
  });
  reel.addEventListener('pointermove',event=>{if(!pointerStart)return;const distance=event.clientX-pointerStart.x;if(Math.abs(distance)>6){dragged=true;reel.scrollLeft=pointerStart.left-distance;lastGalleryInput=performance.now()}});
  const endDrag=()=>{pointerStart=null;window.setTimeout(()=>{dragged=false},0)};
  reel.addEventListener('pointerup',endDrag);
  reel.addEventListener('pointercancel',endDrag);
  reel.addEventListener('pointerleave',endDrag);
  reel.addEventListener('wheel',()=>{lastGalleryInput=performance.now()},{passive:true});
  reel.addEventListener('click',event=>{if(dragged){event.preventDefault();event.stopPropagation()}},true);
  let previous=0;
  const advance=(now:number)=>{
    const elapsed=previous?Math.min(now-previous,64):0;previous=now;
    if(window.innerWidth>760&&galleryVisible&&!motionPreference.matches&&!document.hidden&&!document.body.classList.contains('motion-paused')&&!gallery?.matches(':hover')&&!gallery?.contains(document.activeElement)&&now-lastGalleryInput>12000){
      fraction+=elapsed*(index===0?.014:.021)*direction;
      const pixels=Math.trunc(fraction);
      if(pixels){if(pixels<0&&reel.scrollLeft<-pixels)reel.scrollLeft+=setWidth();reel.scrollLeft+=pixels;fraction-=pixels;wrap()}
    }
    window.requestAnimationFrame(advance);
  };
  window.requestAnimationFrame(advance);
});
document.querySelector('[data-reel-prev]')?.addEventListener('click',()=>moveRows.forEach(move=>move(-1)));
document.querySelector('[data-reel-next]')?.addEventListener('click',()=>moveRows.forEach(move=>move(1)));
const proofMarquee=document.querySelector<HTMLElement>('[data-proof-marquee]');
const proofPause=proofMarquee?.querySelector<HTMLButtonElement>('[data-proof-pause]');
proofPause?.addEventListener('click',()=>{
 const paused=proofMarquee!.classList.toggle('is-paused');
 proofPause.setAttribute('aria-pressed',String(paused));
 proofPause.setAttribute('aria-label',paused?'Resume testimonial motion':'Pause testimonial motion');
 const icon=proofPause.querySelector<HTMLElement>('span');
 const label=proofPause.querySelector<HTMLElement>('[data-proof-pause-label]');
 if(icon)icon.textContent=paused?'▶':'Ⅱ';
 if(label)label.textContent=paused?'Resume motion':'Pause motion';
});
proofMarquee?.querySelectorAll<HTMLElement>('[data-proof-row]').forEach((row,index)=>{
 const set=row.querySelector<HTMLElement>('.proof-marquee-set');
 if(!set)return;
 const setWidth=()=>set.getBoundingClientRect().width;
 let lastInput=-Infinity;
 let previous=0;
 let visible=false;
 let resetting=false;
 const centre=()=>{if(motionPreference.matches)return;const width=setWidth();if(width){resetting=true;row.scrollLeft=width;requestAnimationFrame(()=>{resetting=false})}};
 new ResizeObserver(centre).observe(set);
 new IntersectionObserver(([entry])=>{visible=entry.isIntersecting}).observe(row);
 row.addEventListener('scroll',()=>{
  if(resetting||motionPreference.matches)return;
  const width=setWidth();
  if(row.scrollLeft<width/2)row.scrollLeft+=width;
  else if(row.scrollLeft>width*1.5)row.scrollLeft-=width;
 },{passive:true});
 row.addEventListener('pointerdown',()=>{lastInput=performance.now()});
 row.addEventListener('pointermove',event=>{if(event.buttons)lastInput=performance.now()},{passive:true});
 row.addEventListener('pointerup',()=>{lastInput=performance.now()});
 row.addEventListener('wheel',()=>{lastInput=performance.now()},{passive:true});
 row.addEventListener('keydown',event=>{
  if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
  event.preventDefault();
  lastInput=performance.now();
  row.scrollBy({left:event.key==='ArrowLeft'?-220:220,behavior:motionPreference.matches?'instant':'smooth'});
 });
 const advance=(now:number)=>{
  const elapsed=previous?Math.min(now-previous,64):0;previous=now;
  if(visible&&!motionPreference.matches&&!document.hidden&&!proofMarquee?.classList.contains('is-paused')&&!row.matches(':focus-visible')&&now-lastInput>1800){
   row.scrollLeft+=elapsed*(index===0?0.043:-0.039);
  }
  requestAnimationFrame(advance);
 };
 requestAnimationFrame(advance);
});
const serviceShowcase=document.querySelector<HTMLElement>('[data-services-showcase]');
if(serviceShowcase){
 const steps=[...serviceShowcase.querySelectorAll<HTMLElement>('[data-service-step]')];
 const visuals=[...serviceShowcase.querySelectorAll<HTMLElement>('[data-service-visual]')];
 const activate=(index:number)=>{
  steps.forEach((step,i)=>step.classList.toggle('is-active',i===index));
  visuals.forEach((visual,i)=>visual.classList.toggle('is-active',i===index));
 };
 steps.forEach((step,index)=>{
  step.addEventListener('focusin',()=>activate(index));
  step.addEventListener('mouseenter',()=>activate(index));
  if(!reduce)ScrollTrigger.create({trigger:step,start:'top 32%',end:'bottom 32%',onEnter:()=>activate(index),onEnterBack:()=>activate(index)});
 });
}
if(!reduce){gsap.from('.hero-copy > *',{opacity:0,y:24,duration:.7,stagger:.1,ease:'power2.out'});gsap.utils.toArray<HTMLElement>('.reveal').forEach(el=>gsap.from(el,{opacity:0,x:el.classList.contains('work-row')&&window.innerWidth>1000?60:0,y:el.classList.contains('work-row')&&window.innerWidth<=1000?40:28,duration:el.classList.contains('work-row')?.9:.65,ease:el.classList.contains('work-row')?'power3.out':'power2.out',scrollTrigger:{trigger:el,start:'top 90%',once:true}}));}
const filters=[...document.querySelectorAll<HTMLButtonElement>('[data-filter]')];
const tiles=[...document.querySelectorAll<HTMLElement>('[data-project-grid] [data-category]')];
filters.forEach(btn=>btn.addEventListener('click',()=>{
 const value=btn.dataset.filter;
 filters.forEach(b=>{const active=b===btn;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active))});
 tiles.forEach(tile=>{tile.hidden=value!=='All'&&!tile.dataset.category?.split('|').includes(value||'')});
 ScrollTrigger.refresh();
}));
