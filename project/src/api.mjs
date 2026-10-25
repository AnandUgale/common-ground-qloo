import {FlowError,runAgent,validateInput} from './core.mjs';
import {fixtureAdapter,fixtureScenarios} from './fixtures.mjs';
import {qlooAdapter} from './qloo.mjs';
import {sharedQuotaReady,reserveLiveRun} from './quota.mjs';
import {boundedText} from './http.mjs';
export const securityHeaders = {'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer',
  'content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"};
const json = (body,status=200)=>new Response(JSON.stringify(body),{status,headers:{...securityHeaders,'content-type':'application/json; charset=utf-8'}});
export async function handleApi(request,env={}) {
  const path=new URL(request.url).pathname;
  if (path==='/api/status' && request.method==='GET') return json({liveEnabled:env.QLOO_LIVE_ENABLED==='true' && env.QLOO_CONTRACT_VERIFIED==='true' && Boolean(env.QLOO_API_KEY) && sharedQuotaReady(env),liveValidated:env.QLOO_CONTRACT_VERIFIED==='true',quotaConfigured:sharedQuotaReady(env),fixtures:fixtureScenarios});
  if (path!=='/api/plan') return json({message:'Not found'},404);
  if (request.method!=='POST') return json({message:'Use POST'},405);
  const origin=request.headers.get('origin');
  if (origin && origin!==new URL(request.url).origin) return json({message:'Cross-origin requests are not accepted'},403);
  if ((request.headers.get('content-type')??'').split(';')[0].trim().toLowerCase()!=='application/json') return json({message:'Use application/json'},415);
  try {
    const body=await boundedText(request,4096,'request_too_large');
    let raw;
    try {raw=JSON.parse(body);} catch {return json({message:'Invalid JSON'},400);}
    const input=validateInput(raw);
    if (raw.scenario!==undefined && !fixtureScenarios.includes(raw.scenario)) return json({message:'Unknown fixture scenario'},400);
    if(input.mode==='live' && env.QLOO_LIVE_ENABLED==='true' && env.QLOO_CONTRACT_VERIFIED==='true' && env.QLOO_API_KEY)
      await reserveLiveRun(env,input.people.length,request.signal);
    const adapter=input.mode==='live'?qlooAdapter(env,fetch,request.signal):fixtureAdapter(raw.scenario??'overlap');
    return json(await runAgent(input,adapter,{signal:request.signal}));
  } catch(error) {
    const code=error instanceof FlowError?error.code:'invalid_request';
    const status=code==='request_too_large'?413:code==='quota_exhausted'?429:code.startsWith('quota_')?503:400;
    return json({code,message:error instanceof FlowError?error.message:'Request could not be completed'},status);
  }
}
