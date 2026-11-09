import {Battle, Dex, extractChannelMessages} from '@pkmn/sim';

import {moveById,validateLoadout} from './gen1-data.js';
import {lookup} from './roster.js';

const dex=Dex.forGen(1);
const sides=['player','rival'];
const stats={atk:'Attack',def:'Defense',spa:'Special',spd:'Special',spe:'Speed',accuracy:'accuracy',evasion:'evasiveness'};
const statusNames={brn:'burned',psn:'poisoned',tox:'badly poisoned',par:'paralyzed',slp:'asleep',frz:'frozen'};
const sideOf=ref=>ref?.startsWith('p1')?'player':ref?.startsWith('p2')?'rival':null;
const monName=ref=>ref?.split(': ').slice(1).join(': ')||'';
const effectName=s=>s?.replace(/^move: /,'')||'';

function teamMember(speciesId,moveIds) {
  const mon=lookup(speciesId);
  if(!Number.isInteger(speciesId)||!mon)throw new RangeError(`Unknown RBY species ${speciesId}`);
  const problem=validateLoadout(mon,moveIds);
  if(problem)throw new RangeError(problem);
  const names=moveIds.map(id=>moveById(id).name);
  return {species:mon.name,moves:names,level:100,evs:{hp:252,atk:252,def:252,spa:252,spd:252,spe:252}};
}
function battleSeed(seed) {
  if(seed===undefined)return undefined;
  if(Number.isInteger(seed)&&seed>=0&&seed<=0xffffffff)return [0,0,seed>>>16,seed&0xffff];
  if(Array.isArray(seed)&&seed.length===4&&seed.every(n=>Number.isInteger(n)&&n>=0&&n<=65535))return [...seed];
  throw new TypeError('Use a uint32 seed or an array of four uint16 words.');
}
function stateOf(battle,parties) {
  const result={};
  for(const [i,key] of sides.entries()){
    const mon=battle.sides[i].active[0];
    result[key+'Slot']=parties[i].indexOf(mon);result[key+'BaseId']=mon.baseSpecies.num;
    result[key+'HP']=mon.hp;result[key+'MaxHP']=mon.maxhp;
    result[key+'SpeciesId']=mon.species.num;result[key+'Types']=[...mon.getTypes()];result[key+'Status']=mon.status==='fnt'?'':mon.status;
  }
  return result;
}
function available(side) {
  const request=side.activeRequest?.active?.[0];
  if(!request)return [];
  const active=side.pokemon[0];
  return request.moves.map((entry,i)=>{
    const real=dex.moves.get(entry.id),slot=active.moveSlots.find(s=>s.id===entry.id);
    const id=entry.id==='fight'?0:entry.id==='recharge'?-1:real.num;
    return {id,name:entry.move,pp:entry.pp??slot?.pp??null,maxPP:entry.maxpp??slot?.maxpp??null,
      disabled:!!entry.disabled,forced:entry.pp===undefined,slot:i+1};
  });
}

