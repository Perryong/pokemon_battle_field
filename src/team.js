import {lookup, roster} from './roster.js';
import {CASUAL,OU,partyProblem} from './formats.js';
import {strategySets} from './strategy.js';
import {validateLoadout} from './gen1-data.js';

const storageKey = 'pokemon-battle-field.team.v1';

export function loadTeam(storage) {
  let saved, legacy;
  try {
    saved = JSON.parse(storage.getItem(storageKey));
    legacy = JSON.parse(storage.getItem('indigo.kanto.pair'));
  } catch { /* Storage can be unavailable when the HTML file is opened locally. */ }
  return [25, 6].map((fallback, side) => {
    const stored = saved?.[side];
    const mon = lookup(stored?.id) || lookup(legacy?.[side]) || lookup(fallback);
    const ids = stored?.moves;
    const valid = Array.isArray(ids) && ids.length > 0 && ids.length <= 4 &&
      ids.every(id => Number.isInteger(id) && mon.learnset.includes(id)) &&
      new Set(ids).size === ids.length && !validateLoadout(mon, ids);
    return {id: mon.id, moves: [...(valid ? ids : mon.defaultMoves)]};
  });
}

export function saveTeam(storage, team) {
  try { storage.setItem(storageKey, JSON.stringify(team)); } catch { /* The current match still works. */ }
}

const partiesKey = 'pokemon-battle-field.parties.v2';
export const PARTY_LIMIT = 6;
const isMember = member => Number.isInteger(member?.id) && !!lookup(member.id) &&
  !validateLoadout(member.id, member.moves);
const isParty = party => Array.isArray(party) && party.length > 0 &&
  party.length <= PARTY_LIMIT && party.every(isMember);

export function generateRival(size, lead = null, format = CASUAL) {
  if (!Number.isInteger(size) || size < 1 || size > PARTY_LIMIT) throw new RangeError('Choose one to six Pokémon.');
  if (lead) {
    const problem=partyProblem([lead],format);
    if (problem) throw new RangeError(problem);
  }
  const rival = lead ? [{id:lead.id,moves:[...lead.moves]}] : [];
  const pool = roster.filter(mon => mon.id !== lead?.id);
  const movesFor = mon => format===OU ? strategySets(mon).find(set=>set.tier==='ou')?.moves : mon.defaultMoves;
  if (format===OU) {
    // Use published OU sets as opposition and validate each draw against this format.
    for (let i=pool.length-1;i>=0;i--) {
      const mon=pool[i], moves=movesFor(mon);
      if (!moves || partyProblem([{id:mon.id,moves}],format)) pool.splice(i,1);
    }
  }
  while (rival.length < size) {
    const represented = new Set(rival.flatMap(member=>lookup(member.id).types));
    const varied = pool.filter(mon => mon.types.some(type=>!represented.has(type)));
    const options = varied.length ? varied : pool;
    const mon = options[Math.floor(Math.random() * options.length)];
    rival.push({id:mon.id,moves:[...movesFor(mon)]});
    pool.splice(pool.indexOf(mon),1);
  }
  return rival;
}

export function loadParties(storage) {
  try {
    const saved=JSON.parse(storage.getItem(partiesKey));
    if (isParty(saved?.[0])) return [saved[0],isParty(saved[1]) && saved[1].length === saved[0].length
      ? saved[1] : generateRival(saved[0].length)];
  } catch { /* Fall back to the previous local team. */ }
  return loadTeam(storage).map(member=>[member]);
}

export function saveParties(storage, parties) {
  if (!parties.every(isParty) || parties.length !== 2 || parties[0].length !== parties[1].length)
    throw new RangeError('Use matching parties of one to six Pokémon with legal moves.');
  try { storage.setItem(partiesKey, JSON.stringify(parties)); } catch { /* Match still works offline. */ }
}
