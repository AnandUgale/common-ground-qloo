import {handleApi,securityHeaders} from './src/api.mjs';
import {DurableObject} from 'cloudflare:workers';
import {reserveQuota} from './src/quota.mjs';
export class QlooBudget extends DurableObject {
  async fetch(request) {
    if(request.method!=='POST'||new URL(request.url).pathname!=='/reserve')return new Response('Not found',{status:404});
    try {
      const raw=await request.text();if(raw.length>64)return new Response('Invalid reservation',{status:400});
      const {units}=JSON.parse(raw);
      const result=reserveQuota(this.ctx.storage,this.env,units);
      return new Response(JSON.stringify(result),{status:result.allowed?200:429,headers:{'content-type':'application/json','cache-control':'no-store'}});
    }catch{return new Response('Shared budget unavailable',{status:503});}
  }
}
export default {async fetch(request,env) {
  if (new URL(request.url).pathname.startsWith('/api/')) return handleApi(request,env);
  const response=await env.ASSETS.fetch(request);
  const headers=new Headers(response.headers);
  Object.entries(securityHeaders).forEach(([k,v])=>headers.set(k,v));
  return new Response(response.body,{status:response.status,headers});
}};