// Channel -1 receives exact HP once per change, even for opponent/recoil and
// multi-hit damage. Fold messages into actions before exposing them to the UI.
function turnEvents(lines,before,after) {
  const state={...before},events=[];
  let current, direct;
  function finish(){if(current){Object.assign(current,state);current.text=current.notes.join(' ');delete current.notes;events.push(current);current=null;}}
  function begin(side,moveId,text){finish();direct=null;current={side,moveId,notes:text?[text]:[],hit:false,meta:{before:{...state}}};}
  function note(text){if(current&&text)current.notes.push(text);}
  for(const line of extractChannelMessages(lines.join('\n'),[-1])[-1]){
    const [,tag,ref,value,detail,...flags]=line.split('|'),side=sideOf(ref),name=monName(ref);
    if(tag==='switch'){
      begin(side,null,`${side==='player'?'Player':'Rival'} sent out ${name}.`);
      current.meta.switch=true;
      const species=dex.species.get(value.split(',')[0]);
      const [health,status='']=detail.split(' '),[hp,maxHP]=health.split('/').map(Number);
      state[side+'BaseId']=species.num;state[side+'SpeciesId']=species.num;
      state[side+'Types']=[...species.types];state[side+'Slot']=after[side+'Slot'];
      state[side+'HP']=hp;state[side+'MaxHP']=maxHP;state[side+'Status']=status;
      continue;
    }
    if(tag==='move'){
      const m=dex.moves.get(value),called=[detail,...flags].some(f=>f?.startsWith('[from] ')&&['metronome','mirrormove'].includes(dex.moves.get(effectName(f.slice(7))).id));
      if(called&&current?.side===side){current.meta.calledMoveId=m.num;note(`It called ${m.name}.`);}
      else begin(side,m.num,`${name} used ${m.name}.`);
      current.meta.phase='strike';continue;
    }
    if(tag==='cant'){
      const why={slp:'is fast asleep.',frz:'is frozen solid.',par:'is fully paralyzed.',flinch:'flinched.',recharge:'must recharge.',partiallytrapped:'is trapped.',Disable:`cannot use ${detail||'its disabled move'}.`};
      begin(side,null,`${name} ${why[value]||'cannot move.'}`);continue;
    }
    if((tag==='-activate'||tag==='-end')&&effectName(value)==='Bide'){
      const charge=tag==='-activate';begin(side,117,`${name} ${charge?'is storing energy.':'unleashed its stored energy.'}`);current.meta.phase=charge?'charge':'strike';continue;
    }
    // Confusion and waking can consume the entire action with no |move| line.
    if(tag==='-activate'&&value==='confusion'){begin(side,null,`${name} is confused.`);continue;}
    if(tag==='-curestatus'&&value==='slp'&&current?.side!==side&&!line.includes('[silent]'))begin(side,null,'');
    if(!current&&side&&['-damage','-heal','-curestatus','faint'].includes(tag))begin(side,null,'');
    if(!current)continue;
    const targetIsOpponent=side&&side!==current.side;
    switch(tag){
      case '-damage':case '-heal':case '-sethp':{
        if(!side)break;
        const hpKey=side+'HP',previous=state[hpKey],next=Number.parseInt(value,10),delta=Math.abs(next-previous);
        state[hpKey]=next;
        if(tag==='-heal'){note(`${name} recovered ${delta} HP.`);break;}
        if(tag==='-damage'){
          const from=detail?.startsWith('[from] ')?effectName(detail.slice(7)):null;
          if(targetIsOpponent&&(!from||from==='Bide'))current.hit=true;
          if(from)note(`${name} lost ${delta} HP to ${['brn','psn','tox'].includes(from)?(from==='brn'?'its burn':'poison'):from}.`);
          else if(delta){
            if(!direct||direct.name!==name)direct={name,total:0,at:current.notes.length};
            direct.total+=delta;current.notes[direct.at]=`${name} lost ${direct.total} HP.`;
          }
        }
        break;
      }
      case '-status':state[side+'Status']=value;note(`${name} is ${statusNames[value]||value}.`);if(targetIsOpponent)current.hit=true;break;
      case '-curestatus':state[side+'Status']='';if(!line.includes('[silent]'))note(value==='slp'?`${name} woke up.`:`${name} recovered from ${statusNames[value]||value}.`);break;
      case '-transform':{
        const target=sideOf(value);state[side+'SpeciesId']=state[target+'SpeciesId'];state[side+'Types']=[...state[target+'Types']];
        note(`${name} transformed into ${monName(value)}.`);break;
      }
      case '-boost':case '-unboost':
        if(value==='spd')break; // Gen I has one Special stat; Showdown internally pairs SpA and SpD.
        note(`${name}’s ${stats[value]||value} ${tag==='-boost'?'rose':'fell'}${Number(detail)>1?' sharply':''}.`);
        if(targetIsOpponent)current.hit=true;break;
      case '-start':
        if(value==='typechange'){state[side+'Types']=detail.split('/');note(`${name} became ${detail} type.`);}
        else if(value==='Mimic')note(`${name} copied ${detail}.`);
        else if(value==='Disable')note(`${name}’s ${detail} was disabled.`);
        else if(value==='confusion')note(`${name} became confused.`);
        else if(value==='Bide'){current.meta.phase='charge';note(`${name} began storing energy.`);}
        else if(!line.includes('[silent]'))note(`${effectName(value)} took effect on ${name}.`);
        if(targetIsOpponent)current.hit=true;break;
      case '-end':if(!line.includes('[silent]'))note(`${name}’s ${effectName(value)} ended.`);break;
      case '-activate':if(value==='Substitute'&&detail==='[damage]'){current.hit=true;note('The substitute took the hit.');}break;
      case '-prepare':current.meta.phase='charge';note(`${name} is preparing ${value}.`);break;
      case '-mustrecharge':note(`${name} must recharge next turn.`);break;
      case '-hitcount':current.meta.hits=Number(value);note(`Hit ${value} times.`);break;
      case '-crit':current.meta.critical=true;note('A critical hit!');break;
      case '-supereffective':note('It was super effective.');break;
      case '-resisted':note('It was not very effective.');break;
      case '-immune':note(`It had no effect on ${name}.`);current.meta.immune=true;break;
      case '-miss':current.meta.missed=true;note('The attack missed.');break;
      case '-fail':note('But it failed.');current.meta.failed=true;break;
      case '-ohko':note('One-hit knockout!');break;
      case '-clearallboost':note('Stat changes were reset.');break;
      case '-nothing':note('Nothing happened.');break;
      case '-message':note(ref);break;
      case 'faint':state[side+'HP']=0;state[side+'Status']='';note(`${name} fainted.`);break;
    }
  }
  finish();
  // Preserve the authoritative end state after residual effects with no display line.
  if(events.length)Object.assign(events.at(-1),after);
  return events;
}

