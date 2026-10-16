/**
 * Benefit icons draw themselves: outlines trace in, then their colour fills
 * pop in, one icon after another as the grid scrolls into view.
 */
export function initBenefitIcons(){
  const icons=[...document.querySelectorAll<SVGSVGElement>('.benefit-illustration')];
  if(!icons.length||!('IntersectionObserver' in window))return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('motion-paused'))return;
  const pending=icons.filter(icon=>icon.getBoundingClientRect().top>=window.innerHeight);
  pending.forEach((icon,index)=>{
    icon.querySelectorAll<SVGGeometryElement>('path,circle,rect').forEach(shape=>shape.setAttribute('pathLength','1'));
    icon.style.setProperty('--icon-delay',`${(index%3)*140}ms`);
    icon.dataset.draw='armed';
  });
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(!entry.isIntersecting)continue;
      observer.unobserve(entry.target);
      (entry.target as SVGSVGElement).dataset.draw='drawn';
    }
  },{rootMargin:'0px 0px -12%',threshold:.6});
  pending.forEach(icon=>observer.observe(icon));
  document.querySelector('[data-motion-toggle]')?.addEventListener('click',()=>{observer.disconnect();pending.forEach(icon=>{icon.dataset.draw='drawn';});});
}
