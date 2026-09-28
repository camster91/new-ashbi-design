import {readFile,realpath,stat} from 'node:fs/promises';
import path from 'node:path';
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.avif':'image/avif','.woff2':'font/woff2','.woff':'font/woff'};
/** Static editorial layout review. Scripts, forms, frames and outbound requests are blocked. */
export async function previewAsset({directory,id,pathname}){
 const prefix=`/admin/content/preview/${id}`;
 if(!/^[a-f0-9-]{36}$/.test(id)||!pathname.startsWith(prefix+'/'))return null;
 let relative;
 try{relative=decodeURIComponent(pathname.slice(prefix.length));}catch{return null;}
 if(relative.includes('\\')||/[\u0000-\u001f]/.test(relative)||relative.split('/').some(segment=>segment==='..'||segment==='.'||segment.startsWith('.')))return null;
 const root=await realpath(path.join(directory,'dist'));
 let file=path.join(root,relative);
 try{
  if((await stat(file)).isDirectory())file=path.join(file,'index.html');
  file=await realpath(file);if(!file.startsWith(root+path.sep))return null;
  const extension=path.extname(file);if(!types[extension])return null;
  const bytes=await readFile(file);let body=bytes;
  if(extension==='.html'){
   let html=bytes.toString('utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<meta\b[^>]*http-equiv\s*=\s*["']?refresh[^>]*>/gi,'');
   html=html.replace(/\b(href|src|action)=(['"])\/(?!\/)/g,(_match,attr,quote)=>`${attr}=${quote}${prefix}/`);
   html=html.replace('</head>',"<style>html{scroll-behavior:auto!important}*,*:before,*:after{animation:none!important;transition:none!important}.reveal{opacity:1!important;transform:none!important}</style></head>");
   html=html.replace('</body>',`<aside style="position:fixed;bottom:12px;left:12px;z-index:99999;background:#fff;padding:12px;border:1px solid #272b4a;border-radius:12px;font:14px system-ui">Static draft layout · Motion and submissions disabled · <a href="/admin/content/preview-status?id=${id}">Back to review</a></aside></body>`);
   body=Buffer.from(html);
  }else if(extension==='.css')body=Buffer.from(bytes.toString('utf8').replace(/url\((['"]?)\/(?!\/)/g,(_match,quote)=>`url(${quote}${prefix}/`));
  return {body,type:types[extension],headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; script-src 'none'; connect-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'; sandbox allow-same-origin"}};
 }catch(error){if(['ENOENT','ENOTDIR'].includes(error.code))return null;throw error;}
}
