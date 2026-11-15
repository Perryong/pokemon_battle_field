import {Dex,Teams} from '@pkmn/sim';
import {CASUAL,OU,checkedTeam} from './formats.js';
import {lookup} from './roster.js';

const key='pokemon-battle-field.team-library.v1';
const dex=Dex.forGen(1);

function parseSet(block) {
  const [title,...lines]=block.split('\n').map(line=>line.trim());
  for (const line of lines) {
    if (line==='-' || /^[-~] /.test(line) || /^(Level|Ability|Trait): /.test(line)) continue;
    if (/^(IVs|EVs): /.test(line) && line.slice(5).split(' / ').every(entry=>
      /^\d+ (HP|Atk|Def|SpA|SpD|Spe|Spc|SAtk|SDef|SpAtk|SpDef|Spd|Speed|Attack|Defense|Special|Special Attack|Special Defense|hp|atk|def|spa|spd|spc|spe)$/.test(entry))) continue;
    throw new Error(title+' has an unsupported line: '+line+'. Separate Pokémon with a blank line.');
  }
  const set=Teams.import(block)?.[0];
  const species=dex.species.get(set?.species);
  if (!lookup(species.num) || species.gen!==1 || species.forme) throw new Error('Unknown Kanto species: '+title);
  if (set.item) throw new Error(species.name+' cannot hold an item in RBY.');
  if (set.ability && !/^(none|no ability)$/i.test(set.ability)) throw new Error(species.name+' cannot have an ability in RBY.');
  const member={id:species.num,moves:(set.moves || []).filter(Boolean).map(name=>{
    const move=dex.moves.get(name);
    if (!move.exists || move.gen!==1) throw new Error(species.name+' has an unknown RBY move: '+name);
    return move.num;
  })};
  if (set.name) member.name=set.name;
  if (set.level!==undefined && set.level!==100) member.level=set.level;
  for (const stat of ['evs','ivs']) {
    if (!set[stat]) continue;
    if (Object.values(set[stat]).some(v=>v>(stat==='evs'?255:31))) throw new Error(species.name+' has out-of-range '+stat.toUpperCase()+'.');
    set[stat].spd=set[stat].spa; // RBY has one Special stat.
    if (Object.values(set[stat]).some(v=>v!==(stat==='evs'?252:31))) member[stat]=set[stat];
  }
  return member;
}

export function importTeam(text,format,locked=false) {
  let body=text.trim().replace(/\r\n?/g,'\n'),name='';
  if (!body) throw new Error('Paste a Showdown team first.');
  const headers=body.match(/^===.*$/gm) || [];
  if (headers.length>1) throw new Error('Import one team at a time.');
  if (headers.length) {
    const header=body.match(/^===\s*(?:\[([^\]]+)\]\s*)?(.+?)\s*===[ \t]*(?:\n|$)/);
    if (!header) throw new Error('Use a Showdown team heading on the first line.');
    const [,tag,title]=header;
    if (tag && ![CASUAL,OU].includes(tag)) throw new Error('Unsupported battle format: '+tag);
    if (tag && !locked) format=tag;
    name=title;body=body.slice(header[0].length).trim();
  }
  const blocks=body.split(/\n[ \t]*\n(?:[ \t]*\n)*/);
  if (!body || blocks.length>6) throw new Error('Choose one to six Pokémon.');
  const party=blocks.map(parseSet);
  checkedTeam(party,format);
  return {name,format,party};
}

export function exportTeam(party,format) {
  const sets=checkedTeam(party,format);
  return sets.map((set,i)=>{
    if (!party[i].evs) delete set.evs;
    let text=Teams.export([set]).trimEnd();
    // Showdown omits an all-zero spread. In RBY a missing spread means maximum stats.
    if (set.evs && Object.values(set.evs).every(v=>v===0)) text=text.replace('\n','\nEVs: 0 HP\n');
    return text;
  }).join('\n\n');
}

export function readTeams(storage) {
  if (!storage) throw new Error('Browser storage is unavailable. Export your team to keep a copy.');
  const saved=JSON.parse(storage.getItem(key) || '[]');
  if (!Array.isArray(saved)) throw new Error('Could not read the saved team library.');
  return saved;
}

export function storeTeam(storage,name,format,party,update=false) {
  name=name.trim();
  if (!name || name.length>80) throw new Error('Give your team a name of 1 to 80 characters.');
  checkedTeam(party,format);
  const saved=readTeams(storage);
  const index=saved.findIndex(t=>t.name.toLowerCase()===name.toLowerCase());
  if (index>=0 && !update) throw new Error('That name is already in your library. Load it to update it, or choose another name.');
  const entry={name,format,party};
  if (index<0) saved.push(entry);else saved[index]=entry;
  storage.setItem(key,JSON.stringify(saved));
}

export function removeTeam(storage,name) {
  storage.setItem(key,JSON.stringify(readTeams(storage).filter(t=>t.name!==name)));
}
