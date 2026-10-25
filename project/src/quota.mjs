import {FlowError} from './core.mjs';

const positive = value => typeof value==='string' && /^[1-9][0-9]{0,5}$/.test(value) ? Number(value) : 0;
export function quotaPolicy(env) {
  const minute=positive(env.QLOO_MINUTE_LIMIT),day=positive(env.QLOO_DAILY_LIMIT),event=positive(env.QLOO_EVENT_LIMIT);
  if(env.QLOO_BUDGET_VERIFIED!=='true'||minute<6||day<minute||event<day)
    throw new FlowError('quota_unconfigured','Live access needs a verified shared request budget.');
  return {minute,day,event};
}
export function sharedQuotaReady(env) {
  try {quotaPolicy(env);return Boolean(env.QLOO_BUDGET?.idFromName && env.QLOO_BUDGET?.get);} catch {return false;}
}

// A single SQLite-backed Durable Object owns this one-row counter for the app.
// Reserve the entire upper bound BEFORE Qloo. No refunds for failures/cancellation.
export function reserveQuota(storage,env,units,now=Date.now()) {
  const limits=quotaPolicy(env);
  if(!Number.isInteger(units)||units<1||units>6||!Number.isSafeInteger(now)||now<0)
    throw new FlowError('quota_invalid','Invalid request reservation.');
  const day=new Date(now).toISOString().slice(0,10),minute=Math.floor(now/60000);
  return storage.transactionSync(()=>{
    const sql=storage.sql;
    sql.exec('CREATE TABLE IF NOT EXISTS quota (id INTEGER PRIMARY KEY CHECK (id = 1), day TEXT NOT NULL, minute INTEGER NOT NULL, day_used INTEGER NOT NULL, minute_used INTEGER NOT NULL, total_used INTEGER NOT NULL)');
    const old=sql.exec('SELECT * FROM quota WHERE id = 1').toArray()[0];
    if(old && (day<old.day || minute<old.minute))
      throw new FlowError('quota_clock','The shared budget clock could not be verified.');
    const dayUsed=old?.day===day?old.day_used:0;
    const minuteUsed=old?.minute===minute?old.minute_used:0;
    const totalUsed=old?.total_used??0;
    for(const [used,limit] of [[minuteUsed,limits.minute],[dayUsed,limits.day],[totalUsed,limits.event]])
      if(used+units>limit)return {allowed:false,reserved:0};
    sql.exec('INSERT INTO quota (id,day,minute,day_used,minute_used,total_used) VALUES (1,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET day=excluded.day, minute=excluded.minute, day_used=excluded.day_used, minute_used=excluded.minute_used, total_used=excluded.total_used',day,minute,dayUsed+units,minuteUsed+units,totalUsed+units);
    return {allowed:true,reserved:units};
  });
}

export async function reserveLiveRun(env,peopleCount,signal) {
  if(!sharedQuotaReady(env))throw new FlowError('quota_unconfigured','Live access needs an available, verified shared request budget.');
  if(signal?.aborted)throw new FlowError('cancelled','This run was cancelled.');
  const units=peopleCount*2;
  if(!Number.isInteger(peopleCount)||peopleCount<2||peopleCount>3)throw new FlowError('quota_invalid','Invalid group size.');
  const deadlineController=new AbortController();
  const reserveSignal=signal?AbortSignal.any([signal,deadlineController.signal]):deadlineController.signal;
  let deadlineTimer;
  try {
    // A fixed name must survive redeployments; never derive an object name from a client.
    const stub=env.QLOO_BUDGET.get(env.QLOO_BUDGET.idFromName('common-ground-global-v1'));
    const deadline=new Promise((_,reject)=>{deadlineTimer=setTimeout(()=>{
      deadlineController.abort();
      reject(new FlowError('quota_unavailable','The shared budget did not respond in time. No Qloo request was made; any reservation is retained.'));
    },8000);});
    const reserve=async()=>{
      const response=await stub.fetch('https://quota.internal/reserve',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({units}),signal:reserveSignal});
      if(response.status===429)throw new FlowError('quota_exhausted','The shared request budget is unavailable. Try later; no Qloo request was made.');
      if(!response.ok)throw new FlowError('quota_unavailable','The shared request budget could not be verified.');
      const body=await response.json();
      if(body.allowed!==true||body.reserved!==units)throw new FlowError('quota_unavailable','The shared reservation could not be verified.');
      if(signal?.aborted)throw new FlowError('cancelled','This run was cancelled. Its reserved quota is retained.');
      return units;
    };
    // Bound the entire exchange, even if fetch or its body ignores cancellation.
    // A late grant may retain a debit but cannot restart the failed API run.
    return await Promise.race([reserve(),deadline]);
  } catch(error) {
    if(error instanceof FlowError)throw error;
    throw new FlowError('quota_unavailable','The shared request budget could not be verified. No Qloo request was made.');
  } finally {clearTimeout(deadlineTimer);}
}
