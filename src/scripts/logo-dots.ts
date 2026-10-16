/**
 * "Dots → logo": when the footer first scrolls into view, a cloud of dots
 * sampled from the Ashbi logo flies together and resolves into the real image.
 * The logo image stays in the page the whole time; the canvas is decorative.
 */
const DURATION=1500;
const PAD=90;

type Dot={x:number;y:number;sx:number;sy:number;color:string;delay:number};

const easeOut=(t:number)=>1-Math.pow(1-t,4);

export function initLogoDots(){
  const img=document.querySelector<HTMLImageElement>('[data-logo-dots] img');
  if(!img||!('IntersectionObserver' in window))return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  if(document.body.classList.contains('motion-paused'))return;
  // Only play for visitors who have not already seen the footer.
  if(img.getBoundingClientRect().top<window.innerHeight)return;

  const host=img.closest<HTMLElement>('[data-logo-dots]')!;
  host.dataset.logoDots='armed';
  let finished=false;
  const finish=()=>{
    if(finished)return;
    finished=true;
    host.dataset.logoDots='done';
    host.querySelector('canvas')?.remove();
  };
  document.querySelector('[data-motion-toggle]')?.addEventListener('click',finish);

  const observer=new IntersectionObserver(entries=>{
    if(!entries.some(entry=>entry.isIntersecting))return;
    observer.disconnect();
    img.decode().then(()=>play(img,host,finish,()=>finished)).catch(finish);
  },{threshold:.6});
  observer.observe(img);
}

function play(img:HTMLImageElement,host:HTMLElement,finish:()=>void,isFinished:()=>boolean){
  const w=img.clientWidth,h=img.clientHeight;
  if(!w||!h)return finish();
  // Sample the logo on a grid; each opaque cell becomes one dot in its own colour.
  const sample=document.createElement('canvas');
  sample.width=w;sample.height=h;
  const sctx=sample.getContext('2d',{willReadFrequently:true});
  if(!sctx)return finish();
  sctx.drawImage(img,0,0,w,h);
  let pixels:Uint8ClampedArray;
  try{pixels=sctx.getImageData(0,0,w,h).data;}catch{return finish();}
  const step=Math.max(3,Math.round(w/64));
  const dots:Dot[]=[];
  for(let y=step/2;y<h;y+=step){
    for(let x=step/2;x<w;x+=step){
      const i=(Math.floor(y)*w+Math.floor(x))*4;
      if(pixels[i+3]<140)continue;
      // Start scattered across the whole canvas, so every dot is visible as it travels.
      dots.push({x:x+PAD,y:y+PAD,sx:Math.random()*(w+PAD*2),sy:Math.random()*(h+PAD*2),
        color:`rgb(${pixels[i]},${pixels[i+1]},${pixels[i+2]})`,delay:Math.random()*.32});
    }
  }
  if(!dots.length)return finish();

  const canvas=document.createElement('canvas');
  const dpr=Math.min(window.devicePixelRatio||1,2);
  canvas.width=(w+PAD*2)*dpr;canvas.height=(h+PAD*2)*dpr;
  canvas.style.cssText=`position:absolute;left:${img.offsetLeft-PAD}px;top:${img.offsetTop-PAD}px;width:${w+PAD*2}px;height:${h+PAD*2}px;pointer-events:none`;
  canvas.setAttribute('aria-hidden','true');
  host.appendChild(canvas);
  const ctx=canvas.getContext('2d');
  if(!ctx)return finish();
  ctx.scale(dpr,dpr);
  const radius=step*.48;
  const start=performance.now();

  const frame=(now:number)=>{
    if(isFinished())return;
    const t=(now-start)/DURATION;
    ctx.clearRect(0,0,w+PAD*2,h+PAD*2);
    for(const dot of dots){
      const local=Math.min(1,Math.max(0,(t-dot.delay)/(1-.32)));
      const p=easeOut(local);
      ctx.globalAlpha=Math.min(1,local*3);
      ctx.fillStyle=dot.color;
      ctx.beginPath();
      ctx.arc(dot.sx+(dot.x-dot.sx)*p,dot.sy+(dot.y-dot.sy)*p,radius*(.6+.4*p),0,Math.PI*2);
      ctx.fill();
    }
    if(t<1){requestAnimationFrame(frame);return;}
    // Dots have landed: dissolve them into the crisp logo.
    host.dataset.logoDots='resolving';
    canvas.style.transition='opacity .45s ease';
    canvas.style.opacity='0';
    window.setTimeout(finish,480);
  };
  requestAnimationFrame(frame);
}
