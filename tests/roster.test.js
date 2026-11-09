import test from 'node:test';
import assert from 'node:assert/strict';
import {roster,lookup} from '../src/roster.js';
test('the Kanto roster has every default species exactly once in national order',()=>{
 assert.deepEqual(roster.map(p=>p.id),Array.from({length:151},(_,i)=>i+1));
 assert.equal(lookup(1).name,'Bulbasaur');assert.equal(lookup(151).name,'Mew');
 assert.equal(lookup(29).name,'Nidoran♀');assert.equal(lookup(32).name,'Nidoran♂');
 for(const s of roster){assert.ok(s.metres>0 && s.kg>0 && s.types.length>0)}
});
test('Pokédex measurements use metres and kilograms without size clamping',()=>{
 for(const [id,m,kg] of [[25,.4,6],[6,1.7,90.5],[50,.2,.8],[95,8.8,210],[143,2.1,460],[151,.4,4]]){
  assert.equal(lookup(id).metres,m);assert.equal(lookup(id).kg,kg)}
 assert.equal(lookup(95).metres/lookup(50).metres,44);
});
