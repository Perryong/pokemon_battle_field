import {moveById, effectiveness} from './gen1-data.js';
import {createPartyMatch} from './gen1-battle.js';
import {lookup} from './roster.js';

export const SHOW_LENGTH = 45;
export const createBattle = ([player,rival], seed, format) =>
  createPartyMatch(Array.isArray(player)?player:[player],Array.isArray(rival)?rival:[rival],seed,format);

export function damageMultiplier(move,types) {
  const chart = effectiveness(move.type,types);
  if (chart === 0 && !move.ignoreImmunity) return 0;
  if (move.power <= 1 || move.damage || move.ohko) return 1;
  return chart;
}

const fixedPower = {12:110,32:110,49:35,68:45,69:90,82:40,90:110,101:90,117:50,149:55,162:95};
const recover = new Set([105,135,156]);

// Computer choices are tactical estimates. The simulator resolves every move.
export function pickMove(view, side) {
  const player = side === 'player';
  const options = (player ? view.choices : view.rivalChoices).filter(option => !option.disabled);
  if (!options.length) throw new Error('No legal turn choice is available.');
  if (options.length === 1) return options[0];
  const attackTypes = player ? view.playerTypes : view.rivalTypes;
  const defendTypes = player ? view.rivalTypes : view.playerTypes;
  const fraction = player ? view.playerHP / view.playerMaxHP : view.rivalHP / view.rivalMaxHP;
  const score = option => {
    const move = moveById(option.id);
    if (!move) return 0;
    if (move.category === 'Status') {
      if (recover.has(move.id)) return fraction < .45 ? 125 : 0;
      return 11 + (view.round * 11 + move.id) % 26;
    }
    const power = fixedPower[move.id] || move.power;
    const match = damageMultiplier(move, defendTypes);
    return power * (move.accuracy ?? 100) / 100 * match *
      (attackTypes.includes(move.type) ? 1.5 : 1) + (view.round * 5 + move.id) % 7;
  };
  return options.reduce((best, next) => score(next) > score(best) ? next : best);
}

// Commands come from the simulator's current request. A replacement has no opposing move.
export function pickAction(view,side) {
  const request=view[side+'Request'];
  if (request === 'wait' || request === 'ended') return null;
  const reserves=view[side+'Party'].filter(mon=>mon.canSwitch);
  const otherTypes=view[side==='player'?'rivalTypes':'playerTypes'];
  const matchup=mon=>{
    const types=lookup(mon.id).types;
    const offense=Math.max(...types.map(t=>effectiveness(t,otherTypes)));
    const risk=Math.max(...otherTypes.map(t=>effectiveness(t,types)));
    return offense - risk + .25*mon.hp/mon.maxHP;
  };
  const best=reserves.reduce((lead,next)=>!lead||matchup(next)>matchup(lead)?next:lead,null);
  if (request === 'switch') return {switch:best.slot};
  const move=pickMove(view,side);
  const active=view[side+'Party'].find(mon=>mon.active);
  // Switch out of a bad matchup if there is a much better bench option.
  if (best && !move.forced && matchup(active)<-1 && matchup(best)>matchup(active)+2)
    return {switch:best.slot};
  return move;
}

export function animationSlot(side, move) {
  if (!move) return 'idle';
  if (side === 'rival') return move.power >= 75 ? 'blast' : 'flame';
  if (move.category === 'Status') return 'guard';
  if (move.delivery !== 'contact') return 'bolt';
  return move.power >= 75 ? 'tail' : 'quick';
}

export function playEvents(events, initial, final) {
  let prior = initial;
  return events.map((event, index) => {
    const before = {...prior, ...event.meta?.before};
    const after = {...before, ...(index === events.length - 1 ? final : {}), ...event};
    prior = after;
    return {event, before, after};
  });
}

export function eventFrame(segment, t, u) {
  const {event, before, after} = segment;
  const move = event.moveId ? moveById(event.moveId) : null;
  const snapshot = u < .5 ? before : after;
  const actorKey = event.side === 'rival' ? 'rivalSpeciesId' : 'playerSpeciesId';
  const name = lookup(before[actorKey])?.name || (event.side === 'rival' ? 'Rival' : 'Your fighter');
  return {...snapshot, t, u, action:event.meta?.switch ? 'switch-'+event.side : animationSlot(event.side,move), move,
    meta:event.meta || {}, hit:event.hit, attackType:move?.type,
    label: event.meta?.switch ? 'Switch Pokémon' : move?.name || 'Battle',
    caption:u < .45 && move ? name + ' used ' + move.name + '!' : event.text};
}

export function idleFrame(view,t,caption) {
  return {...view,t,action:'idle',u:0,label:'Face-off',caption,move:null,hit:false};
}

// An exhibition plays an independent, seeded simulation. Store the resolved
// events once so scrubbing cannot reroll a hit, critical, or secondary effect.
export function buildExhibition(team,format) {
  const seed = team.flat().flatMap(config => [config.id,...config.moves])
    .reduce((value,id) => Math.imul(value,31) + id >>> 0,151);
  const match = createBattle(team,seed,format);
  const initial = match.view(), segments = [];
  for (let n = 0; n < 24 && !match.view().winner && match.view().round <= 5; n++) {
    const before = match.view();
    const events = match.turn(pickAction(before,'player'),pickAction(before,'rival'));
    segments.push(...playEvents(events,before,match.view()));
  }
  const final = match.view();
  const weights = segments.map(s => s.event.moveId ? 1 : .45);
  const total = weights.reduce((a,b) => a+b,0);
  let cursor = 5;
  const times = weights.map(w => {
    const start = cursor;
    cursor += 35*w/total;
    return {start,end:cursor};
  });
  return time => {
    const t = ((time % SHOW_LENGTH) + SHOW_LENGTH) % SHOW_LENGTH;
    if (t < 4) return {...idleFrame(initial,t,'A Poké Ball opens on the pitch.'),action:'send',label:'Send-out',u:t/4};
    if (t < 5) return idleFrame(initial,t,'Both Pokémon are ready.');
    const index = times.findIndex(beat => t >= beat.start && t < beat.end);
    if (index >= 0) {
      const beat = times[index];
      return eventFrame(segments[index],t,(t-beat.start)/(beat.end-beat.start));
    }
    const victor = lookup(final[final.winner+'BaseId']);
    const caption = victor ? lookup(victor.id).name+' wins the exhibition.' : 'The exhibition ends at the time limit.';
    const frame = idleFrame(final,t,caption);
    return final.winner === 'player' ? {...frame,action:'recall',label:'Recall',u:(t-40)/5} : {...frame,label:'Exhibition complete'};
  };
}
