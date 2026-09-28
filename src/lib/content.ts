import {projectAsset} from './editorial-assets.ts';
/** Plain-text editorial fields. Layouts, links, pricing and claims need source review. */
export const homeFields = {
  heroEyebrow:{label:'Hero label',max:120},
  heroIntro:{label:'Hero introduction',max:400},
  workIntro:{label:'Selected work introduction',max:400},
  servicesIntro:{label:'Services introduction',max:600},
  studioIntro:{label:'Studio introduction',max:1000},
} as const;
export type HomeContent = Record<keyof typeof homeFields,string>;
export const editorialFields={
  home:homeFields,
  service:{summary:{label:'Introduction',max:600},fit:{label:'Who this suits',max:600}},
  project:{cardAsset:{label:"Project card image",max:100,asset:true},heroAsset:{label:"Case-study image",max:100,asset:true},intro:{label:"Introduction",max:600},context:{label:"Context",max:1600,optional:true},approach:{label:"Approach",max:1600},outcome:{label:"Supported outcome",max:1600}},
  article:{title:{label:"Title",max:200},shortTitle:{label:"Card title",max:120,optional:true},summary:{label:"Summary",max:1000},body:{label:"Article body",max:50000,rich:true}},
  campaign:{title:{label:'Headline opening',max:140},highlight:{label:'Headline emphasis',max:140},intro:{label:'Introduction',max:1000},question:{label:'Audience question',max:200},answer:{label:'Audience explanation',max:1200},projectNote:{label:'Project description',max:1200,optional:true}},
} as const;
export type ContentKind=keyof typeof editorialFields;
export function fieldsFor(kind:ContentKind){
  if(!Object.hasOwn(editorialFields,kind))throw new Error('Unsupported content type');
  return editorialFields[kind];
}
export function validateContent(kind:ContentKind,input:unknown,documentId?:string):Record<string,string> {
  const fields=fieldsFor(kind);
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Content must be an object');
  const record=input as Record<string,unknown>;
  if(Object.keys(record).some(key=>!Object.hasOwn(fields,key)))throw new Error('Unknown content field');
  const result:Record<string,string>={};
  for(const [key,field] of Object.entries(fields)){
    if('optional' in field&&field.optional&&!Object.hasOwn(record,key))continue;
    const value=record[key];
    if(typeof value!=='string'||!value.trim()||value.length>field.max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))throw new Error(`Invalid ${field.label}`);
    if('asset' in field)projectAsset(documentId||'',value);
    if('rich' in field&&field.rich)validateArticleBody(value);
    else if(/[<>]/.test(value))throw new Error(`Invalid ${field.label}`);
    result[key]=value.trim();
  }
  return result;
}
export function validateHomeContent(input:unknown):HomeContent{return validateContent('home',input) as HomeContent;}

/** Only balanced editorial markup, with existing reference hosts. No scripts, styles or media. */
export function validateArticleBody(body:string){
 const stack:string[]=[];
 const allowed=['p','h2','h3','ul','ol','li','strong','em','a'];
 const hosts=['help.elements.envato.com','support.strikingly.com','www.safetydetectives.com'];
 let cursor=0;
 for(const match of body.matchAll(/<[^>]*>/g)){
  if(/[<>]/.test(body.slice(cursor,match.index)))throw new Error('Invalid article markup');
  const token=match[0];const tag=token.match(/^<(\/?)([a-z0-9]+)([^>]*)>$/);
  if(!tag||!allowed.includes(tag[2]))throw new Error('Unsupported article formatting');
  const [,closing,name,attributes]=tag;
  if(closing){if(attributes||stack.pop()!==name)throw new Error('Unbalanced article formatting');}
  else {
   if(name==='a'){
    const href=attributes.match(/^ href="(https:\/\/[^"<>\s]+)"$/)?.[1];
    if(!href)throw new Error('Invalid article reference');
    const url=new URL(href);if(!hosts.includes(url.hostname)||url.username||url.password||url.port)throw new Error('Unapproved reference host');
   }else if(attributes)throw new Error('Formatting attributes are not allowed');
   stack.push(name);
  }
  cursor=match.index!+token.length;
 }
 if(stack.length||/[<>]/.test(body.slice(cursor)))throw new Error('Unbalanced article formatting');
 return body;
}
