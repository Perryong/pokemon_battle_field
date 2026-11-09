import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '../src/gen1-battle.js';

const seed=[1,2,3,4];
const member=(id,...moves)=>({id,moves});
const match=(players,rivals)=>engine.createPartyMatch(players,rivals,seed);

test('party size is one to six on either side',()=>{
  const six=Array.from({length:6},()=>member(129,150));
  assert.equal(match(six,six).view().rivalParty.length,6);
  for(const side of [[],[...six,six[0]]]){
    assert.throws(()=>match(side,six),RangeError);
    assert.throws(()=>match(six,side),RangeError);
  }
});

test('a switch consumes the action and the incoming member takes the attack',()=>{
  const b=match([member(25,85),member(113,107)],[member(143,69)]);
  const [send,attack]=b.turn({switch:1},69);
  assert.equal(send.meta.switch,true);
  assert.deepEqual([send.meta.before.playerBaseId,send.playerBaseId,send.playerSpeciesId],[25,113,113]);
  assert.deepEqual([send.playerHP,send.playerMaxHP,send.playerTypes,send.playerStatus],[703,703,['Normal'],'']);
  assert.equal(attack.meta.before.playerHP,703);
  assert.equal(attack.playerHP,603);
  const v=b.view();
  assert.equal(v.playerBaseId,113);
  assert.deepEqual(v.playerParty.map(p=>[p.slot,p.id,p.hp,p.active,p.canSwitch]),[[0,25,273,false,true],[1,113,603,true,false]]);
});

test('duplicate members retain their own moves, damage, PP and status on the bench',()=>{
  const b=match([member(143,133),member(143,156)],[member(25,86,69)]);
  b.turn(133,86);
  b.turn(133,69);
  const before=b.view();
  assert.equal(before.playerStatus,'par');
  assert.equal(before.playerMaxHP-before.playerHP,100);
  assert.ok(before.choices[0].pp<before.choices[0].maxPP);
  const [out]=b.turn({switch:1},69);
  assert.equal(out.playerStatus,'');
  assert.equal(out.playerHP,before.playerMaxHP);
  assert.deepEqual(b.view().choices.map(c=>c.id),[156]);
  assert.deepEqual(b.view().playerParty.map(p=>[p.slot,p.hp,p.status]),[[0,before.playerHP,'par'],[1,before.playerMaxHP-100,'']]);
  const [back]=b.turn({switch:0},69);
  assert.deepEqual([back.playerSlot,back.playerHP,back.playerStatus],[0,before.playerHP,'par']);
  assert.equal(b.view().choices[0].pp,before.choices[0].pp);
});

test('invalid switch and move choices leave both sides ready to choose again',()=>{
  const b=match([member(25,85),member(129,150)],[member(129,150),member(25,85)]),before=b.view();
  for(const args of [[{switch:0},150],[{switch:2},150],[{switch:'1'},150],[null,150],[{switch:1},{switch:0}],[{switch:1},85]]){
    assert.throws(()=>b.turn(...args),RangeError);
    assert.deepEqual(b.view(),before);
  }
  b.turn({switch:1},{switch:1});
  assert.deepEqual([b.view().playerBaseId,b.view().rivalBaseId],[129,25]);
});

test('an unresolved knockout waits for replacement without using the other side’s move',()=>{
  const b=match([member(25,85),member(129,150)],[member(129,150),member(113,107)]);
  b.turn(85,150);
  const wait=b.view();
  assert.deepEqual([wait.playerRequest,wait.rivalRequest,wait.winner],['wait','switch',null]);
  assert.deepEqual(wait.choices,[]);
  assert.equal(wait.playerParty[1].canSwitch,false);
  for(const choices of [[85,{switch:1}],[{switch:1},{switch:1}],[null,150],[null,{switch:0}]]){
    assert.throws(()=>b.turn(...choices),RangeError);assert.deepEqual(b.view(),wait);
  }
  const [send]=b.turn(null,{switch:1});
  assert.equal(send.meta.switch,true);assert.equal(send.meta.before.rivalHP,0);
  assert.equal(send.rivalHP,703);
  assert.deepEqual([b.view().playerRequest,b.view().rivalRequest],['move','move']);
  assert.equal(b.view().rivalParty[0].canSwitch,false);
  assert.throws(()=>b.turn(85,{switch:0}),RangeError);
});

test('both players replace after Explosion, in log order, before either acts again',()=>{
  const b=match([member(101,153),member(25,85)],[member(129,150),member(143,133)]);
  b.turn(153,150);
  assert.deepEqual([b.view().playerRequest,b.view().rivalRequest],['switch','switch']);
  const frames=b.turn({switch:1},{switch:1});
  assert.equal(frames.length,2);
  const [first,last]=frames,other=first.side==='player'?'rival':'player';
  assert.equal(first[other+'HP'],0);
  assert.equal(first.meta.before[first.side+'HP'],0);
  assert.equal(last.meta.before[first.side+'HP'],first[first.side+'HP']);
  assert.ok(last.playerHP>0 && last.rivalHP>0);
  assert.equal(last[other+'SpeciesId'],other==='player'?25:143);
  assert.deepEqual([b.view().playerRequest,b.view().rivalRequest],['move','move']);
});

test('Fly locks switching while Bide still lets its user switch out',()=>{
  const fly=match([member(18,19),member(129,150)],[member(143,133)]);
  fly.turn(19,133);
  assert.equal(fly.view().playerParty[1].canSwitch,false);
  assert.throws(()=>fly.turn({switch:1},133),RangeError);
  fly.turn(19,133);assert.equal(fly.view().playerParty[1].canSwitch,true);
  const bide=match([member(143,117),member(129,150)],[member(113,107)]);
  bide.turn(117,107);
  assert.equal(bide.view().playerParty[1].canSwitch,true);
  assert.equal(bide.turn({switch:1},107)[0].playerSpeciesId,129);
});

test('switching out a transformed Ditto restores its form and original moves on return',()=>{
  const b=match([member(132,144),member(129,150)],[member(151,14)]);
  b.turn(144,14);
  assert.deepEqual([b.view().playerBaseId,b.view().playerSpeciesId],[132,151]);
  b.turn({switch:1},14);
  const [back]=b.turn({switch:0},14);
  assert.deepEqual([back.playerBaseId,back.playerSpeciesId,back.playerTypes],[132,132,['Normal']]);
  assert.deepEqual(b.view().choices.map(m=>m.id),[144]);
});

test('a party loses only once every member has fainted',()=>{
  const b=match([member(25,85)],[member(129,150),member(129,150)]);
  b.turn(85,150);b.turn(null,{switch:1});b.turn(85,150);
  assert.deepEqual([b.view().winner,b.view().playerRequest,b.view().rivalRequest],['player','ended','ended']);
  assert.ok(b.view().rivalParty.every(p=>p.hp===0 && !p.canSwitch));
  assert.throws(()=>b.turn(85,150),/ended/);
});
