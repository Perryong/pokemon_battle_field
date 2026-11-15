import {Battle,Dex,extractChannelMessages} from '@pkmn/sim';
import {CASUAL,checkedTeam} from './formats.js';
import {moveById} from './gen1-data.js';
import {lookup} from './roster.js';

const format={...Dex.formats.get('gen3customgame'),name:'Kanto Tag',gameType:'multi',playerCount:4};
export const trainers=['Blue 1','Red 1','Blue 2','Red 2'];
export const sideName=seat=>seat%2?'Red':'Blue';
export function tagTeam(party) {
  if (!Array.isArray(party) || !party.length || party.length>3) throw Error('Choose one to three Pokémon per trainer.');
  return checkedTeam(party,CASUAL);
}
const seatOf=ident=>/^p[1-4][ab]: /.test(ident||'')?Number(ident[1])-1:null;
const monName=ident=>ident?.split(': ').slice(1).join(': ');
function readEvents(log,dex,initial) {
  const field=structuredClone(initial),events=[];
  let beat;
  function add(text,actor,move=0,target=null) {
    beat={text,actor,move,target,field:structuredClone(field),hit:true};
    events.push(beat);
  }
  for (const line of extractChannelMessages(log.join('\n'),[-1])[-1]) {
    const [,tag,ref,value,detail]=line.split('|'),actor=seatOf(ref),name=monName(ref);
    if (actor===null) continue;
    const mon=field[actor];
    if (tag==='move') {
      const target=seatOf(detail);
      add(name+' used '+value+(target!==null && target!==actor?' on '+monName(detail):'')+'.',actor,dex.moves.get(value).num,target);
    } else if (tag==='switch'||tag==='drag') {
      const [health,status='']=detail.split(' ');
      const [hp,maxHP]=health.split('/').map(Number);
      Object.assign(mon,{id:dex.species.get(value.split(',')[0]).num,hp,maxHP,status});
      add(trainers[actor]+' sent out '+name+'.',actor);
    } else if (tag==='-damage'||tag==='-heal') {
      const hp=parseInt(value,10),amount=Math.abs(mon.hp-hp);
      mon.hp=hp;
      if (beat && amount) {
        beat.text+=' '+name+(tag==='-heal'?' recovered ':' lost ')+amount+' HP.';
        if (tag==='-damage') (beat.damaged??=[]).push(actor);
      }
    } else if (tag==='-transform') {
      const target=seatOf(value);if(target!==null) mon.id=field[target].id;
    } else if (tag==='faint') {
      mon.hp=0;add(name+' fainted.',actor);
    } else if (tag==='cant') {
      add(name+' could not move ('+value+').',actor);
    } else if (tag==='-miss' && beat) {
      beat.hit=false;beat.text+=' Missed.';
    } else if (tag==='-prepare' && beat) {
      beat.charge=true;
    } else if (tag==='-status' || tag==='-curestatus') {
      mon.status=tag==='-status'?value:'';
      if(beat) beat.text+=' '+name+(mon.status?' gained ':' recovered from ')+value+'.';
    }
  }
  return events;
}

export function createTagMatch(parties,seed) {
  if (parties.length!==4) throw Error('Four trainer parties are required.');
  const battle=new Battle({format,seed});
  parties.forEach((p,i)=>battle.setPlayer('p'+(i+1),{name:trainers[i],team:tagTeam(p)}));
  function field() {
    return battle.sides.map(s=>{
      const m=s.active[0];
      return {id:m.species.num,hp:m.hp,maxHP:m.maxhp,status:m.status,remaining:s.pokemonLeft};
    });
  }
  function choices(seat) {
    const side=battle.sides[seat],req=side.activeRequest,active=side.active[0],out=[];
    if (battle.ended || !req || req.wait) return out;
    const moves=req.active?.[0];
    for (const [i,entry] of (moves?.moves || []).entries()) {
      if (entry.disabled) continue;
      const move=battle.dex.moves.get(entry.id);
      const base={kind:'move',name:entry.move,move:move.num,pp:entry.pp,maxPP:entry.maxpp,scope:entry.target};
      if (battle.actions.targetTypeChoices(base.scope)) {
        for (const s of battle.sides) {
          const target=s.active[0],loc=active.getLocOf(target);
          if (target.hp && battle.validTargetLoc(loc,active,base.scope)) out.push({...base,target:s.n,command:'move '+(i+1)+' '+(loc>0?'+':'')+loc});
        }
      } else out.push({...base,command:'move '+(i+1)});
    }
    if (req.forceSwitch?.[0] || (moves && !moves.trapped)) {
      for (const [i,m] of side.pokemon.entries()) if (!m.isActive && m.hp) out.push({
        kind:'switch',name:lookup(m.baseSpecies.num).name,hp:m.hp,maxHP:m.maxhp,command:'switch '+(i+1),
      });
    }
    return out;
  }
  function view(seat) {
    return {seat,round:battle.turn,field:field(),choices:choices(seat),forced:!!battle.sides[seat].activeRequest?.forceSwitch,
      ended:battle.ended,winner:battle.ended && battle.winner?sideName(trainers.indexOf(battle.winner)):null};
  }
  function turn(commands) {
    if (battle.ended) throw Error('Match complete.');
    const required=battle.sides.map(s=>choices(s.n));
    for(const [i,options] of required.entries()) {
      if (options.length && !options.some(o=>o.command===commands[i])) throw Error('Invalid command for '+trainers[i]);
    }
    const before=field(),start=battle.log.length;
    for(const side of battle.sides) {
      if (required[side.n].length && !side.choose(commands[side.n])) {
        const error=side.choice.error;
        battle.sides.forEach(s=>s.clearChoice());throw Error(error);
      }
    }
    battle.commitChoices();
    return readEvents(battle.log.slice(start),battle.dex,before);
  }
  return {view,turn};
}

export function tagComputerChoice(view) {
  const moves=view.choices.filter(c=>c.kind==='move' && (c.target==null || c.target%2!==view.seat%2));
  if (!moves.length) return view.choices[0]?.command;
  const dex=Dex.forGen(3),user=view.field[view.seat];
  const species=p=>dex.species.get(lookup(p.id).name);
  function score(c) {
    const move=dex.moves.get(moveById(c.move)?.name || c.name);
    if(move.heal) return user.hp/user.maxHP<.45?125:0;
    if(move.category==='Status') return c.target!=null && view.field[c.target].status?2:15+Math.random()*26;
    const base=move.basePower || (move.damage?75:30);
    const damage=p=>dex.getImmunity(move.type,species(p))?base*2**dex.getEffectiveness(move.type,species(p)):0;
    let power=base;
    if(c.target!=null) power=damage(view.field[c.target]);
    if(c.scope==='allAdjacent' || c.scope==='allAdjacentFoes') {
      power=0;
      view.field.forEach((p,i)=>{
        if(p.hp && i%2!==view.seat%2) power+=damage(p)*.6;
        if(p.hp && i===(view.seat^2) && c.scope==='allAdjacent') power-=damage(p)*.6;
      });
    }
    return power*(move.accuracy===true?1:move.accuracy/100)*(species(user).types.includes(move.type)?1.5:1)+Math.random()*12;
  }
  return moves.map(c=>({c,score:score(c)})).reduce((a,b)=>a.score>=b.score?a:b).c.command;
}
