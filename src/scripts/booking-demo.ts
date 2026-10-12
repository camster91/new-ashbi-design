/** "Drag → booked": the mini calendar by Bianca's portrait picks a slot and books it, once. */
const STEPS:Array<[string,number]>=[['shown',0],['pick',650],['press',1450],['booked',1650],['done',2900]];

export function initBookingDemo(){
  const card=document.querySelector<HTMLElement>('[data-booking-demo]');
  if(!card)return;
  const settle=()=>{card.dataset.bookingDemo='done';};
  if(!('IntersectionObserver' in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('motion-paused'))return settle();
  // Only play for visitors who have not already scrolled to it.
  if(card.getBoundingClientRect().top<window.innerHeight)return settle();
  card.dataset.bookingDemo='armed';
  const timers:number[]=[];
  const observer=new IntersectionObserver(entries=>{
    if(!entries.some(entry=>entry.isIntersecting))return;
    observer.disconnect();
    for(const [state,at] of STEPS)timers.push(window.setTimeout(()=>{card.dataset.bookingDemo=state;},at));
  },{threshold:.6});
  observer.observe(card);
  document.querySelector('[data-motion-toggle]')?.addEventListener('click',()=>{observer.disconnect();timers.forEach(clearTimeout);settle();});
}
