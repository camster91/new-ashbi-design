import {createHash,randomUUID} from 'node:crypto';
import {mkdir,readFile,writeFile,rename,rm} from 'node:fs/promises';
import path from 'node:path';
import {validateHomeContent} from '../src/lib/content.ts';

const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
/** Website editorial state only. Hub remains owner of clients/projects/portals. */
export function createContentStore({directory,base,now=()=>new Date().toISOString()}){
  const initial=validateHomeContent(base);
  const baseRevision=hash(initial);
  const file=path.join(directory,'home.json');
  let state={version:1,baseRevision,revision:baseRevision,status:'draft',content:initial,updatedAt:null,approvedAt:null};
  let queue=Promise.resolve();
  const persist=async next=>{
    const temp=`${file}.${randomUUID()}.tmp`;
    try{
      await writeFile(temp,JSON.stringify(next,null,2),{flag:'wx',mode:0o600});
      await rename(temp,file);
      state=next;
    }finally{await rm(temp,{force:true});}
  };
  const change=(revision,fn)=>{
    const job=queue.then(async()=>{
      if(revision!==state.revision)throw new Error('This draft changed. Reload before saving.');
      if(state.baseRevision!==baseRevision)throw new Error('The website source changed. Reconcile this draft first.');
      await persist(fn(structuredClone(state)));
      return structuredClone(state);
    });
    queue=job.catch(()=>{});
    return job;
  };
  return {
    async init(){
      await mkdir(directory,{recursive:true,mode:0o700});
      try{
        const saved=JSON.parse(await readFile(file,'utf8'));
        if(saved.version!==1||!['draft','approved'].includes(saved.status)||typeof saved.revision!=='string'||typeof saved.baseRevision!=='string')throw new Error('Invalid content state');
        validateHomeContent(saved.content);
        state=saved;
      }catch(error){if(error.code!=='ENOENT')throw error;}
    },
    get(){return {...structuredClone(state),sourceChanged:state.baseRevision!==baseRevision};},
    save(content,revision){
      const validated=validateHomeContent(content);
      return change(revision,previous=>({...previous,content:validated,revision:randomUUID(),status:'draft',updatedAt:now(),approvedAt:null}));
    },
    approve(revision){return change(revision,previous=>({...previous,revision:randomUUID(),status:'approved',approvedAt:now()}));},
    export(){
      if(state.status!=='approved'||state.baseRevision!==baseRevision)throw new Error('Approve a current draft before exporting');
      return {version:1,type:'ashbi-home',baseRevision:state.baseRevision,revision:state.revision,approvedAt:state.approvedAt,content:structuredClone(state.content)};
    },
  };
}