function team(party) {
  if(!Array.isArray(party)||party.length<1||party.length>6)throw new RangeError('Choose one to six party members.');
  return Array.from(party,member=>teamMember(member?.id,member?.moves));
}
function requestOf(side) {
  return side.battle.ended?'ended':side.requestState||'wait';
}
function canSwitch(side,mon) {
  if(!mon || mon===side.active[0] || mon.fainted)return false;
  const request=requestOf(side);
  return request==='switch' || (request==='move' && !side.active[0].trapped);
}
function choiceFor(side,party,selection,key) {
  const request=requestOf(side);
  if(request==='wait'){
    if(selection===null)return null;
    throw new RangeError(`The ${key} must wait for a replacement.`);
  }
  if(selection && typeof selection==='object' && 'switch' in selection){
    const slot=selection.switch,mon=Number.isInteger(slot)?party[slot]:null;
    if(!canSwitch(side,mon))throw new RangeError(`Unavailable ${key} switch to slot ${slot}.`);
    return 'switch '+(mon.position+1);
  }
  if(request==='switch')throw new RangeError(`The ${key} must choose a replacement.`);
  // Mimic can create two slots with the same move but separate PP.
  const id=selection?.id??selection,slot=selection?.slot;
  const legal=available(side).find(x=>x.id===id&&!x.disabled&&(slot===undefined||x.slot===slot));
  if(!legal)throw new RangeError(`Unavailable ${key} move ${id}.`);
  return 'move '+legal.slot;
}

/** A synchronous level-100 RBY singles match. Party slots keep their original order. */
export function createPartyMatch(playerParty,rivalParty,seed) {
  const battle=new Battle({formatid:'gen1customgame',seed:battleSeed(seed)});
  battle.setPlayer('p1',{name:'Player',team:team(playerParty)});
  battle.setPlayer('p2',{name:'Rival',team:team(rivalParty)});
  // Showdown swaps Pokémon positions on each switch; retain the original objects.
  const parties=battle.sides.map(side=>[...side.pokemon]);
  return {
    view(){
      const winner=!battle.ended?null:battle.winner==='Player'?'player':battle.winner==='Rival'?'rival':'draw';
      const view={...stateOf(battle,parties),round:battle.turn,winner};
      for(const [i,key] of sides.entries()){
        const side=battle.sides[i];
        view[key+'Request']=requestOf(side);
        view[key==='player'?'choices':'rivalChoices']=view[key+'Request']==='move'?available(side):[];
        view[key+'Party']=parties[i].map((mon,slot)=>({
          slot,id:mon.baseSpecies.num,hp:mon.hp,maxHP:mon.maxhp,status:mon.status==='fnt'?'':mon.status,
          active:mon===side.active[0],canSwitch:canSwitch(side,mon),
        }));
      }
      return view;
    },
    turn(playerChoice,rivalChoice){
      if(battle.ended)throw new Error('This match has ended.');
      const commands=[playerChoice,rivalChoice].map((choice,i)=>choiceFor(battle.sides[i],parties[i],choice,sides[i]));
      // Only commit when both choices have passed the simulator's validation.
      for(const [i,cmd] of commands.entries()){
        const side=battle.sides[i];
        if(cmd && !side.choose(cmd)){
          const message=side.choice.error;
          for(const participant of battle.sides)participant.clearChoice();
          throw new RangeError(message);
        }
      }
      const before=stateOf(battle,parties),start=battle.log.length;
      battle.commitChoices();
      return turnEvents(battle.log.slice(start),before,stateOf(battle,parties));
    },
  };
}

export function createMatch(playerId,rivalId,playerMoveIds,rivalMoveIds,seed) {
  return createPartyMatch([{id:playerId,moves:playerMoveIds}],[{id:rivalId,moves:rivalMoveIds}],seed);
}
