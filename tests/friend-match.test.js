import test from 'node:test';
import assert from 'node:assert/strict';
import {createPartyMatch} from '../src/gen1-battle.js';
import {friendEvents,friendView,legalCommand} from '../src/friend-match.js';
const host=[{id:101,moves:[153]},{id:143,moves:[69]}];
const guest=[{id:94,moves:[122]},{id:129,moves:[150]}];

test('friend views expose own choices and hide opponents’ reserve species and equipped moves',()=>{
  const match=createPartyMatch(host,guest,21);
  for(const side of [false,true]){
    const v=friendView(match.view(),side);
    assert.deepEqual(v.playerParty.map(m=>m.id),(side?guest:host).map(m=>m.id));
    assert.deepEqual(v.choices.map(c=>c.id),side?[122]:[153]);
    assert.deepEqual(v.rivalParty,[{hp:1},{hp:1}]);
    assert.equal(v.rivalSlot,undefined);assert.equal(v.rivalChoices,undefined);
  }
});
test('both screens get matching HP and opposite requests on a forced replacement',()=>{
  const match=createPartyMatch(host,guest,21);
  const events=match.turn(153,122);
  const h=friendView(match.view(),false),g=friendView(match.view(),true);
  assert.equal(h.playerRequest,'switch');assert.equal(g.playerRequest,'wait');
  assert.equal(legalCommand(h,'player',{switch:1}),true);
  assert.equal(legalCommand(g,'player',{switch:1}),false);
  const mirrored=friendEvents(events,true);
  assert.equal(mirrored.at(-1).rivalHP,h.playerHP);
  assert.equal(mirrored[0].meta.before.rivalHP,events[0].meta.before.playerHP);
  const replacement=friendEvents(match.turn({switch:1},null),true)[0];
  assert.equal(replacement.side,'rival');assert.equal(replacement.rivalSpeciesId,143);
  assert.match(replacement.text,/Rival sent out Snorlax/);
});
test('commands are tied to the current move id and slot, and the winner is trainer-relative',()=>{
  const match=createPartyMatch([host[0]],[guest[0]],21);
  const view=match.view();
  assert.equal(legalCommand(view,'rival',{id:153,slot:1}),false);
  assert.equal(legalCommand(view,'rival',{id:122,slot:4}),false);
  assert.equal(legalCommand(view,'rival',{id:122,slot:1}),true);
  match.turn(153,122);
  assert.equal(friendView(match.view(),true).winner,'player');
  assert.equal(friendView(match.view(),false).winner,'rival');
});
