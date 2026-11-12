import {TeamValidator} from '@pkmn/sim';
import {moveById,validateLoadout} from './gen1-data.js';
import {lookup} from './roster.js';

export const CASUAL='gen1customgame', OU='gen1ou';
export const formatName=id=>id===OU?'RBY OU':'Kanto casual';
let ouValidator;

export function simulatorSet(member) {
  const mon=lookup(member?.id);
  if (!Number.isInteger(member?.id) || !mon) throw new RangeError('Unknown RBY species '+member?.id);
  const error=validateLoadout(mon,member.moves);
  if (error) throw new RangeError(error);
  return {species:mon.name,moves:member.moves.map(id=>moveById(id).name),level:100,
    evs:{hp:252,atk:252,def:252,spa:252,spd:252,spe:252}};
}

export function checkedTeam(party,format) {
  if (format!==CASUAL && format!==OU) throw new RangeError('Unknown battle format.');
  if (!Array.isArray(party) || party.length<1 || party.length>6) throw new RangeError('Choose one to six party members.');
  const sets=Array.from(party,simulatorSet);
  if (format===OU) {
    ouValidator??=TeamValidator.get(OU);
    // Showdown annotates validation inputs. Battle construction takes the original sets.
    const errors=ouValidator.validateTeam(structuredClone(sets));
    if (errors?.length) throw new RangeError(errors.join(' '));
  }
  return sets;
}

export function partyProblem(party,format) {
  try { checkedTeam(party,format);return ''; }
  catch (error) { return error.message; }
}
