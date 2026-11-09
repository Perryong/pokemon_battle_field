import data from './gen1-data.json' with {type:'json'};
import {lookup} from './roster.js';

export const allMoves=data.moves;
export const moveById = id => allMoves[id-1];

// The chart describes type matchups. Engine-level moves like Night Shade can bypass immunity.
export function effectiveness(type,defenderTypes){
  const matchups=data.typeChart[type];
  if(!matchups) throw new RangeError('Unknown RBY attack type '+type);
  return defenderTypes.reduce((factor,defense)=>{
    if(matchups[defense]===undefined)throw new RangeError('Unknown RBY defense type '+defense);
    return factor*matchups[defense];
  },1);
}

// Some moves can only be obtained via a Gen I distribution, Stadium, or evolution from such a Pokémon.
export const sourceNote = (species,moveId) => data.sourceNotes[species?.id??species]?.[moveId] || '';

// An individually obtainable move can be incompatible with another because of evolution timing,
// encounter level or an event Pokémon's fixed starting moves. Return a displayable reason or null.
export function validateLoadout(species,ids){
  const mon=typeof species==='number'?lookup(species):species;
  if(!mon || !Array.isArray(ids) || !ids.length || ids.length>4) return 'Choose one to four moves.';
  if(new Set(ids).size!==ids.length) return 'Each equipped move must be different.';
  for(const id of ids) if(!mon.learnset.includes(id))
    return mon.name+' cannot learn '+(moveById(id)?.name||'this move')+' in Generation I.';
  for(const pair of data.incompatible[mon.id]||[]) if(pair.every(id=>ids.includes(id)))
    return mon.name+' cannot know '+pair.map(id=>moveById(id).name).join(' and ')+' together in Generation I.';
  return null;
}
