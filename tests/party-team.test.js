import test from 'node:test';
import assert from 'node:assert/strict';
import * as team from '../src/team.js';
import {validateLoadout} from '../src/gen1-data.js';
import {lookup} from '../src/roster.js';
const make=(id)=>({id,moves:[...lookup(id).defaultMoves]});
const storage=(seed={})=>({getItem:key=>seed[key]??null,setItem:(key,value)=>{seed[key]=value}});

test('a prior pair and both custom movesets become matching one-member parties',()=>{
 const pair=[{id:25,moves:[85]},{id:131,moves:[55]}];
 const result=team.loadParties(storage({'pokemon-battle-field.team.v1':JSON.stringify(pair)}));
 assert.deepEqual(result,[[pair[0]],[pair[1]]]);
});
test('generated rivals match all six party sizes and every set is legal',()=>{
 for(let size=1;size<=6;size++){
  const party=team.generateRival(size);
  assert.equal(party.length,size);assert.equal(new Set(party.map(p=>p.id)).size,size);
  for(const p of party)assert.equal(validateLoadout(p.id,p.moves),null);
 }
 assert.throws(()=>team.generateRival(7));assert.throws(()=>team.generateRival(0));
});
test('storage preserves independent duplicate species slots and their matched opponent',()=>{
 const home=[{id:25,moves:[85]},{id:25,moves:[98]},make(132),make(1),make(129),make(143)];
 const pair=[home,team.generateRival(home.length)],s=storage();
 team.saveParties(s,pair);assert.deepEqual(team.loadParties(s),pair);
});
