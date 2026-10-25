import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {quotaPolicy,reserveQuota,reserveLiveRun} from '../src/quota.mjs';
import {handleApi} from '../src/api.mjs';
import {boundedText} from '../src/http.mjs';

const policy={QLOO_BUDGET_VERIFIED:'true',QLOO_MINUTE_LIMIT:'12',QLOO_DAILY_LIMIT:'24',QLOO_EVENT_LIMIT:'36'};
const at=Date.UTC(2026,9,25,12,0);
function sqliteStore(){
  const db=new DatabaseSync(':memory:');
  const storage={sql:{exec(query,...bindings){
    const stmt=db.prepare(query);const rows=stmt.columns().length?stmt.all(...bindings):(stmt.run(...bindings),[]);
    return {toArray:()=>rows};
  }},transactionSync(callback){
    db.exec('BEGIN IMMEDIATE');try{const result=callback();db.exec('COMMIT');return result;}catch(error){db.exec('ROLLBACK');throw error;}
  }};
  return {storage,close:()=>db.close()};
}
test('shared quota reserves capacity once per run across simultaneous callers',async()=>{
  const store=sqliteStore();try{
    const results=await Promise.all(Array.from({length:20},()=>Promise.resolve().then(()=>reserveQuota(store.storage,policy,6,at))));
    assert.equal(results.filter(r=>r.allowed).length,2);
    const row=store.storage.sql.exec('SELECT * FROM quota').toArray()[0];assert.equal(row.total_used,12);assert.equal(row.minute_used,12);
  }finally{store.close();}
});
test('daily reset retains event cap and state survives new reservation calls',()=>{
  const store=sqliteStore();try{
    for(const time of [at,at,at+60000,at+60000])assert.equal(reserveQuota(store.storage,policy,6,time).allowed,true);
    assert.equal(reserveQuota(store.storage,policy,6,at+120000).allowed,false);
    assert.equal(reserveQuota(store.storage,policy,6,at+86400000).allowed,true);
    assert.equal(reserveQuota(store.storage,policy,6,at+86400000).allowed,true);
    assert.equal(reserveQuota(store.storage,policy,6,at+2*86400000).allowed,false);
  }finally{store.close();}
});
test('UTC minute rollover does not reset daily usage or refund failed runs',()=>{
  const store=sqliteStore();try{
    reserveQuota(store.storage,policy,6,at);reserveQuota(store.storage,policy,6,at);
    assert.equal(reserveQuota(store.storage,policy,6,at+59999).allowed,false);
    assert.equal(reserveQuota(store.storage,policy,6,at+60000).allowed,true);
    assert.equal(store.storage.sql.exec('SELECT total_used FROM quota').toArray()[0].total_used,18);
  }finally{store.close();}
});
test('quota policy is disabled by default and malformed settings cannot initialize counters',()=>{
  const store=sqliteStore();try{
    for(const env of [{},{...policy,QLOO_BUDGET_VERIFIED:'false'},{...policy,QLOO_MINUTE_LIMIT:'0'},{...policy,QLOO_DAILY_LIMIT:'6'},{...policy,QLOO_EVENT_LIMIT:'1e6'}])assert.throws(()=>reserveQuota(store.storage,env,6,at));
    assert.equal(store.storage.sql.exec("SELECT name FROM sqlite_master WHERE type='table'").toArray().length,0);
    for(const units of [0,7,-1,1.5])assert.throws(()=>reserveQuota(store.storage,policy,units,at));
  }finally{store.close();}
});
test('lowered budget and backwards clock do not replenish reservations',()=>{
  const store=sqliteStore();try{
    reserveQuota(store.storage,policy,6,at);
    assert.equal(reserveQuota(store.storage,{...policy,QLOO_MINUTE_LIMIT:'6'},6,at).allowed,false);
    assert.throws(()=>reserveQuota(store.storage,policy,6,at-60000),e=>e.code==='quota_clock');
    assert.equal(store.storage.sql.exec('SELECT total_used FROM quota').toArray()[0].total_used,6);
  }finally{store.close();}
});
test('missing, failed or malformed shared-budget replies fail closed',async()=>{
  await assert.rejects(reserveLiveRun(policy,3),e=>e.code==='quota_unconfigured');
  for(const response of [new Response('',{status:503}),new Response(JSON.stringify({allowed:true,reserved:1})),new Response('',{status:429})]){
    const env={...policy,QLOO_BUDGET:{idFromName:name=>name,get:()=>({fetch:async()=>response})}};
    await assert.rejects(reserveLiveRun(env,3),e=>e.code.startsWith('quota_'));
  }
});
test('all groups use one fixed object and reserve the full 2N bound',async()=>{
  const seen=[];const env={...policy,QLOO_BUDGET:{idFromName:name=>{seen.push(name);return name;},get:()=>({fetch:async(url,options)=>{const {units}=JSON.parse(options.body);return Response.json({allowed:true,reserved:units});}})}};
  assert.equal(await reserveLiveRun(env,2),4);assert.equal(await reserveLiveRun(env,3),6);
  assert.deepEqual(seen,['common-ground-global-v1','common-ground-global-v1']);
});
test('API cannot reach Qloo when a configured key lacks shared quota',async()=>{
  const env={QLOO_LIVE_ENABLED:'true',QLOO_CONTRACT_VERIFIED:'true',QLOO_API_KEY:'synthetic-no-network-test'};
  const req=new Request('http://localhost/api/plan',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({mode:'live',people:[{query:'Aurora'},{query:'Mariner'}]})});
  const response=await handleApi(req,env);assert.equal(response.status,503);assert.equal((await response.json()).code,'quota_unconfigured');
  const status=await (await handleApi(new Request('http://localhost/api/status'),env)).json();assert.equal(status.liveEnabled,false);assert.equal(status.quotaConfigured,false);
});
test('body limit counts UTF-8 bytes and cancels the reader at the boundary',async()=>{
  let cancelled=false;const stream=new ReadableStream({pull(controller){controller.enqueue(new TextEncoder().encode('é'.repeat(2050)));},cancel(){cancelled=true;}});
  await assert.rejects(boundedText(new Response(stream),4096,'request_too_large'),e=>e.code==='request_too_large');assert.equal(cancelled,true);
  const request=new Request('http://localhost/api/plan',{method:'POST',headers:{'content-type':'application/jsonp'},body:'{}'});
  assert.equal((await handleApi(request)).status,415);
});

