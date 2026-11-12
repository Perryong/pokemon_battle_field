import catalog from './strategy-sets.json' with {type:'json'};
import {moveById} from './gen1-data.js';

export const strategySets=mon=>catalog[mon.id] || [{name:'Field Guide set',tier:'local',moves:mon.defaultMoves}];
export const tierName=tier=>({middlecup:'Middle Cup',lclevel100:'Level 100 LC',ubers:'Ubers',local:'Field Guide'})[tier] || tier.toUpperCase();
export const smogonPage=mon=>'https://www.smogon.com/dex/rb/pokemon/'+mon.name.toLowerCase()
  .replace(' ','-').replace('♀','-f').replace('♂','-m').replace(/[^a-z0-9-]/g,'')+'/';

export function roleText(mon,set) {
  const names=set.moves.map(id=>moveById(id).name);
  const has=move=>names.includes(move);
  if (mon.id===128 && has('Hyper Beam')) return 'Late-game cleaner. Use Body Slam to weaken opponents and Hyper Beam to finish a knockout.';
  if (mon.id===113 && has('Soft-Boiled')) return 'Special wall. Switch into special attacks and use Soft-Boiled to stay healthy.';
  if (mon.id===132) return 'Copy the opposing Pokémon with Transform to borrow its moves and stat changes.';
  if (has('String Shot')) return 'Speed support. String Shot lowers the target’s Speed to help a teammate move first.';
  const sleep=names.find(name=>['Sleep Powder','Lovely Kiss','Sing','Spore','Hypnosis'].includes(name));
  if (sleep) return 'Sleep support. Use '+sleep+' to create a turn for a teammate to switch in.';
  const boost=names.find(name=>['Swords Dance','Amnesia','Agility','Growth','Meditate'].includes(name));
  if (boost) return 'Setup attacker. Use '+boost+' on a safe turn before applying offensive pressure.';
  if (has('Reflect') && has('Rest')) return 'Physical wall. Use Reflect to absorb hits and Rest to recover HP.';
  if (has('Thunder Wave') || has('Stun Spore')) return 'Speed control. Paralyze faster opponents to help slower teammates move first.';
  if (has('Explosion') || has('Self-Destruct')) return 'Trade attacker. Weaken an opponent before sacrificing this Pokémon for a knockout.';
  const bind=names.find(name=>['Wrap','Fire Spin','Clamp','Bind'].includes(name));
  if (bind) return 'Trapping support. Use '+bind+' to deny actions while it holds.';
  if (has('Recover') || has('Soft-Boiled') || has('Rest')) return 'Bulky attacker. Recover HP between attacks to stay on the field longer.';
  const attack=set.moves.map(moveById).find(move=>move.category!=='Status');
  return attack?'Attacker. Use '+attack.name+' to pressure opponents and switch when the matchup turns unfavorable.':'Utility. Use this set to support a teammate.';
}
