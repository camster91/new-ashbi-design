/** "Weight → bold": a headline word steps from light to bold, letter by letter, when it scrolls in. */
export function initWeightWave(){
  const words=[...document.querySelectorAll<HTMLElement>('[data-weight-wave]')];
  if(!words.length||!('IntersectionObserver' in window))return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('motion-paused'))return;
  const pending=words.filter(word=>word.getBoundingClientRect().top>=window.innerHeight);
  pending.forEach(word=>{word.dataset.weightWave='armed';});
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(!entry.isIntersecting)continue;
      observer.unobserve(entry.target);
      const word=entry.target as HTMLElement;
      word.dataset.weightWave='play';
      word.addEventListener('animationend',event=>{if((event.target as HTMLElement)===word.querySelector('.weight-wave-letters>span:last-child'))delete word.dataset.weightWave;});
    }
  },{rootMargin:'0px 0px -15%',threshold:1});
  pending.forEach(word=>observer.observe(word));
  document.querySelector('[data-motion-toggle]')?.addEventListener('click',()=>{observer.disconnect();pending.forEach(word=>{delete word.dataset.weightWave;});});
}
