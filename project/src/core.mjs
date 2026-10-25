export const MOVIE = 'urn:entity:movie';
export class FlowError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
export function validateInput(input) {
  if (!input || !Array.isArray(input.people) || input.people.length < 2 || input.people.length > 3)
    throw new FlowError('invalid_input', 'Add two or three people.');
  const people = input.people.map((p, i) => {
    if (!p || typeof p.query !== 'string' || !p.query.trim() || p.query.length > 80)
      throw new FlowError('invalid_input', `Person ${i + 1} needs a favorite, up to 80 characters.`);
    if (p.selectedId !== undefined && (typeof p.selectedId !== 'string' || p.selectedId.length > 100))
      throw new FlowError('invalid_input', 'Invalid entity choice.');
    return {label: `Person ${i + 1}`, query: p.query.trim(), selectedId: p.selectedId};
  });
  const excluded = input.excluded ?? [];
  if (!Array.isArray(excluded) || excluded.length > 10 || excluded.some(id => typeof id !== 'string' || id.length > 100))
    throw new FlowError('invalid_input', 'Choose up to ten movie exclusions.');
  if (input.expanded !== undefined && typeof input.expanded !== 'boolean')
    throw new FlowError('invalid_input', 'Invalid expansion choice.');
  if (!['fixture', 'live'].includes(input.mode ?? 'fixture'))
    throw new FlowError('invalid_input', 'Choose fixture or live mode.');
  return {people, excluded: [...new Set(excluded)], expanded: input.expanded === true, mode: input.mode ?? 'fixture'};
}

export function validateEntities(list, max = 40) {
  if (!Array.isArray(list) || list.length > max) throw new FlowError('invalid_response', 'The candidate response could not be verified.');
  const seen = new Set();
  return list.map((e, index) => {
    if (!e || typeof e.id !== 'string' || !e.id || e.id.length > 100 || typeof e.name !== 'string' || !e.name || e.name.length > 200 || e.type !== MOVIE || seen.has(e.id))
      throw new FlowError('invalid_response', 'A movie response has missing, duplicate or unexpected fields.');
    seen.add(e.id);
    return {id: e.id, name: e.name, type: MOVIE, rank: index + 1};
  });
}

// Rank is the original retrieval position, never a probability or personal utility.
export function compromise(lists, excluded = []) {
  if (!Array.isArray(lists) || lists.length < 2 || lists.length > 3)
    throw new FlowError('invalid_input', 'Two or three candidate lists are required.');
  const normalized = lists.map(list => validateEntities(list));
  const blocked = new Set(excluded);
  const maps = normalized.map(list => new Map(list.map(e => [e.id, e])));
  const rows = normalized[0].filter(e => !blocked.has(e.id) && maps.every(m => m.has(e.id))).map(e => {
    const ranks = maps.map(m => m.get(e.id).rank);
    return {id: e.id, name: e.name, ranks, worstRank: Math.max(...ranks), sumRank: ranks.reduce((a, b) => a + b, 0)};
  });
  rows.sort((a, b) => a.worstRank - b.worstRank || a.sumRank - b.sumRank || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return rows;
}

export async function runAgent(raw, adapter, {signal,runId=crypto.randomUUID()}={}) {
  const input = validateInput(raw);
  const trace = [];
  const base = {kind:input.mode,runId,mode: input.mode, source: adapter.source, expanded: input.expanded, excluded: input.excluded, trace};
  const finish=data=>({...base,upstreamRequests:adapter.requestCount?.()??0,...data});
  const check=()=>{if(signal?.aborted)throw new FlowError('cancelled','This run was cancelled after an input change.');};
  const step = (tool, decision, detail) => trace.push({step: trace.length + 1, tool, decision, detail});
  const resolved = [];
  try {
    check();
    if (adapter.mode !== input.mode) throw new FlowError('mode_mismatch', 'The selected data source is not available.');
    step('plan_run','bounded',`New ${input.expanded?'expanded':'initial'} run; at most ${input.people.length*2} upstream requests in live mode. No session-wide cap is claimed.`);
    for (const person of input.people) {
      check();
      const choices = validateEntities(await adapter.search(person.query), 5);
      check();
      step('resolve_entity', choices.length === 0 ? 'missing' : choices.length > 1 ? 'verify choice' : 'resolved', `${person.label}: ${choices.length} search match(es).`);
      const selected = person.selectedId ? choices.find(c => c.id === person.selectedId) : choices.length === 1 ? choices[0] : undefined;
      if (person.selectedId && !selected) throw new FlowError('invalid_choice', 'A previous entity choice no longer matches this search. Please resolve it again.');
      resolved.push({label: person.label, query: person.query, choices, entity: selected});
    }
    const pending = resolved.filter(p => !p.entity);
    if (pending.length) return finish({state: 'needs_input', people: resolved, message: 'Confirm ambiguous matches or change favorites with no match. No recommendation has been generated.'});
    const take = input.expanded ? 40 : 20;
    if (input.expanded) step('authorize_expansion', 'expand', 'The group requested a larger pool. Hard movie exclusions remain in force.');
    const lists = [];
    for (const person of resolved) {
      check();
      const list = validateEntities(await adapter.candidates(person.entity.id, take), take);
      check();
      lists.push(list);
      step('fetch_candidates', list.length ? 'received' : 'empty', `${person.label}: ${list.length} movie candidates, limit ${take}.`);
    }
    const rows = compromise(lists, input.excluded);
    step('rank_compromise', rows.length ? 'supported overlap' : 'no overlap', `${rows.length} non-excluded movie(s) present in every observed list.`);
    return finish({state: rows.length ? 'complete' : 'needs_expansion', people: resolved.map(p => ({label: p.label, entity: p.entity})), lists, rows,
      message: rows.length ? 'Selected by lowest worst rank, then total rank, then stable ID.' : input.expanded ? 'No supported shared candidate in the expanded pool. Change a favorite; no further automatic retries.' : 'No supported shared candidate. You can explicitly expand each pool from 20 to 40.'});
  } catch (error) {
    step('stop', 'unavailable', error instanceof FlowError ? error.code : 'unexpected_error');
    return finish({kind:'error',state: 'unavailable', code: error instanceof FlowError ? error.code : 'unexpected_error',
      message: error instanceof FlowError ? error.message : 'The request could not be completed. No fallback recommendation was generated.'});
  }
}
