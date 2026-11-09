import test from 'node:test';
import assert from 'node:assert/strict';
import {lookup} from '../src/roster.js';
import {moveById} from '../src/gen1-data.js';
import {loadTeam} from '../src/team.js';
import {buildExhibition, createBattle, damageMultiplier, eventFrame, playEvents} from '../src/battle.js';

test('saved arcade teams migrate to legal Gen I moves without losing the selected species',()=>{
 const storage={getItem:key=>key==='indigo.kanto.pair'?'[132,129]':null};
 const team=loadTeam(storage);
 assert.deepEqual(team.map(c=>c.id),[132,129]);
 assert.deepEqual(team[0].moves,[144]);
 assert.ok(team[1].moves.every(id=>lookup(129).learnset.includes(id)));
});
test('battle buttons distinguish type immunities from Gen I fixed damage',()=>{
 assert.equal(damageMultiplier(moveById(85),['Rock','Ground']),0);
 assert.equal(damageMultiplier(moveById(69),['Ghost','Poison']),1);
 assert.equal(damageMultiplier(moveById(53),['Bug','Grass']),4);
});
test('replay and playback sample real turn results without applying damage before impact',()=>{
 const team=[{id:25,moves:[85]},{id:131,moves:[55]}],match=createBattle(team,1984);
 const before=match.view();const events=match.turn(85,55);
 const segments=playEvents(events,before,match.view());
 for(const segment of segments){
  assert.equal(eventFrame(segment,0,.1).rivalHP,segment.before.rivalHP);
  assert.equal(eventFrame(segment,1,.8).rivalHP,segment.after.rivalHP);
 }
 const replay=buildExhibition(team),second=buildExhibition(team);
 assert.deepEqual(replay(23.5),second(23.5));assert.deepEqual(replay(46),replay(1));
 assert.equal(replay(2).action,'send');
 for(let t=0;t<45;t+=.5){const f=replay(t);
  assert.ok(f.playerHP>=0 && f.playerHP<=f.playerMaxHP);
  if(f.move)assert.ok(team.some(c=>c.moves.includes(f.move.id)));
 }
});
