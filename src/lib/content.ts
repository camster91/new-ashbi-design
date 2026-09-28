/** Plain-text editorial fields. Layouts, links, pricing and claims need source review. */
export const homeFields = {
  heroEyebrow:{label:'Hero label',max:120},
  heroIntro:{label:'Hero introduction',max:400},
  workIntro:{label:'Selected work introduction',max:400},
  servicesIntro:{label:'Services introduction',max:600},
  studioIntro:{label:'Studio introduction',max:1000},
} as const;
export type HomeContent = Record<keyof typeof homeFields,string>;
export function validateHomeContent(input:unknown):HomeContent {
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Content must be an object');
  const record=input as Record<string,unknown>;
  if(Object.keys(record).some(key=>!Object.hasOwn(homeFields,key)))throw new Error('Unknown content field');
  const result={} as HomeContent;
  for(const [key,field] of Object.entries(homeFields)){
    const value=record[key];
    if(typeof value!=='string'||!value.trim()||value.length>field.max||/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))throw new Error(`Invalid ${field.label}`);
    result[key as keyof HomeContent]=value.trim();
  }
  return result;
}
