import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateHomeContent,validateContent} from '../src/lib/content.ts';

const normalize=text=>text.replace(/&#(?:x([a-f0-9]+)|(\d+));/gi,(_,hex,decimal)=>String.fromCodePoint(parseInt(hex||decimal,hex?16:10))).replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();

/** Check visible body text, so metadata alone cannot make this gate pass. */
export async function checkBuiltContent(root,home,catalog){
 const documents=[{route:'index.html',content:validateHomeContent(home)},...Object.entries(catalog).map(([id,entry])=>{
  const [kind,slug]=id.split(':');
  if(!/^[a-z0-9-]+$/.test(slug)||kind!==entry.kind||!['service','campaign'].includes(kind))throw new Error('Invalid editorial route');
  return {route:`${kind==='service'?'services':'campaigns'}/${slug}/index.html`,content:validateContent(entry.kind,entry.content)};
 })];
 let checked=0;
 for(const document of documents){
  const html=await readFile(path.join(root,document.route),'utf8');
  const body=html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1];
  if(!body)throw new Error(`Missing body: ${document.route}`);
  const text=normalize(body.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<[^>]*>/g,' '));
  for(const [field,value] of Object.entries(document.content)){
   if(!text.includes(normalize(value)))throw new Error(`Editorial field missing from page body: ${document.route} (${field})`);
   checked++;
  }
 }
 return {pages:documents.length,fields:checked};
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
 const home=JSON.parse(await readFile(new URL('../src/data/home-content.json',import.meta.url),'utf8'));
 const catalog=JSON.parse(await readFile(new URL('../src/data/editorial-content.json',import.meta.url),'utf8'));
 const result=await checkBuiltContent(process.argv[2]||'dist',home,catalog);
 process.stdout.write(`Checked ${result.fields} CMS fields in ${result.pages} built page bodies.\n`);
}
