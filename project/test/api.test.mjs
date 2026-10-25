import test from 'node:test';
import assert from 'node:assert/strict';
import {qlooAdapter,normalizeQloo} from '../src/qloo.mjs';
import {handleApi} from '../src/api.mjs';
import {MOVIE} from '../src/core.mjs';
const id='11111111-1111-4111-8111-111111111111';
const syntheticWireMovie={entity_id:id,name:'Invented contract movie',types:[MOVIE]};
const env={QLOO_LIVE_ENABLED:'true',QLOO_CONTRACT_VERIFIED:'true',QLOO_API_KEY:'synthetic-test-secret'};
const json=body=>new Response(JSON.stringify(body),{headers:{'content-type':'application/json'}});
test('live requires both explicit enablement and an approved key',async()=>{
  for(const setup of [{},{QLOO_API_KEY:'synthetic'},{QLOO_LIVE_ENABLED:'true'}]){
    let calls=0;const adapter=qlooAdapter(setup,()=>{calls++;});await assert.rejects(adapter.search('test'),e=>e.code==='live_disabled');assert.equal(calls,0);
  }
});
test('Qloo requests use exact documented paths, movie URN and header-only key',async()=>{
  const calls=[];const adapter=qlooAdapter(env,async(url,options)=>{calls.push({url,options});return url.pathname==='/search'?json({success:true,results:[syntheticWireMovie]}):json({success:true,results:{entities:[syntheticWireMovie]}});});
  assert.equal((await adapter.search('A & B'))[0].id,id);await adapter.candidates(id,20);
  assert.equal(calls[0].url.origin,'https://hackathon.api.qloo.com');assert.equal(calls[0].url.searchParams.get('query'),'A & B');assert.equal(calls[0].url.searchParams.get('types'),MOVIE);
  assert.equal(calls[1].url.pathname,'/v2/insights');assert.equal(calls[1].url.searchParams.get('filter.type'),MOVIE);assert.equal(calls[1].url.searchParams.get('signal.interests.entities'),id);
  for(const call of calls){assert.equal(call.options.headers['X-Api-Key'],env.QLOO_API_KEY);assert.ok(!call.url.href.includes(env.QLOO_API_KEY));assert.equal(call.options.redirect,'error');}
});
test('malformed or nonmovie Qloo entities are rejected',()=>{
  for(const list of [undefined,[{}],[{...syntheticWireMovie,types:['urn:entity:place']}],[{...syntheticWireMovie,entity_id:'unresolved-name'}]])assert.throws(()=>normalizeQloo(list));
});
test('access failures and rate limits stop without leaking response body',async()=>{
  for(const [status,code] of [[401,'access_denied'],[403,'access_denied'],[429,'rate_limited'],[500,'upstream_error']]){
    const adapter=qlooAdapter(env,async()=>new Response('private upstream details '+env.QLOO_API_KEY,{status}));
    await assert.rejects(adapter.search('x'),error=>error.code===code&&!error.message.includes(env.QLOO_API_KEY));
  }
});
test('six-call ceiling prevents retry loops',async()=>{
  let calls=0;const adapter=qlooAdapter(env,async()=>{calls++;return json({success:true,results:[]});});
  for(let i=0;i<6;i++)await adapter.search('x');await assert.rejects(adapter.search('x'),e=>e.code==='call_budget');assert.equal(calls,6);
});
test('404 search is no-match; malformed JSON is unavailable',async()=>{
  const missing=qlooAdapter(env,async()=>new Response('',{status:404}));assert.deepEqual(await missing.search('x'),[]);
  const malformed=qlooAdapter(env,async()=>new Response('invalid'));await assert.rejects(malformed.search('x'),e=>e.code==='invalid_response');
});
test('status discloses readiness, never credentials',async()=>{
  const res=await handleApi(new Request('http://localhost/api/status'),env);const text=await res.text();assert.ok(!text.includes(env.QLOO_API_KEY));assert.equal(JSON.parse(text).liveValidated,true);
  const disabled=await (await handleApi(new Request('http://localhost/api/status'))).json();assert.equal(disabled.liveEnabled,false);
});
test('API rejects other origins, unsupported types and excessive bodies',async()=>{
  const req=(body,headers)=>new Request('http://localhost/api/plan',{method:'POST',body,headers});
  assert.equal((await handleApi(req('{}',{'origin':'https://other.example','content-type':'application/json'}))).status,403);
  assert.equal((await handleApi(req('{}',{'content-type':'text/plain'}))).status,415);
  assert.equal((await handleApi(req('x'.repeat(4097),{'content-type':'application/json'}))).status,413);
  assert.equal((await handleApi(req('{',{'content-type':'application/json'}))).status,400);
});
test('API returns labeled fixtures and unavailable live flow separately',async()=>{
  const request=mode=>new Request('http://localhost/api/plan',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({mode,people:[{query:'Aurora'},{query:'Mariner'}]})});
  const fixture=await (await handleApi(request('fixture'))).json();assert.equal(fixture.state,'complete');assert.equal(fixture.kind,'fixture');assert.match(fixture.source,/Synthetic/);
  const live=await (await handleApi(request('live'))).json();assert.equal(live.state,'unavailable');assert.equal(live.kind,'error');assert.equal(live.code,'live_disabled');assert.equal(live.rows,undefined);
});
test('configured key cannot bypass unverified live-contract gate',async()=>{
  let calls=0;const adapter=qlooAdapter({...env,QLOO_CONTRACT_VERIFIED:'false'},async()=>{calls++;});
  await assert.rejects(adapter.search('x'),e=>e.code==='live_contract_unverified');assert.equal(calls,0);
});
test('200 with malformed envelope is not treated as an empty search',async()=>{
  const adapter=qlooAdapter(env,async()=>json({success:true,results:{entities:[]}}));await assert.rejects(adapter.search('x'),e=>e.code==='invalid_response');
});
test('cancellation is propagated to the upstream request',async()=>{
  const controller=new AbortController();let abortObserved=false;
  const adapter=qlooAdapter(env,async(url,options)=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>{abortObserved=true;reject(new Error('abort'));})),controller.signal);
  const pending=adapter.search('x');controller.abort();await assert.rejects(pending,e=>e.code==='cancelled');assert.equal(abortObserved,true);
});
