import {randomUUID} from 'node:crypto';
import {mkdir,rm} from 'node:fs/promises';
import path from 'node:path';
/** Single trusted build at a time. Callers supply only a saved editorial snapshot. */
export function createPreviewQueue({directory,build,maxJobs=8,ttlMs=30*60*1000,now=Date.now}){
 const jobs=new Map();let active=false,closed=false,inFlight=Promise.resolve();
 const view=job=>({id:job.id,documentId:job.snapshot.documentId,revision:job.snapshot.revision,status:job.status,createdAt:job.createdAt,...(job.route?{route:job.route}:{})});
 const valid=snapshot=>snapshot?.version===1&&snapshot.type==='ashbi-draft'&&/^(home|(?:service|campaign|project|article):[a-z0-9-]+)$/.test(snapshot.documentId)&&/^(?:[a-f0-9]{64}|[a-f0-9-]{36})$/.test(snapshot.revision);
 async function expire(){
  for(const [id,job] of jobs)if(['ready','failed'].includes(job.status)&&now()-job.finishedAt>=ttlMs){await rm(job.directory,{recursive:true,force:true});jobs.delete(id);}
 }
 async function drain(){
  if(active||closed)return;active=true;
  try{
   for(const job of jobs.values()){
    if(closed||job.status!=='queued')continue;
    job.status='building';
    try{const result=await build({snapshot:structuredClone(job.snapshot),directory:job.directory});job.route=result.route;job.status='ready';}
    catch{job.status='failed';} // Never expose compiler logs or private paths to the admin page.
    job.finishedAt=now();
   }
  }finally{active=false;}
 }
 let operations=Promise.resolve();
 return {
  async init(){await mkdir(directory,{recursive:true,mode:0o700});},
  request(snapshot){
   const operation=operations.then(async()=>{
    if(closed||!valid(snapshot))throw new Error('Preview unavailable');
    await expire();
    const existing=[...jobs.values()].find(job=>job.snapshot.documentId===snapshot.documentId&&job.snapshot.revision===snapshot.revision&&job.snapshot.baseRevision===snapshot.baseRevision&&job.status!=='failed');
    if(existing)return view(existing);
    if(jobs.size>=maxJobs)throw new Error('Preview capacity reached; wait for earlier previews to expire');
    const id=randomUUID(),job={id,snapshot:structuredClone(snapshot),directory:path.join(directory,id),status:'queued',createdAt:now(),finishedAt:0};jobs.set(id,job);
    if(!active)inFlight=drain();return view(job);
   });operations=operation.catch(()=>{});return operation;
  },
  get(id){const job=jobs.get(id);if(!job||['ready','failed'].includes(job.status)&&now()-job.finishedAt>=ttlMs)return null;return view(job);},
  /** Directory is internal, never derived from a route or form input. */
  artifact(id){const job=jobs.get(id);return this.get(id)?.status==='ready'?job.directory:null;},
  idle(){return inFlight;},
  close(){closed=true;},
 };
}
