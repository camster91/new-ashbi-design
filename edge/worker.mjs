const PAGES_ORIGIN='https://ashbi-design.pages.dev';
const PUBLIC_HOST='www.ashbi.ca';
export async function handleRequest(request,transport=fetch){
  const url=new URL(request.url);
  if(!['ashbi.ca',PUBLIC_HOST].includes(url.hostname))return new Response('Not found',{status:404});
  if(url.protocol!=='https:'||url.hostname!==PUBLIC_HOST){
    url.protocol='https:';url.hostname=PUBLIC_HOST;url.port='';
    return Response.redirect(url.href,308);
  }
  const gateway=url.pathname==='/admin'||url.pathname.startsWith('/admin/')||url.pathname==='/api'||url.pathname.startsWith('/api/')||url.pathname==='/health';
  if(!gateway&&!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
  try{
    if(gateway){
      // Route subrequests go to the existing DNS origin, preserving sessions and Origin checks.
      const upstream=await transport(request);
      const response=new Response(upstream.body,upstream);
      response.headers.set('Cache-Control','no-store');
      response.headers.set('X-Ashbi-Hosting','vps-gateway');
      return response;
    }
    const target=new URL(url.pathname,PAGES_ORIGIN);
    const headers=new Headers();
    for(const name of ['accept','accept-encoding','if-none-match','if-modified-since','range','if-range']){
      const value=request.headers.get(name);if(value)headers.set(name,value);
    }
    const upstream=await transport(new Request(target,{method:request.method,headers,redirect:'manual'}));
    const response=new Response(upstream.body,upstream);
    response.headers.delete('Set-Cookie');
    // Pages applies noindex to deployment URLs; the public site's page-level policies remain in HTML.
    response.headers.delete('X-Robots-Tag');
    response.headers.set('X-Content-Type-Options','nosniff');
    response.headers.set('Referrer-Policy','strict-origin-when-cross-origin');
    response.headers.set('X-Ashbi-Hosting','cloudflare-pages');
    const location=response.headers.get('Location');
    if(location){
      const redirect=new URL(location,target);
      if(redirect.origin===PAGES_ORIGIN){redirect.hostname=PUBLIC_HOST;redirect.search=url.search;response.headers.set('Location',redirect.href);}
    }
    return response;
  }catch{
    return new Response('Temporarily unavailable. Please try again.',{status:502,headers:{'Cache-Control':'no-store','Content-Type':'text/plain; charset=utf-8'}});
  }
}
export default {fetch:request=>handleRequest(request)};
