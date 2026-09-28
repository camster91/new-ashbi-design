import {createHash,randomUUID} from 'node:crypto';
import {mkdir,readFile,writeFile,rename,rm,readdir} from 'node:fs/promises';
import path from 'node:path';
import {validateContent} from '../src/lib/content.ts';

const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
/** Website editorial state only. Hub remains owner of clients/projects/portals. */
export function createContentStore({directory,base,id='home',kind=/** @type {import('../src/lib/content.ts').ContentKind} */ ('home'),now=()=>new Date().toISOString()}){
  if(!/^(home|(?:service|campaign|project|article):[a-z0-9-]+)$/.test(id))throw new Error('Unsupported document ID');
  const validate=input=>validateContent(kind,input);
  const initial=validate(base);
  const baseRevision=hash(initial);
  const file=path.join(directory,`${id.replace(':','-')}.json`);
  const historyDir=path.join(directory,`${id.replace(':','-')}-history`);
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
      // Preserve the prior revision before changing the current draft.
      await mkdir(historyDir,{recursive:true,mode:0o700});
      const archive=path.join(historyDir,`${state.revision}.json`);
      try{await writeFile(archive,JSON.stringify(state),{flag:'wx',mode:0o600});}catch(error){if(error.code!=='EEXIST')throw error;}
      await persist(await fn(structuredClone(state)));
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
        if(saved.version!==1||!['draft','approved'].includes(saved.status)||!/^(?:[a-f0-9]{64}|[a-f0-9-]{36})$/.test(saved.revision)||!/^[a-f0-9]{64}$/.test(saved.baseRevision))throw new Error('Invalid content state');
        validate(saved.content);
        state=saved;
      }catch(error){if(error.code!=='ENOENT')throw error;}
    },
    get(){return {...structuredClone(state),sourceChanged:state.baseRevision!==baseRevision};},
    save(content,revision){
      const validated=validate(content);
      return change(revision,previous=>({...previous,content:validated,revision:randomUUID(),status:'draft',updatedAt:now(),approvedAt:null}));
    },
    approve(revision){return change(revision,previous=>({...previous,revision:randomUUID(),status:'approved',approvedAt:now()}));},
    /** @returns {Promise<Array<{revision:string,updatedAt:string|null,status:string,content:Record<string,string>}>>} */
    async history(){
      const names=await readdir(historyDir).catch(error=>{if(error.code==='ENOENT')return [];throw error;});
      const records=await Promise.all(names.filter(name=>/^(?:[a-f0-9]{64}|[a-f0-9-]{36})\.json$/.test(name)).map(async name=>{
        const record=JSON.parse(await readFile(path.join(historyDir,name),'utf8'));
        validate(record.content);
        return {revision:record.revision,updatedAt:record.updatedAt,status:record.status,content:record.content};
      }));
      return records.sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||''))).slice(0,20);
    },
    restore(revision,currentRevision){
      if(!/^(?:[a-f0-9]{64}|[a-f0-9-]{36})$/.test(revision))return Promise.reject(new Error('Invalid revision'));
      return change(currentRevision,async previous=>{
        const archived=JSON.parse(await readFile(path.join(historyDir,`${revision}.json`),'utf8'));
        if(archived.baseRevision!==baseRevision)throw new Error('Revision has a different source baseline');
        return {...previous,content:validate(archived.content),revision:randomUUID(),status:'draft',updatedAt:now(),approvedAt:null};
      });
    },
    export(){
      if(state.status!=='approved'||state.baseRevision!==baseRevision)throw new Error('Approve a current draft before exporting');
      return {version:1,type:id==='home'?'ashbi-home':'ashbi-document',...(id==='home'?{}:{documentId:id,kind}),baseRevision:state.baseRevision,revision:state.revision,approvedAt:state.approvedAt,content:structuredClone(state.content)};
    },
  };
}

export async function createEditorialStores({directory,home,catalog}){
  /** @type {Record<string,{label:string,kind:import('../src/lib/content.ts').ContentKind,store:ReturnType<typeof createContentStore>}>} */
  const documents={home:{label:'Homepage copy',kind:'home',store:createContentStore({directory,base:home})}};
  for(const [id,entry] of Object.entries(catalog)){
    if(!['service','campaign','project','article'].includes(entry.kind)||!id.startsWith(`${entry.kind}:`))throw new Error('Invalid editorial catalog');
    documents[id]={label:entry.label,kind:entry.kind,store:createContentStore({directory,base:entry.content,id,kind:entry.kind})};
  }
  await Promise.all(Object.values(documents).map(document=>document.store.init()));
  return documents;
}
