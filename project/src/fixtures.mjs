import {MOVIE} from './core.mjs';
// Entirely invented contract data. These are NOT Qloo IDs, movies or responses.
const movie = (id, name) => ({id: `fixture:${id}`, name, type: MOVIE});
const seeds = [movie('aurora','Aurora Signal'), movie('mariner','The Mariner Code'), movie('atlas','Atlas of Small Things')];
const titles = {x: 'Copper Sky', y: 'The Quiet Orbit', z: 'Paper Lanterns', a:'Northern Window', b:'The Blue Room', c:'A Small Journey', shared:'Tomorrow, Together'};
const make = ids => ids.map(id => movie(id,titles[id]));
export const fixtureScenarios = ['overlap', 'conflict', 'sparse', 'unavailable'];
export function fixtureAdapter(scenario = 'overlap') {
  if (!fixtureScenarios.includes(scenario)) throw new Error('Unknown fixture scenario');
  return {mode:'fixture', source:'Synthetic contract fixtures — no Qloo requests',
    async search(query) {
      if (query.toLowerCase() === 'echo') return [movie('echo-a','Echo (synthetic A)'),movie('echo-b','Echo (synthetic B)')];
      return seeds.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));
    },
    async candidates(id, take) {
      if (scenario === 'unavailable') throw new Error('Synthetic transport failure');
      const index = seeds.findIndex(s=>s.id===id);
      if (index < 0) return [];
      if (scenario === 'sparse' && index === 1) return [];
      if (scenario === 'conflict') return make(take > 20 ? [['a','shared'],['b','shared'],['c','shared']][index] : [['a'],['b'],['c']][index]);
      return make([['x','y','z'],['y','z','x'],['z','y','x']][index]);
    }};
}
