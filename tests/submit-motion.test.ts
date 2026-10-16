import test,{type TestContext} from 'node:test';
import assert from 'node:assert/strict';
import {submitMotion} from '../src/scripts/submit-motion.ts';

function fixture(t:TestContext){
  const frames:Array<FrameRequestCallback>=[];
  const timers=new Map<number,()=>void>();
  let timer=0;
  let reduced=false;
  const names=['window','document','requestAnimationFrame'];
  const originals=new Map(names.map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
  const define=(name:string,value:unknown)=>Object.defineProperty(globalThis,name,{value,configurable:true,writable:true});
  define('window',{
    matchMedia:()=>({matches:reduced}),
    setTimeout:(callback:()=>void)=>{timers.set(++timer,callback);return timer;},
    clearTimeout:(id:number)=>timers.delete(id),
  });
  define('document',{body:{classList:{contains:()=>false}}});
  define('requestAnimationFrame',(callback:FrameRequestCallback)=>{frames.push(callback);return frames.length;});
  t.after(()=>{for(const [name,descriptor] of originals){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else Reflect.deleteProperty(globalThis,name);}});
  const button={dataset:{} as Record<string,string>,offsetWidth:180,style:{setProperty(){}},querySelector:()=>({})};
  return {
    button,animation:submitMotion(button as unknown as HTMLButtonElement),
    flushFrames:()=>{while(frames.length)frames.shift()!(0);},
    flushTimers:()=>{const pending=[...timers.values()];timers.clear();pending.forEach(callback=>callback());},
    reduce:()=>{reduced=true;},
  };
}

test('fast success stays completed after pending animation frames',async t=>{
  const f=fixture(t);
  const started=f.animation.start();
  f.animation.done();
  f.flushFrames();await started;
  assert.equal(f.button.dataset.state,'done');
  f.flushTimers();f.flushTimers();
  assert.equal(f.button.dataset.state,undefined);
});

test('fast failure restores the button after pending animation frames',async t=>{
  const f=fixture(t);
  const started=f.animation.start();
  f.animation.reset();
  f.flushFrames();await started;f.flushTimers();
  assert.equal(f.button.dataset.state,undefined);
});

test('retry is not cleared by the previous failure recovery timer',async t=>{
  const f=fixture(t);
  const first=f.animation.start();f.flushFrames();await first;
  f.animation.reset();
  const retry=f.animation.start();
  f.flushTimers();
  assert.equal(f.button.dataset.state,'measure');
  f.flushFrames();await retry;
  assert.equal(f.button.dataset.state,'sending');
});

test('normal sending and success return the button to its default state',async t=>{
  const f=fixture(t);
  const started=f.animation.start();f.flushFrames();await started;
  assert.equal(f.button.dataset.state,'sending');
  f.animation.done();assert.equal(f.button.dataset.state,'done');
  f.flushTimers();f.flushTimers();
  assert.equal(f.button.dataset.state,undefined);
});

test('reduced motion skips the animated states',async t=>{
  const f=fixture(t);f.reduce();
  await f.animation.start();f.animation.done();f.flushTimers();
  assert.equal(f.button.dataset.state,undefined);
});

test('a reduced-motion preference set during startup prevents the spinner',async t=>{
  const f=fixture(t);
  const started=f.animation.start();f.reduce();f.flushFrames();await started;
  assert.equal(f.button.dataset.state,undefined);
});
