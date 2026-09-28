import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {projectAsset} from '../src/lib/editorial-assets.ts';
import {validateHomeContent,validateContent} from '../src/lib/content.ts';

const normalize=text=>text.replace(/&#(?:x([a-f0-9]+)|(\d+));/gi,(_,hex,decimal)=>String.fromCodePoint(parseInt(hex||decimal,hex?16:10))).replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();

/** Check visible body text, so metadata alone cannot make this gate pass. */
export async function checkBuiltContent(root,home,catalog,{allowDraft=false}={}){
 const documents=[{route:'index.html',content:validateHomeContent(home)},...Object.entries(catalog).map(([id,entry])=>{
  const [kind,slug]=id.split(':');
  if(!/^[a-z0-9-]+$/.test(slug)||kind!==entry.kind||!['service','campaign','project','article'].includes(kind))throw new Error('Invalid editorial route');
  return {id,kind,route:`${kind==='article'?'':kind==='service'?'services/':kind==='project'?'work/':'campaigns/'}${slug}/index.html`,content:validateContent(entry.kind,entry.content,id)};
 })];
 const bodyText=async route=>{
  const html=await readFile(path.join(root,route),'utf8');
  const body=html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1];
  if(!body)throw new Error(`Missing body: ${route}`);
  if(!allowDraft&&body.includes('LOCAL DRAFT PREVIEW'))throw new Error('Draft preview cannot pass the release content gate');
  return normalize(body.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<[^>]*>/g,' '));
 };
 let checked=0;
 for(const document of documents){
  const text=await bodyText(document.route);
  for(const [field,value] of Object.entries(document.content)){
   if(document.kind==='project'&&['cardAsset','heroAsset'].includes(field)){
    const asset=projectAsset(document.id,value);
    const route=field==='cardAsset'?'work/index.html':document.route;
    const html=await readFile(path.join(root,route),'utf8');
    const placement=field==='cardAsset'?html.match(new RegExp(`<a\\b[^>]*href="/work/${document.id.split(':')[1]}/"[^>]*>[\\s\\S]*?</a>`))?.[0]:html.match(/<section\b[^>]*class="[^"]*\bproject-hero\b[^"]*"[\s\S]*?<\/section>/)?.[0];
    if(!placement?.includes(`src="${asset.src}"`))throw new Error(`Editorial asset missing: ${document.id} (${field})`);
    checked++;continue;
   }
   const fieldText=document.kind==='article'&&field==='shortTitle'?await bodyText('insights/index.html'):text;
   if(!fieldText.includes(normalize(value.replace(/<[^>]*>/g,' '))))throw new Error(`Editorial field missing from page body: ${document.route} (${field})`);
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
