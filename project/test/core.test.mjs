import test from 'node:test';
import assert from 'node:assert/strict';
import {compromise,MOVIE,runAgent,validateInput} from '../src/core.mjs';
import {fixtureAdapter} from '../src/fixtures.mjs';
const m=id=>({id,name:id,type:MOVIE});
const input={mode:'fixture',people:[{query:'Aurora'},{query:'Mariner'},{query:'Atlas'}]};
test('max-min picks compromise instead of first person favorite',()=>{
  const rows=compromise([['x','y','z'].map(m),['y','z','x'].map(m),['z','y','x'].map(m)]);
  assert.equal(rows[0].id,'y');assert.deepEqual(rows[0].ranks,[2,1,2]);assert.equal(rows[0].worstRank,2);
});
test('tie breaks by sum, then stable ID independent of input order',()=>{
  const rows=compromise([['b','a'].map(m),['a','b'].map(m)]);assert.equal(rows[0].id,'a');
  const sums=compromise([['b','a','c'].map(m),['a','c','b'].map(m),['c','a','b'].map(m)]);assert.equal(sums[0].id,'a');
});
test('exclusion preserves original retrieval ranks and never returns excluded movie',()=>{
  const rows=compromise([['x','y'].map(m),['x','y'].map(m)],['x']);assert.equal(rows[0].id,'y');assert.deepEqual(rows[0].ranks,[2,2]);
});
test('intersection requires evidence for every person',()=>{
  assert.deepEqual(compromise([['x'].map(m),['y'].map(m)]),[]);
  assert.deepEqual(compromise([['x'].map(m),[]]),[]);
});
test('duplicate IDs and wrong entity types fail closed',()=>{
  assert.throws(()=>compromise([[m('x'),m('x')],[m('x')]]));
  assert.throws(()=>compromise([[{...m('x'),type:'urn:entity:place'}],[m('x')]]));
});
test('group size, inputs and expansion flags are bounded',()=>{
  for(const raw of [null,{}, {people:[{query:'x'}]}, {...input,expanded:'true'}, {...input,people:[{query:' '.repeat(5)},{query:'x'}]}, {...input,excluded:Array(11).fill('x')}])assert.throws(()=>validateInput(raw));
});
test('agent completes only after resolving and retrieving all people',async()=>{
  const result=await runAgent(input,fixtureAdapter());assert.equal(result.state,'complete');assert.equal(result.rows[0].id,'fixture:y');
  assert.equal(result.trace.filter(t=>t.tool==='resolve_entity').length,3);assert.equal(result.trace.filter(t=>t.tool==='fetch_candidates').length,3);
});
test('ambiguous identity blocks retrieval until a verified choice',async()=>{
  let retrieves=0;const adapter=fixtureAdapter();const candidates=adapter.candidates;adapter.candidates=async(...args)=>{retrieves++;return candidates(...args);};
  const raw={...input,people:[{query:'Echo'},{query:'Mariner'}]};
  const result=await runAgent(raw,adapter);assert.equal(result.state,'needs_input');assert.equal(result.people[0].choices.length,2);assert.equal(retrieves,0);
  const forged=await runAgent({...raw,people:[{query:'Echo',selectedId:'fixture:forged'},{query:'Mariner'}]},fixtureAdapter());assert.equal(forged.code,'invalid_choice');
});
test('missing entity does not produce a candidate or baseline substitute',async()=>{
  const result=await runAgent({...input,people:[{query:'missing'},{query:'Mariner'}]},fixtureAdapter());assert.equal(result.state,'needs_input');assert.equal(result.rows,undefined);
});
test('pool expansion requires explicit choice and preserves exclusions',async()=>{
  const first=await runAgent(input,fixtureAdapter('conflict'));assert.equal(first.state,'needs_expansion');
  const expanded=await runAgent({...input,expanded:true},fixtureAdapter('conflict'));assert.equal(expanded.rows[0].id,'fixture:shared');
  const excluded=await runAgent({...input,expanded:true,excluded:['fixture:shared']},fixtureAdapter('conflict'));assert.equal(excluded.state,'needs_expansion');assert.deepEqual(excluded.rows,[]);
  assert.ok(excluded.trace.some(t=>t.tool==='authorize_expansion'));
});
test('transport failure and empty result stay distinguishable',async()=>{
  const empty=await runAgent(input,fixtureAdapter('sparse'));assert.equal(empty.state,'needs_expansion');
  const failed=await runAgent(input,fixtureAdapter('unavailable'));assert.equal(failed.state,'unavailable');assert.equal(failed.rows,undefined);
});
test('cancelled resolution cannot continue to Insights or a second search',async()=>{
  const controller=new AbortController();let release,searches=0,insights=0;
  const adapter={mode:'fixture',source:'Synthetic cancellation test',search:async()=>{searches++;return new Promise(resolve=>release=resolve);},candidates:async()=>{insights++;return [];}};
  const pending=runAgent(input,adapter,{signal:controller.signal});controller.abort();release([m('seed')]);
  const result=await pending;assert.equal(result.code,'cancelled');assert.equal(result.kind,'error');assert.equal(searches,1);assert.equal(insights,0);assert.equal(result.rows,undefined);
});
test('partial candidate retrieval failure never returns completed group output',async()=>{
  let count=0;const adapter={mode:'fixture',source:'Synthetic partial failure',search:async query=>[m(query)],candidates:async()=>{if(++count===2)throw new Error('failure');return [m('x')];}};
  const result=await runAgent(input,adapter);assert.equal(result.kind,'error');assert.equal(result.rows,undefined);assert.equal(result.lists,undefined);assert.equal(count,2);
});
test('source mode mismatch cannot return fixture success through live path',async()=>{
  const result=await runAgent({...input,mode:'live'},fixtureAdapter());assert.equal(result.code,'mode_mismatch');assert.equal(result.kind,'error');assert.equal(result.rows,undefined);
});
