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
  campaign:{title:{label:'Headline opening',max:140},highlight:{label:'Headline emphasis',max:140},intro:{label:'Introduction',max:1000},question:{label:'Audience question',max:200},answer:{label:'Audience explanation',max:1200},projectNote:{label:'Project description',max:1200,optional:true}},
} as const;
export type ContentKind=keyof typeof editorialFields;
export function fieldsFor(kind:ContentKind){
  if(!Object.hasOwn(editorialFields,kind))throw new Error('Unsupported content type');
  return editorialFields[kind];
}
export function validateContent(kind:ContentKind,input:unknown):Record<string,string> {
  const fields=fieldsFor(kind);
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Content must be an object');
  const record=input as Record<string,unknown>;
  if(Object.keys(record).some(key=>!Object.hasOwn(fields,key)))throw new Error('Unknown content field');
  const result:Record<string,string>={};
  for(const [key,field] of Object.entries(fields)){
    if('optional' in field&&field.optional&&!Object.hasOwn(record,key))continue;
    const value=record[key];
    if(typeof value!=='string'||!value.trim()||value.length>field.max||/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))throw new Error(`Invalid ${field.label}`);
    result[key]=value.trim();
  }
  return result;
}
export function validateHomeContent(input:unknown):HomeContent{return validateContent('home',input) as HomeContent;}
