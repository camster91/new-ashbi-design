import catalog from '../data/editorial-content.json';
import {validateContent,type ContentKind} from './content';

/** Reviewed build data, never live admin state. */
export function editorialContent(id:string,kind:'service'):{summary:string;fit:string};
export function editorialContent(id:string,kind:'campaign'):{title:string;highlight:string;intro:string;question:string;answer:string;projectNote?:string};
export function editorialContent(id:string,kind:'project'):{intro:string;context?:string;approach:string;outcome:string};
export function editorialContent(id:string,kind:'article'):{title:string;shortTitle?:string;summary:string;body:string};
export function editorialContent(id:string,kind:ContentKind):Record<string,string>{
  const entry=(catalog as Record<string,{kind:string;content:unknown}>)[id];
  if(!entry||entry.kind!==kind)throw new Error(`Missing editorial record: ${id}`);
  return validateContent(kind,entry.content);
}
