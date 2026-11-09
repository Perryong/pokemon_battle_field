import test from 'node:test';
import assert from 'node:assert/strict';
import * as battle from '../src/battle.js';

test('computer waits or replaces a fainted member instead of inventing a move',()=>{
 const roster=[{slot:0,id:25,hp:0,maxHP:273,active:true,canSwitch:false},
  {slot:1,id:131,hp:390,maxHP:460,active:false,canSwitch:true}];
 const view={rivalRequest:'switch',rivalParty:roster,playerTypes:['Ground'],rivalChoices:[]};
 assert.deepEqual(battle.pickAction(view,'rival'),{switch:1});
 assert.equal(battle.pickAction({...view,rivalRequest:'wait'},'rival'),null);
});
test('switch playback swaps the displayed species at arrival, before an opposing strike',()=>{
 const a={playerSpeciesId:25,playerBaseId:25,playerHP:123},b={playerSpeciesId:131,playerBaseId:131,playerHP:450};
 const seg={event:{side:'player',meta:{switch:true},text:'Go, Lapras!'},before:a,after:b};
 assert.equal(battle.eventFrame(seg,0,.2).playerSpeciesId,25);
 assert.equal(battle.eventFrame(seg,0,.7).playerSpeciesId,131);
 assert.equal(battle.eventFrame(seg,0,.7).action,'switch-player');
});
