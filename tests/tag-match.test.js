import test from 'node:test';
import assert from 'node:assert/strict';
import {createTagMatch,tagComputerChoice,tagTeam} from '../src/tag-match.js';
const mon=(id,moves,level=100)=>({id,moves,level});
const mew=()=>mon(151,[1,89,14]);
const match=parties=>createTagMatch(parties,[1,2,3,4]);
const act=(v,id,target)=>v.choices.find(c=>c.move===id && c.target===target)?.command;
test('four trainers can select distinct legal targets and only switch their own party',()=>{
 const m=match([[mew(),mon(25,[85])],[mew()],[mew()],[mew()]]);
 assert.deepEqual(m.view(0).choices.filter(c=>c.move===1).map(c=>c.target),[1,2,3]);
 assert.equal(m.view(2).choices.some(c=>c.kind==='switch'),false);
 assert.throws(()=>m.turn(['move 99','move 1 +1','move 1 +1','move 1 +1']));
 const before=m.view(0);
 const events=m.turn([act(before,1,3),act(m.view(1),14),act(m.view(2),14),act(m.view(3),14)]);
 assert.ok(events.some(e=>e.actor===0 && e.target===3 && e.move===1));
 assert.equal(m.view(0).field[1].hp,before.field[1].hp);
 assert.equal(m.view(0).choices[0].pp,before.choices[0].pp-1);
 assert.throws(()=>tagTeam(Array(4).fill(mew())),/three/);
});
test('spread damage reaches the partner and both opponents, and tag AI chooses enemies',()=>{
 const m=match(Array.from({length:4},()=>[mew()])),before=m.view(0);
 m.turn([act(before,89),...Array.from({length:3},(_,i)=>act(m.view(i+1),1,0+(i===1?1:0)))]);
 assert.ok(m.view(0).field.slice(1).every((p,i)=>p.hp<before.field[i+1].hp));
 const v=m.view(3);for(let i=0;i<50;i++){
   const command=tagComputerChoice(v),c=v.choices.find(c=>c.command===command);assert.ok(c.target==null || c.target%2!==1);
 }
});
test('a fainted trainer replaces independently, and their partner can finish the battle',()=>{
 const strong=mon(150,[129]),weak=()=>mon(129,[150],1);
 const m=match([[strong],[weak(),weak()],[weak()],[weak()]]);
 for(let i=0;i<12 && !m.view(0).ended;i++){
   const views=[0,1,2,3].map(n=>m.view(n));
   m.turn(views.map(tagComputerChoice));
   if(i===0){
     assert.equal(m.view(1).forced,true);assert.deepEqual(m.view(3).choices,[]);assert.deepEqual(m.view(0).choices,[]);
   }
 }
 assert.equal(m.view(3).winner,'Blue');assert.equal(m.view(3).ended,true);
});
test('a charging move finishes on its original target without a second target selection',()=>{
 const dig=mon(23,[91]),buff=mon(151,[14]);
 const m=match([[dig],[buff],[buff],[buff]]);
 m.turn([act(m.view(0),91,3),...Array(3).fill('move 1')]);
 assert.deepEqual(m.view(0).choices.map(c=>c.command),['move 1']);
 const events=m.turn(Array(4).fill('move 1'));
 assert.ok(events.some(e=>e.move===91 && e.target===3));
});
