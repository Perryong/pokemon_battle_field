import test from 'node:test';
import assert from 'node:assert/strict';
import {createSoloTag} from '../src/solo-tag.js';

const lead={id:101,level:1,moves:[153]};
test('solo tag waits for the player to replace a fainted lead and generates matching CPU parties',t=>{
  // Draw Magikarp as the three CPU leads.
  t.mock.method(Math,'random',()=>128.5/151);
  const events=[];
  const game=createSoloTag([lead,{id:25,moves:[85]}],(_,phase)=>events.push(...phase));
  assert.deepEqual(game.view.field.map(m=>m.remaining),[2,2,2,2]);
  game.submit('move 1');
  assert.ok(game.view.forced);
  const waiting=game.view;
  game.submit();
  assert.equal(game.view,waiting);
  game.submit(waiting.choices.find(c=>c.kind==='switch').command);
  assert.equal(game.view.field[0].id,25);
  assert.ok(events.some(e=>e.text.includes('sent out Pikachu')));
  game.end();
  const stopped=game.view;
  game.submit(stopped.choices[0]?.command);
  assert.equal(game.view,stopped);
});

test('the CPU teammate plays to a result after the player runs out of Pokémon',t=>{
  t.mock.method(Math,'random',()=>128.5/151);
  const actors=new Set();
  const game=createSoloTag([lead],(_,events)=>{
    for(const e of events) if(e.move) actors.add(e.actor);
  });
  game.submit('move 1');
  assert.equal(game.view.field[0].remaining,0);
  assert.ok(game.view.field[2].hp>0);
  for(let i=0;i<100 && !game.view.ended;i++) {
    assert.deepEqual(game.view.choices,[]);game.submit();
  }
  assert.ok(game.view.ended);
  assert.ok(['Blue','Red'].includes(game.view.winner));
  for(const seat of [1,2,3]) assert.ok(actors.has(seat));
});

test('a selected partner brings its own lead, moves and reserves against a matching rival',t=>{
  t.mock.method(Math,'random',()=>128.5/151);
  const home=[{id:151,moves:[14]}];
  const partner=[{id:101,moves:[153],level:1,name:'Sparky'},{id:25,moves:[85]}];
  const original=structuredClone(partner),events=[];
  const game=createSoloTag(home,(_,phase)=>events.push(...phase),partner);
  assert.deepEqual(game.view.field.map(m=>m.remaining),[1,1,2,2]);
  assert.equal(game.view.field[2].id,101);
  assert.ok(game.view.field[2].maxHP<20);
  game.submit('move 1');
  if(!game.view.choices.length) game.submit();
  assert.ok(events.some(e=>e.actor===2 && e.text.includes('Sparky')) || events.some(e=>e.text.includes('Sparky fainted')));
  assert.equal(game.view.field[2].id,25);
  assert.deepEqual(partner,original);
  const splash=createSoloTag(home,(_,phase)=>events.push(...phase),[{id:129,moves:[150]}]);
  splash.submit('move 1');assert.ok(events.some(e=>e.actor===2 && e.move===150));
  for(const invalid of [[],Array(4).fill(home[0]),[{id:129,moves:[94]}]])
    assert.throws(()=>createSoloTag(home,()=>{},invalid));
});

test('two custom opponents use independent leads, equipped moves and reserves',()=>{
  const opponent1=[lead,{id:143,moves:[34]}],opponent2=[{id:25,moves:[45],name:'Scout'}];
  const original=structuredClone([opponent1,opponent2]),events=[];
  const game=createSoloTag([{id:151,moves:[14]}],(_,phase)=>events.push(...phase),[{id:129,moves:[150]}],{opponent1,opponent2});
  assert.deepEqual(game.view.field.map(m=>m.id),[151,101,129,25]);
  assert.deepEqual(game.view.field.map(m=>m.remaining),[1,2,1,1]);
  assert.ok(game.view.field[1].maxHP<20);
  game.submit('move 1');
  assert.ok(events.some(e=>e.actor===1 && e.move===153));
  assert.ok(events.some(e=>e.actor===3 && e.move===45 && e.text.includes('Scout')));
  game.submit();
  assert.equal(game.view.field[1].id,143);
  assert.equal(game.view.field[3].id,25);
  assert.deepEqual([opponent1,opponent2],original);
});

test('either opponent can be generated or validated independently',()=>{
  const home=[{id:25,moves:[85]}],partner=[lead,...home],custom=[{id:129,moves:[150]}];
  const first=createSoloTag(home,()=>{},partner,{opponent1:custom});
  assert.deepEqual(first.view.field.map(m=>m.remaining),[1,1,2,2]);
  assert.equal(first.view.field[1].id,129);
  const second=createSoloTag(home,()=>{},partner,{opponent2:custom});
  assert.deepEqual(second.view.field.map(m=>m.remaining),[1,1,2,1]);
  assert.equal(second.view.field[3].id,129);
  for(const key of ['opponent1','opponent2']) {
    for(const bad of [[],Array(4).fill(home[0]),[{id:129,moves:[94]}]])
      assert.throws(()=>createSoloTag(home,()=>{},null,{[key]:bad}));
  }
});
