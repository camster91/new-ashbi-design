import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

/** Scroll choreography owns only homepage transforms, and reverts them on pause. */
export function initHomeMotion() {
  if (!document.querySelector('[data-home-motion]')) return;
  const media = gsap.matchMedia();
  const setup = () => {
    media.revert();
    if (document.body.classList.contains('motion-paused')) return;
    media.add({desktop:'(min-width: 1001px)', mobile:'(max-width: 1000px)', carousel:'(max-width: 760px)', reduced:'(prefers-reduced-motion: reduce)'}, context => {
      if (context.conditions?.reduced) return;
      const desktop = Boolean(context.conditions?.desktop);
      const distance = desktop ? 92 : 26;
      const enter = (targets: gsap.TweenTarget, trigger: Element, extra: gsap.TweenVars = {}) =>
        gsap.from(targets, {y:distance, opacity:.25, duration:1.05, stagger:.12, ease:'power3.out', ...extra,
          scrollTrigger:{trigger,start:'top 91%',once:true}});
      const drift = (target: Element, trigger: Element, from: gsap.TweenVars, to: gsap.TweenVars) =>
        gsap.fromTo(target, from, {...to,ease:'none',scrollTrigger:{trigger,start:'top bottom',end:'bottom top',scrub:desktop?1.1:.6}});

      const hero = document.querySelector('.hero')!;
      gsap.from('.hero-copy > *',{y:distance,opacity:.2,duration:1.15,stagger:.13,ease:'power3.out'});
      const character = hero.querySelector('.hero-character');
      if(character){
        gsap.from(character,{rotation:-16,y:32,opacity:0,duration:1.35,delay:.35,ease:'back.out(1.15)'});
        const artwork=character.querySelector('img');
        if(artwork&&desktop) drift(artwork,hero,{y:-24,rotation:-5},{y:110,rotation:12});
      }
      // Animate decorative background coordinates independently of readable content.
      drift(hero,hero,{'--brand-grid-y':'0px'},{'--brand-grid-y':desktop?'130px':'24px'});
      const stamp = document.querySelector('.ways-section > .brand-stamp');
      if(stamp){
        enter(stamp,stamp,{scale:.65,rotation:-28,y:25,ease:'back.out(1.3)'});
        const symbol=stamp.querySelector('span');
        if(symbol&&desktop) drift(symbol,stamp.closest('section')!,{rotation:-35},{rotation:110});
      }
      const stage = hero.querySelector('.hero-reel-stage');
      if(stage) drift(stage,hero,{y:desktop?72:10,scale:desktop?.94:1},{y:desktop?-65:-8,scale:1});
      document.querySelectorAll('.brand-marquee-head').forEach(row=>{
        enter(row.children,row,{y:desktop?48:22,scale:.72,rotation:desktop?-7:0,stagger:.17,ease:'back.out(1.25)'});
      });
      document.querySelectorAll('.section-heading,.faq-intro,.studio-copy,.conversation-copy').forEach(heading=>{
        enter(heading.children,heading,{y:desktop?72:25,stagger:.14});
        gsap.fromTo(heading,{'--heading-rule':0},{'--heading-rule':1,duration:1.25,ease:'power3.inOut',scrollTrigger:{trigger:heading,start:'top 85%',once:true}});
        heading.querySelectorAll('.editorial').forEach(word=>gsap.fromTo(word,{'--accent-progress':0},{'--accent-progress':1,duration:1.15,ease:'power2.inOut',scrollTrigger:{trigger:heading,start:'top 78%',once:true}}));
      });
      document.querySelectorAll('.work-row').forEach((card,index)=>{
        // Native mobile carousels must keep every offscreen card visible and aligned.
        if(window.matchMedia('(max-width: 760px)').matches) return;
        enter(card,card,{x:desktop?(index%2?60:-60):0,y:desktop?65:30,rotation:desktop?(index%2?1.5:-1.5):0});
        const photo=card.querySelector('.work-photo');
        if(photo&&desktop) drift(photo,card,{y:34},{y:-34});
        const indexBadge=card.querySelector('.work-index');
        if(indexBadge) enter(indexBadge,card,{y:15,scale:.6,rotation:-10,delay:.2,ease:'back.out(1.3)'});
        const tags=card.querySelector('.tags');
        if(tags) enter(tags.children,card,{x:18,y:0,stagger:.07,delay:.25,duration:.6});
      });
      const proof=document.querySelector('.proof-marquee');
      if(proof){
        enter(proof,proof,{scale:.96,y:distance});
        proof.querySelectorAll('.proof-marquee-window').forEach((row,index)=>{
          enter(row,row,{x:desktop?(index===0?-48:48):0,y:desktop?0:20,duration:1.3});
          enter(row.querySelectorAll('.quote-mark'),row,{scale:.4,rotation:index===0?-18:18,y:12,stagger:.025,ease:'back.out(1.15)'});
        });
      }
      document.querySelectorAll('.offer-card').forEach((card,index)=>{
        enter(card,card,{y:desktop?90+(index%2)*28:35,rotationX:desktop?12:0,transformPerspective:1000,delay:desktop?index*.08:0});
        const frame=card.querySelector('.offer-image');
        if(frame) gsap.fromTo(frame,{scale:.94,borderRadius:'32px'},{scale:1,borderRadius:'14px',duration:1.2,ease:'power3.out',scrollTrigger:{trigger:card,start:'top 82%',once:true}});
        const items=card.querySelectorAll('li');
        enter(items,card,{x:desktop?20:0,y:12,stagger:.065,delay:.15,duration:.65});
      });
      const studio=document.querySelector('.studio-photo');
      if(studio){
        enter(studio,studio,{rotation:desktop?-5:0,scale:.92});
        const img=studio.querySelector('img');
        if(img&&desktop) drift(img,studio,{yPercent:-6,scale:1.15},{yPercent:6,scale:1.15});
        const label=studio.querySelector('.photo-label');
        if(label) enter(label,studio,{x:-25,y:0,rotation:-4,delay:.25,ease:'back.out(1.1)'});
      }
      const process=document.querySelector('.process-section');
      if(process) drift(process,process,{'--process-grid-y':'-60px'},{'--process-grid-y':desktop?'120px':'20px'});
      document.querySelectorAll('.collaboration-steps li').forEach(step=>{
        enter(step,step,{x:desktop?45:0,y:desktop?40:25});
        const details=step.querySelector('dl');
        if(details) enter(details.children,step,{y:18,x:desktop?22:0,stagger:.14,delay:.15,duration:.7});
        const number=step.querySelector('.step-number');
        if(number) enter(number,step,{scale:.65,rotation:-12,y:0});
        gsap.fromTo(step,{'--step-progress':0},{'--step-progress':1,ease:'none',scrollTrigger:{trigger:step,start:'top 80%',end:'bottom 45%',scrub:.5}});
      });
      const cleanup: Array<()=>void> = [];
      document.querySelectorAll<HTMLDetailsElement>('.faq-list details').forEach(row=>{
        enter(row,row,{x:desktop?35:0,y:20,duration:.65});
        // Track interaction-created tweens in this context so pause/reduced motion reverts them.
        const toggle=()=>context.add(()=>{
          const answer=row.querySelector('p');
          if(answer){
            gsap.killTweensOf(answer);
            if(row.open) gsap.fromTo(answer,{y:10,opacity:.55},{y:0,opacity:1,duration:.3,ease:'power2.out',clearProps:'transform,opacity'});
            else gsap.set(answer,{clearProps:'transform,opacity'});
          }
          ScrollTrigger.refresh();
        });
        row.addEventListener('toggle',toggle);
        cleanup.push(()=>row.removeEventListener('toggle',toggle));
      });
      const portrait=document.querySelector('.conversation-cta .booking-portrait');
      if(portrait) drift(portrait,portrait.closest('section')!,{y:desktop?50:16,rotation:desktop?-4:0},{y:desktop?-30:-8,rotation:0});
      const closing=document.querySelector('.closing-character img');
      if(closing) drift(closing,closing.closest('section')!,{y:desktop?75:15,rotation:desktop?-12:-4},{y:desktop?-55:-12,rotation:desktop?12:4});
      const footer=document.querySelector('.site-footer');
      if(footer){
        const columns=footer.querySelector('.footer-grid');
        if(columns) enter(columns.children,footer,{y:desktop?60:24,stagger:.12});
        const logo=footer.querySelector('.footer-lead img');
        if(logo) enter(logo,footer,{scale:.85,rotation:-5,y:0,ease:'back.out(1.2)'});
        const base=footer.querySelector('.footer-base');
        if(base) enter(base,footer,{y:15,delay:.25});
      }
      return ()=>cleanup.forEach(remove=>remove());
    });
    ScrollTrigger.refresh();
  };
  setup();
  document.querySelector('[data-motion-toggle]')?.addEventListener('click',setup);
  document.fonts.ready.then(()=>ScrollTrigger.refresh());
  window.addEventListener('load',()=>ScrollTrigger.refresh(),{once:true});
}
