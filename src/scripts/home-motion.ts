import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

/** Scroll choreography owns only homepage transforms, and reverts them on pause. */
export function initHomeMotion() {
  if (!document.querySelector('[data-home-motion]')) return;
  const media = gsap.matchMedia();
  const setup = () => {
    media.revert();
    if (document.body.classList.contains('motion-paused')) return;
    media.add({desktop:'(min-width: 1001px)', mobile:'(max-width: 1000px)', reduced:'(prefers-reduced-motion: reduce)'}, context => {
      if (context.conditions?.reduced) return;
      const desktop = Boolean(context.conditions?.desktop);
      const distance = desktop ? 76 : 30;
      const enter = (targets: gsap.TweenTarget, trigger: Element, extra: gsap.TweenVars = {}) =>
        gsap.from(targets, {y:distance, opacity:.25, duration:1.05, stagger:.12, ease:'power3.out', ...extra,
          scrollTrigger:{trigger,start:'top 91%',once:true}});
      const drift = (target: Element, trigger: Element, from: gsap.TweenVars, to: gsap.TweenVars) =>
        gsap.fromTo(target, from, {...to,ease:'none',scrollTrigger:{trigger,start:'top bottom',end:'bottom top',scrub:desktop?1.1:.6}});

      const hero = document.querySelector('.hero')!;
      gsap.from('.hero-copy > *',{y:distance,opacity:.2,duration:1.15,stagger:.13,ease:'power3.out'});
      const stage = hero.querySelector('.hero-reel-stage');
      if(stage) drift(stage,hero,{y:desktop?40:14,scale:.95},{y:desktop?-45:-12,scale:1});
      document.querySelectorAll('.client-logos').forEach(row=>enter(row.children,row,{y:30,scale:.85,stagger:.15}));
      document.querySelectorAll('.section-heading,.faq-intro,.studio-copy,.conversation-copy').forEach(heading=>
        enter(heading.children,heading,{y:desktop?58:25,stagger:.13}));
      document.querySelectorAll('.work-row').forEach((card,index)=>{
        enter(card,card,{x:desktop?(index%2?60:-60):0,y:desktop?65:30,rotation:desktop?(index%2?1.5:-1.5):0});
        const photo=card.querySelector('.work-photo');
        if(photo&&desktop) drift(photo,card,{y:18},{y:-18});
      });
      const proof=document.querySelector('.proof-marquee');
      if(proof) enter(proof,proof,{scale:.96,y:distance});
      document.querySelectorAll('.offer-card').forEach((card,index)=>{
        enter(card,card,{y:desktop?90+(index%2)*28:35,rotationX:desktop?8:0,transformPerspective:1000,delay:desktop?index*.08:0});
      });
      const studio=document.querySelector('.studio-photo');
      if(studio){
        enter(studio,studio,{rotation:desktop?-3:0,scale:.94});
        const img=studio.querySelector('img');
        if(img&&desktop) drift(img,studio,{yPercent:-5,scale:1.12},{yPercent:5,scale:1.12});
      }
      document.querySelectorAll('.collaboration-steps li').forEach(step=>{
        enter(step,step,{x:desktop?45:0,y:desktop?40:25});
        const number=step.querySelector('.step-number');
        if(number) enter(number,step,{scale:.65,rotation:-12,y:0});
        gsap.fromTo(step,{'--step-progress':0},{'--step-progress':1,ease:'none',scrollTrigger:{trigger:step,start:'top 80%',end:'bottom 45%',scrub:.5}});
      });
      document.querySelectorAll('.faq-list details').forEach(row=>enter(row,row,{x:desktop?35:0,y:20,duration:.65}));
      const portrait=document.querySelector('.conversation-cta .booking-portrait');
      if(portrait) drift(portrait,portrait.closest('section')!,{y:desktop?50:16,rotation:desktop?-4:0},{y:desktop?-30:-8,rotation:0});
      const footer=document.querySelector('.site-footer');
      if(footer) enter(footer.children,footer,{y:30,stagger:.08});
    });
    ScrollTrigger.refresh();
  };
  setup();
  document.querySelector('[data-motion-toggle]')?.addEventListener('click',setup);
  document.fonts.ready.then(()=>ScrollTrigger.refresh());
  window.addEventListener('load',()=>ScrollTrigger.refresh(),{once:true});
}
