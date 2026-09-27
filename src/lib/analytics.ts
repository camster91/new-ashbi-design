import {knownCampaign,knownProject,serviceOptions} from './enquiry.ts';

export function briefLinkContext(href:string,origin:string){
  let url:URL;
  try{url=new URL(href,origin);}catch{return null;}
  if(url.origin!==origin||url.pathname!=='/contact/'||url.hash!=='#project-brief')return null;
  const service=url.searchParams.get('service')||'';
  return {
    service:serviceOptions.some(option=>option===service)?service:undefined,
    campaign:knownCampaign(url.searchParams.get('campaign'))||undefined,
    project:knownProject(url.searchParams.get('project'))||undefined,
  };
}
