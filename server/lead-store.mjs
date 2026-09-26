import {randomUUID} from 'node:crypto';
import {mkdir,open,rename,readFile,unlink,readdir,stat,link} from 'node:fs/promises';
import path from 'node:path';
import {encryptConfig,decryptConfig} from './state.mjs';

// Single-instance private store. No brief contents enter filenames or logs.
export function createLeadStore({directory,key,now=()=>new Date()}) {
  const fileFor=id=>{
    if(!/^[0-9a-f-]{36}$/.test(id))throw new Error('Invalid lead identifier');
    return path.join(directory,`${id}.json`);
  };
  async function write(record,exclusive=false){
    const file=fileFor(record.id), temporary=`${file}.${randomUUID()}.tmp`;
    try{
      const handle=await open(temporary,'wx',0o600);
      try{await handle.writeFile(encryptConfig(record,key),'utf8');await handle.sync();}
      finally{await handle.close();}
      if(exclusive)await link(temporary,file);
      else await rename(temporary,file);
    }finally{await unlink(temporary).catch(()=>{});}
  }

  return {
    async init(){await mkdir(directory,{recursive:true,mode:0o700});},
    async create(brief){
      const record={id:randomUUID(),createdAt:now().toISOString(),status:'pending',brief};
      await write(record);return record.id;
    },
    async reserve(brief,id){
      const record={id,createdAt:now().toISOString(),status:'pending',brief};
      try{await write(record,true);return {record,created:true};}
      catch(error){
        if(error.code!=='EEXIST')throw error;
        const existing=await this.read(id);
        if(JSON.stringify(existing.brief)!==JSON.stringify(brief))throw new Error('Submission identifier already used');
        return {record:existing,created:false};
      }
    },
    async list(){
      const names=(await readdir(directory)).filter(name=>/^[0-9a-f-]{36}\.json$/.test(name));
      const files=await Promise.all(names.map(async name=>({name,time:(await stat(path.join(directory,name))).mtimeMs})));
      files.sort((a,b)=>b.time-a.time);
      return Promise.all(files.slice(0,100).map(file=>this.read(file.name.replace('.json',''))));
    },
    async read(id){return decryptConfig(await readFile(fileFor(id),'utf8'),key);},
    async mark(id,status){
      if(!['accepted-by-mailgun','delivery-failed'].includes(status))throw new Error('Invalid delivery status');
      const record=await this.read(id);
      await write({...record,status,updatedAt:now().toISOString()});
    },
  };
}

export function persistThenDeliver(leads,send){
  return async (brief,id=randomUUID())=>{
    const reservation=await leads.reserve(brief,id);
    if(!reservation.created){
      if(reservation.record.status==='accepted-by-mailgun')return;
      // A timeout can mean Mailgun accepted the message. Never blindly resend.
      throw new Error('Delivery requires review');
    }
    try{await send(brief);}
    catch(error){await leads.mark(id,'delivery-failed');throw error;}
    await leads.mark(id,'accepted-by-mailgun');
  };
}
