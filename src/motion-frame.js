import {smoothstep as sm} from './lib/creature.js';
const envelope=(a,b,c,d,u)=>sm(a,b,u)*(1-sm(c,d,u));
// Phase rather than frame count drives the entire roster. An incoming hit
// cannot accidentally wind up both fighters, and seeking has no side effects.
export function motionFrame(t,action,u,side,moveKind){
 const attacker=['quick','tail','bolt','guard'].includes(action)?'player':['flame','blast'].includes(action)?'rival':null;
 const active=attacker===side,incoming=attacker&&!active&&action!=='guard';
 return {t,u,kind:active?(action==='guard'?'guard':moveKind):incoming?'hurt':'idle',
  wind:active?envelope(0,.19,.23,.44,u):0,
  strike:active?envelope(.21,.48,.55,.91,u):0,
  recoil:incoming?envelope(.47,.54,.65,.96,u):0};
}
export function attackKind(action,delivery){
 if(action==='guard')return 'guard';
 if(delivery==='ranged')return 'special';
 return action==='quick'||action==='flame'?'light':'heavy';
}
