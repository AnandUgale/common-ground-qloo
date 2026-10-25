const $=id=>document.getElementById(id);
let excluded=[],expanded=false,busy=false,revision=0,activeController,reportedRequests=0;
const runHistory=[];
const el=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
const clearChoices=()=>{for(let i=0;i<3;i++)$('choices'+i).replaceChildren();};
function invalidate(){revision++;activeController?.abort();expanded=false;$('expand').hidden=true;$('result').replaceChildren(el('p','Preferences changed. Run again to see current evidence.','caption'));$('trace-box').hidden=true;}
for(let i=0;i<3;i++)$('person'+i).addEventListener('input',()=>{clearChoices();invalidate();});
$('scenario').addEventListener('change',()=>{excluded=[];clearChoices();refreshExclusions();invalidate();});
$('mode').addEventListener('change',()=>{excluded=[];clearChoices();refreshExclusions();invalidate();const live=$('mode').value==='live';$('fixture-controls').hidden=live;
  $('source-notice').replaceChildren(el('strong',live?'Live Qloo selected · validation pending':'Synthetic fixture mode'),el('p',live?'Favorites will be sent to Qloo. Live response mapping and recommendation quality have not been independently validated.':'Every movie, ID and ranking in this demonstration is invented. No Qloo request has been made. This is a local engineering prototype.'));});
function refreshExclusions(){$('exclusions').hidden=!excluded.length;$('excluded-text').textContent=`${excluded.length} hard movie exclusion(s). These survive pool expansion.`;}
$('clear-exclusions').addEventListener('click',()=>{excluded=[];refreshExclusions();invalidate();});
$('expand').addEventListener('click',()=>{expanded=true;submit();});
$('preferences').addEventListener('submit',e=>{e.preventDefault();expanded=false;submit();});
function card(row,index){const box=el('article',undefined,'candidate'+(index===0?' winner':''));box.append(el('p',index===0?'Best supported compromise':'Another shared option','result-label'),el('h3',row.name));
  const ranks=el('div',undefined,'ranks');row.ranks.forEach((rank,i)=>{const cell=el('div',undefined,'rank');cell.append(el('span',`Person ${i+1}`),el('strong',`#${rank}`));ranks.append(cell);});
  box.append(ranks,el('p',`Worst rank ${row.worstRank} · Total rank ${row.sumRank}. Observed positions, not predicted enjoyment.`,'caption'));
  const never=el('button','Exclude this movie','quiet');never.type='button';never.disabled=excluded.length>=10;
  never.addEventListener('click',()=>{if(excluded.length<10&&!excluded.includes(row.id))excluded.push(row.id);refreshExclusions();submit();});box.append(never);return box;}
function baseline(data){if(data.mode!=='fixture'||data.state!=='complete')return;const box=el('aside',undefined,'baseline');
  // Predeclared catalog order; no taste retrieval and no source-derived ordering.
  const catalog=[['fixture:x','Copper Sky'],['fixture:y','The Quiet Orbit'],['fixture:z','Paper Lanterns']];
  const pick=catalog.find(([id])=>!excluded.includes(id));
  box.append(el('strong','Taste-blind fixture control · fixed catalogue'));
  if(!pick){box.append(el('p','No baseline candidate survives exclusions.'));$('result').append(box);return;}
  const ranks=data.lists.map(list=>list.findIndex(e=>e.id===pick[0])+1);
  box.append(el('p',`Fixed choice: ${pick[1]}. ${ranks.every(r=>r>0)?`Worst position in the same synthetic reference lists: ${Math.max(...ranks)}.`:'The synthetic reference lists do not support a complete rank comparison.'}`),el('p','This only illustrates a change in an engineering fixture. It measures neither real Qloo quality nor human satisfaction.','caption'));$('result').append(box);}
async function submit(){if(busy)return;busy=true;const runRevision=++revision;activeController=new AbortController();$('find').disabled=true;$('expand').disabled=true;document.querySelector('.results').setAttribute('aria-busy','true');
  $('result').replaceChildren(el('p','Resolving favorites and checking candidate overlap…','caption'));$('trace-box').hidden=true;$('expand').hidden=true;
  try {const people=[];for(let i=0;i<3;i++){const query=$('person'+i).value.trim();if(i<2||query)people.push({query,...($('choice'+i)?.value?{selectedId:$('choice'+i).value}:{})});}
    const response=await fetch('/api/plan',{method:'POST',headers:{'content-type':'application/json'},signal:activeController.signal,body:JSON.stringify({people,excluded,expanded,mode:$('mode').value,scenario:$('scenario').value})});
    const data=await response.json();if(runRevision!==revision)return;$('result').replaceChildren();
    if(!response.ok)throw new Error(data.message??'Request unavailable');
    if(data.mode!==$('mode').value||!['fixture','live','error'].includes(data.kind))throw new Error('The response source did not match this run.');
    reportedRequests+=data.upstreamRequests??0;
    runHistory.push({runId:data.runId,mode:data.mode,expanded:data.expanded,upstreamRequests:data.upstreamRequests});
    $('result').append(el('p',data.source,'result-label'));
    if(data.mode==='live')$('result').append(el('p',`This run: ${data.upstreamRequests} upstream requests. Completed runs reported in this page: ${reportedRequests}. Cancelled runs may also consume quota.`,'caption'));
    if(data.state==='complete'){data.rows.slice(0,3).forEach((row,i)=>$('result').append(card(row,i)));baseline(data);}
    else {const box=el('div',undefined,'error');box.append(el('h3',data.state==='needs_input'?'A little more input':data.state==='needs_expansion'?'No shared candidate yet':'Source unavailable'),el('p',data.message));$('result').append(box);}
    if(data.state==='needs_input')data.people.forEach((person,i)=>{const target=$('choices'+i);target.replaceChildren();if(person.entity)return;if(!person.choices.length){target.append(el('p','No match. Try another favorite.','hint'));return;}
      const label=el('label','Choose the intended movie','choice-label');label.htmlFor='choice'+i;const select=el('select');select.id='choice'+i;select.append(new Option('Choose a match…',''));person.choices.forEach(c=>select.append(new Option(c.name,c.id)));select.addEventListener('change',invalidate);target.append(label,select);});
    $('expand').hidden=data.state!=='needs_expansion'||expanded;
    $('trace').replaceChildren(...data.trace.map(t=>{const li=el('li');li.append(el('strong',`${t.tool} → ${t.decision}`),el('span',t.detail));return li;}));$('trace').prepend(el('li',`${data.mode==='fixture'?'Synthetic':'Live-mode'} run ${data.runId}. Expansion is a new run and can make up to six additional upstream requests; exclusions remain in force.`));
    runHistory.slice(-8,-1).forEach(run=>$('trace').append(el('li',`Earlier ${run.mode} ${run.expanded?'expanded':'initial'} run ${run.runId}: ${run.upstreamRequests} upstream requests reported.`)));
    $('trace-box').hidden=false;
  }catch(error){if(runRevision===revision)$('result').replaceChildren(el('p',error.message,'error'));}
  finally{busy=false;$('find').disabled=false;$('expand').disabled=false;document.querySelector('.results').setAttribute('aria-busy','false');}}
fetch('/api/status').then(r=>r.json()).then(status=>{if(status.liveEnabled){const option=$('mode').options[1];option.disabled=false;option.textContent='Live Qloo · semantics unverified';}}).catch(()=>{});
