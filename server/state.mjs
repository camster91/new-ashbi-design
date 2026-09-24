import {randomBytes, createCipheriv, createDecipheriv, scrypt as scryptCallback, timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {mkdir, readFile, writeFile, rename, chmod} from 'node:fs/promises';
import path from 'node:path';

const scrypt=promisify(scryptCallback);
const emptyState=()=>({password:null, mailgun:null, enabled:false, lastTestAt:null, configRevision:null});

export function encryptionKey(value){
  const key=Buffer.from(value||'','base64');
  if(key.length!==32 || key.toString('base64')!==value)throw new Error('CONFIG_ENCRYPTION_KEY must be 32 random bytes encoded as base64');
  return key;
}

export function encryptConfig(config,key){
  const iv=randomBytes(12);
  const cipher=createCipheriv('aes-256-gcm',key,iv);
  const ciphertext=Buffer.concat([cipher.update(JSON.stringify(config),'utf8'),cipher.final()]);
  return [iv,cipher.getAuthTag(),ciphertext].map(part=>part.toString('base64')).join('.');
}

export function decryptConfig(value,key){
  const parts=value.split('.').map(part=>Buffer.from(part,'base64'));
  if(parts.length!==3||parts[0].length!==12||parts[1].length!==16)throw new Error('Invalid encrypted settings');
  const decipher=createDecipheriv('aes-256-gcm',key,parts[0]);
  decipher.setAuthTag(parts[1]);
  return JSON.parse(Buffer.concat([decipher.update(parts[2]),decipher.final()]).toString('utf8'));
}

export async function hashPassword(password){
  if(typeof password!=='string'||password.length<16||password.length>128)throw new Error('Password must contain 16 to 128 characters');
  const salt=randomBytes(16);
  const hash=await scrypt(password,salt,64);
  return `${salt.toString('base64')}.${hash.toString('base64')}`;
}

export async function verifyPassword(password,stored){
  const [saltText,hashText]=(stored||'').split('.');
  const salt=saltText?Buffer.from(saltText,'base64'):Buffer.alloc(16);
  const expected=hashText?Buffer.from(hashText,'base64'):Buffer.alloc(64);
  if(salt.length!==16||expected.length!==64)return false;
  const actual=await scrypt(String(password),salt,64);
  return timingSafeEqual(actual,expected)&&Boolean(stored);
}

export function createStateStore({file,key}){
  let current=emptyState();
  let queue=Promise.resolve();
  return {
    async init(){
      await mkdir(path.dirname(file),{recursive:true,mode:0o700});
      try{
        const raw=JSON.parse(await readFile(file,'utf8'));
        current={password:raw.password||null,mailgun:raw.mailgun?decryptConfig(raw.mailgun,key):null,enabled:raw.enabled===true,lastTestAt:raw.lastTestAt||null,configRevision:raw.configRevision||null};
      }catch(error){if(error.code!=='ENOENT')throw error;}
    },
    get(){return structuredClone(current);},
    update(change){
      const job=queue.then(async()=>{
        const next=structuredClone(current);
        await change(next);
        const stored={password:next.password,mailgun:next.mailgun?encryptConfig(next.mailgun,key):null,enabled:next.enabled,lastTestAt:next.lastTestAt,configRevision:next.configRevision};
        const temporary=`${file}.${randomBytes(6).toString('hex')}.tmp`;
        await writeFile(temporary,JSON.stringify(stored),{mode:0o600,flag:'wx'});
        await chmod(temporary,0o600);
        await rename(temporary,file);
        current=next;
        return structuredClone(next);
      });
      queue=job.catch(()=>{});
      return job;
    },
  };
}
