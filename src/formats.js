import {TeamValidator} from '@pkmn/sim';
import {moveById,validateLoadout} from './gen1-data.js';
import {lookup} from './roster.js';

export const CASUAL='gen1customgame', OU='gen1ou';
export const formatName=id=>id===OU?'RBY OU':'Kanto casual';
let ouValidator;

const stats=['hp','atk','def','spa','spd','spe'];
function statSpread(values,max,label) {
  if (!values || !stats.every(stat=>Number.isInteger(values[stat]) && values[stat]>=0 && values[stat]<=max))
    throw new RangeError('Invalid '+label+' spread.');
  return Object.fromEntries(stats.map(stat=>[stat,values[stat==='spd'?'spa':stat]]));
}

export function simulatorSet(member) {
  const mon=lookup(member?.id);
  if (!Number.isInteger(member?.id) || !mon) throw new RangeError('Unknown RBY species '+member?.id);
  const error=validateLoadout(mon,member.moves);
  if (error) throw new RangeError(error);
  const level=member.level??100;
  if (!Number.isInteger(level) || level<1 || level>100) throw new RangeError(mon.name+' needs a level from 1 to 100.');
  const set={species:mon.name,moves:member.moves.map(id=>moveById(id).name),level,
    evs:member.evs===undefined?{hp:252,atk:252,def:252,spa:252,spd:252,spe:252}:statSpread(member.evs,255,'EV')};
  if (member.ivs!==undefined) set.ivs=statSpread(member.ivs,31,'IV');
  if (member.name!==undefined) {
    if (typeof member.name!=='string' || member.name.length>18 || /[|\r\n]/.test(member.name))
      throw new RangeError(mon.name+' needs a nickname of 18 characters or fewer without line breaks or pipes.');
    set.name=member.name;
  }
  return set;
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
