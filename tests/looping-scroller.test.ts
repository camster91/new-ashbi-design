import test from 'node:test';
import assert from 'node:assert/strict';
import {initLoopingScroller} from '../src/scripts/looping-scroller.ts';

test('loops continuously, holds during touch, resumes on release, and suppresses drag clicks',()=>{
 const names=['window','document','getComputedStyle','ResizeObserver','IntersectionObserver','requestAnimationFrame'];
 const originals=new Map(names.map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
 const preference=Object.assign(new EventTarget(),{matches:false});
 const windowEvents=Object.assign(new EventTarget(),{matchMedia:()=>preference,setTimeout:()=>0});
 let nextFrame:(now:number)=>void=()=>{};
 let paused=false;
 const classes=new Set<string>();
 const row=Object.assign(new EventTarget(),{
  scrollLeft:0,
  classList:{add:(name:string)=>classes.add(name),remove:(name:string)=>classes.delete(name)},
  querySelector: (selector:string)=>selector===':focus-visible'?null:{},
  matches:()=>false,
  setPointerCapture:()=>{},hasPointerCapture:()=>false,releasePointerCapture:()=>{},
 });
 const define=(name:string,value:unknown)=>Object.defineProperty(globalThis,name,{value,configurable:true,writable:true});
 const pointer=(type:string,x=200,y=100)=>Object.assign(new Event(type,{cancelable:true}),{isPrimary:true,button:0,pointerId:1,pointerType:'touch',clientX:x,clientY:y});
 try{
  define('window',windowEvents);define('document',{hidden:false});
  // Layout width must be used even when a parent is visually scaled.
  define('getComputedStyle',()=>({width:'1000'}));
  define('ResizeObserver',class{constructor(callback:()=>void){this.callback=callback}callback:()=>void;observe(){this.callback()}});
  define('IntersectionObserver',class{constructor(callback:(entries:unknown[])=>void){this.callback=callback}callback:(entries:unknown[])=>void;observe(){this.callback([{isIntersecting:true}])}});
  define('requestAnimationFrame',(callback:(now:number)=>void)=>{nextFrame=callback});
  const move=initLoopingScroller(row as unknown as HTMLElement,'.set',1,()=>paused)!;
  nextFrame(100);nextFrame(120);
  assert.equal(row.scrollLeft,1020);
  row.dispatchEvent(new Event('mouseenter'));nextFrame(140);
  assert.equal(row.scrollLeft,1040,'hover must not stop autoplay');
  row.dispatchEvent(pointer('pointerdown'));nextFrame(160);
  assert.equal(row.scrollLeft,1040,'a held touch stops autoplay');
  row.dispatchEvent(pointer('pointermove',100));
  assert.equal(row.scrollLeft,1140,'horizontal touch moves the row');
  windowEvents.dispatchEvent(pointer('pointerup',100));nextFrame(180);
  assert.equal(row.scrollLeft,1160,'release resumes without a timeout');
  const click=new Event('click',{cancelable:true});row.dispatchEvent(click);
  assert.equal(click.defaultPrevented,true,'dragging must not follow a project link');
  assert.equal(classes.has('is-dragging'),false);
  move(400);assert.equal(row.scrollLeft,560,'forward wrap preserves overshoot');
  move(-100);assert.equal(row.scrollLeft,1460,'reverse wrap preserves overshoot');
  paused=true;nextFrame(200);assert.equal(row.scrollLeft,1460);
  paused=false;preference.matches=true;preference.dispatchEvent(new Event('change'));
  nextFrame(220);assert.equal(row.scrollLeft,0,'reduced motion disables autoplay');
  move(100);assert.equal(row.scrollLeft,100,'manual browsing remains available');
 }finally{
  for(const [name,descriptor] of originals){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else Reflect.deleteProperty(globalThis,name)}
 }
});