test('a stalled coordinator fails within ten seconds and a late grant cannot call Qloo',{timeout:13000},async()=>{
  let grant,watchdog,reservations=0,qlooCalls=0;
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async()=>{qlooCalls++;throw new Error('No external request is permitted in this test.');};
  const env={...policy,QLOO_LIVE_ENABLED:'true',QLOO_CONTRACT_VERIFIED:'true',QLOO_API_KEY:'synthetic-no-network-test',
    QLOO_BUDGET:{idFromName:name=>name,get:()=>({fetch:()=>{reservations++;return new Promise(resolve=>{grant=resolve;});}})}};
  const request=new Request('http://localhost/api/plan',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({mode:'live',people:[{query:'Aurora'},{query:'Mariner'}]})});
  try {
    const response=await Promise.race([handleApi(request,env),new Promise(resolve=>{watchdog=setTimeout(()=>resolve(null),10000);})]);
    assert.ok(response,'A stalled coordinator left the API pending for ten seconds.');
    assert.equal(response.status,503);assert.equal((await response.json()).code,'quota_unavailable');
    assert.equal(reservations,1);assert.equal(qlooCalls,0);
    grant(Response.json({allowed:true,reserved:4}));
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(qlooCalls,0,'A late reservation must not resume an already failed run.');
  } finally {
    clearTimeout(watchdog);
    grant?.(new Response('',{status:503}));
    await new Promise(resolve=>setImmediate(resolve));
    globalThis.fetch=originalFetch;
  }
});
