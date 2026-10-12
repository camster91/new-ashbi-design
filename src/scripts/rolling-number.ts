/** Rolls odometer numbers into place the first time they scroll into view. */
export function initRollingNumbers() {
  const numbers=[...document.querySelectorAll<HTMLElement>('[data-rolling-number]')];
  if(!numbers.length||!('IntersectionObserver' in window))return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const roll=(el:HTMLElement)=>{
    el.dataset.roll='rolled';
  };
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(!entry.isIntersecting)continue;
      const el=entry.target as HTMLElement;
      observer.unobserve(el);
      // Let the armed position paint once so the transition has somewhere to start from.
      requestAnimationFrame(()=>requestAnimationFrame(()=>roll(el)));
    }
  },{rootMargin:'0px 0px -10%',threshold:.4});
  numbers.forEach((el,index)=>{
    // Only arm numbers the visitor has not seen yet, so nothing visibly resets.
    if(el.getBoundingClientRect().top<window.innerHeight)return;
    el.querySelectorAll<HTMLElement>('.rolling-digit').forEach((digit,order)=>digit.style.setProperty('--roll-delay',`${order*90+(index%3)*120}ms`));
    el.dataset.roll='armed';
    observer.observe(el);
  });
  // Pausing page motion settles every number immediately.
  document.querySelector('[data-motion-toggle]')?.addEventListener('click',()=>{
    if(!document.body.classList.contains('motion-paused'))return;
    numbers.forEach(el=>{if(el.dataset.roll==='armed'){observer.unobserve(el);delete el.dataset.roll;}});
  });
}
