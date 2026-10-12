/**
 * "Click → done": the brief's submit button folds into a spinning ring while
 * sending, then lands on a check mark when the brief is received. The visible
 * status message stays the source of truth for screen readers.
 */
const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('motion-paused');
const nextFrame=()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));

export function submitMotion(button:HTMLButtonElement){
  let timer=0;
  const ensureMarks=()=>{
    if(button.querySelector('.submit-ring'))return;
    button.insertAdjacentHTML('beforeend','<span class="submit-ring" aria-hidden="true"></span><svg class="submit-check" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" pathLength="1"/></svg>');
  };
  const settle=async()=>{
    // Grow back to the measured width, then hand sizing back to the stylesheet.
    button.dataset.state='measure';
    window.setTimeout(()=>{if(button.dataset.state==='measure')delete button.dataset.state;},480);
  };
  return {
    async start(){
      if(reduced())return;
      window.clearTimeout(timer);
      ensureMarks();
      button.style.setProperty('--submit-w',`${button.offsetWidth}px`);
      button.dataset.state='measure';
      await nextFrame();
      button.dataset.state='sending';
    },
    done(){
      if(!button.dataset.state)return;
      button.dataset.state='done';
      timer=window.setTimeout(settle,2400);
    },
    reset(){
      if(!button.dataset.state)return;
      window.clearTimeout(timer);
      void settle();
    },
  };
}
