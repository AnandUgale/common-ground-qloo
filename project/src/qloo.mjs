import {MOVIE, FlowError} from './core.mjs';
import {boundedText} from './http.mjs';
const BASE = 'https://hackathon.api.qloo.com';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Documented envelopes; entity field mapping still requires authenticated validation.
export function normalizeQloo(list) {
  if (!Array.isArray(list)) throw new FlowError('invalid_response','Qloo returned an unexpected response envelope.');
  return list.map(e => {
    if (!e || !UUID.test(e.entity_id ?? '') || typeof e.name !== 'string' || !Array.isArray(e.types) || !e.types.includes(MOVIE))
      throw new FlowError('invalid_response','Qloo movie fields could not be verified. Live response mapping needs review.');
    return {id:e.entity_id,name:e.name,type:MOVIE};
  });
}
export function qlooAdapter(env, fetcher = fetch, signal) {
  let calls = 0;
  const get = async (path, params) => {
    if (env.QLOO_LIVE_ENABLED !== 'true' || !env.QLOO_API_KEY) throw new FlowError('live_disabled','Live Qloo is unavailable. An approved server-side key and explicit live enablement are required.');
    if (env.QLOO_CONTRACT_VERIFIED !== 'true') throw new FlowError('live_contract_unverified','Live results are locked until authenticated field, type and ordering checks are recorded.');
    if (signal?.aborted) throw new FlowError('cancelled','This run was cancelled.');
    if (++calls > 6) throw new FlowError('call_budget','This run reached its six-call limit.');
    const url = new URL(path,BASE);
    Object.entries(params).forEach(([k,v])=>url.searchParams.set(k,String(v)));
    let response;
    const timeout=AbortSignal.timeout(8000);
    try { response = await fetcher(url,{headers:{'X-Api-Key':env.QLOO_API_KEY,accept:'application/json'},signal:signal?AbortSignal.any([signal,timeout]):timeout,redirect:'error'}); }
    catch { if(signal?.aborted)throw new FlowError('cancelled','This run was cancelled.');throw new FlowError('transport_error','Qloo did not respond within the allowed request. No substitute result was generated.'); }
    if (response.status === 401 || response.status === 403) throw new FlowError('access_denied','Qloo rejected access. Check the approved key and hackathon environment privately.');
    if (response.status === 429) throw new FlowError('rate_limited','Qloo rate limit reached. Please wait before trying again.');
    if (response.status === 404 && path === '/search') return {success:true,results:[]};
    if (!response.ok) throw new FlowError('upstream_error','Qloo could not complete this request.');
    const text = await boundedText(response,1000000,'invalid_response');
    let body;
    try { body = JSON.parse(text); } catch { throw new FlowError('invalid_response','Qloo returned invalid JSON.'); }
    if (body.success !== true) throw new FlowError('invalid_response','Qloo did not confirm a successful response.');
    return body;
  };
  return {mode:'live',source:'Qloo live mode — data availability is shown by the result state',requestCount:()=>calls,
    async search(query) { const body=await get('/search',{query,types:MOVIE,take:5});return normalizeQloo(body.results); },
    async candidates(id,take) {
      if (!UUID.test(id)) throw new FlowError('invalid_choice','A resolved Qloo entity ID is required.');
      const body=await get('/v2/insights',{'filter.type':MOVIE,'signal.interests.entities':id,take});
      return normalizeQloo(body.results?.entities);
    }};
}
