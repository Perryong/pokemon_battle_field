import test from 'node:test';
import assert from 'node:assert/strict';
import {createMatch} from '../src/gen1-battle.js';
import {roster} from '../src/roster.js';

const seed=[1,2,3,4];

test('faster fighter acts first, priority can override speed, and each action has its own HP snapshot',()=>{
  const b=createMatch(25,6,[85,98],[53],714151),before=b.view();
  assert.deepEqual([before.playerHP,before.rivalHP,before.round],[273,359,1]);
  const [first,reply]=b.turn(85,53);
  assert.deepEqual([first.side,first.moveId,first.playerHP,first.rivalHP],['rival',53,124,359]);
  assert.match(first.text,/Pikachu lost 149 HP/);
  assert.equal(reply.meta.before.playerHP,124);assert.equal(reply.hit,true);assert.equal(reply.meta.critical,true);
  assert.equal(b.view().rivalHP,reply.rivalHP);assert.equal(b.view().choices[0].pp,23);
  assert.equal(createMatch(25,6,[98],[53],714151).turn(98,53)[0].side,'player');
});

test('RBY type immunities and seeded damage variation come from the simulator',()=>{
  const electric=createMatch(25,76,[85],[111],seed);
  const [bolt]=electric.turn(85,111);assert.equal(bolt.meta.immune,true);assert.equal(bolt.hit,false);
  assert.equal(electric.view().rivalHP,electric.view().rivalMaxHP);
  const ghost=createMatch(94,65,[122],[105],seed);
  assert.equal(ghost.turn(122,105).find(e=>e.side==='player').meta.immune,true);
  const roll=s=>createMatch(25,143,[85],[133],s).turn(85,133)[0].rivalHP;
  assert.equal(roll(42),roll(42));assert.ok(new Set(Array.from({length:10},(_,i)=>roll(i+1))).size>1);
});

test('charge turns, semi-invulnerability, recharge and invalid selections preserve the exact move request',()=>{
  const b=createMatch(18,143,[19,17],[69],seed),before=b.view();
  assert.throws(()=>b.turn(19,85),/Unavailable rival move/);assert.deepEqual(b.view(),before);
  const [up,miss]=b.turn(19,69);
  assert.equal(up.meta.phase,'charge');assert.equal(miss.meta.missed,true);
  assert.deepEqual(b.view().choices.map(c=>[c.id,c.forced]),[[19,true]]);
  assert.throws(()=>b.turn(17,69),/Unavailable player move/);
  const [down]=b.turn(19,69);assert.equal(down.meta.phase,'strike');assert.equal(down.hit,true);
  assert.equal(b.view().choices[0].pp,23);
  const beam=createMatch(113,143,[63],[133],seed);beam.turn(63,133);
  assert.deepEqual(beam.view().choices.map(c=>[c.id,c.name,c.pp]),[[-1,'Recharge',null]]);
  assert.match(beam.turn(-1,133)[0].text,/recharge/);assert.equal(beam.view().choices[0].id,63);
});

test('Rest, sleep/wake, escalating Toxic damage and PP exhaustion control subsequent turns',()=>{
  const rest=createMatch(113,143,[156],[69],seed);
  rest.turn(156,69);const [heal]=rest.turn(156,69);
  assert.equal(heal.playerHP,703);assert.equal(heal.playerStatus,'slp');assert.equal(rest.view().choices[0].id,0);
  assert.match(rest.turn(0,69)[0].text,/asleep/);assert.match(rest.turn(0,69)[0].text,/woke up/);
  assert.equal(rest.view().playerStatus,'');assert.equal(rest.view().choices[0].id,156);
  const tox=createMatch(151,143,[92,14],[133],seed);
  tox.turn(92,133);assert.equal(tox.view().rivalStatus,'tox');const initial=tox.view().rivalHP;
  tox.turn(14,133);const next=tox.view().rivalHP;assert.equal(initial-next,64);
  tox.turn(14,133);assert.equal(next-tox.view().rivalHP,96);
  const empty=createMatch(113,143,[156],[133],seed);
  for(let i=0;i<16;i++)empty.turn(156,133);
  assert.deepEqual(empty.view().choices.map(c=>c.id),[165]);assert.equal(empty.turn(165,133)[0].moveId,165);
});

test('Transform gives copied moves and type/form immediately, and Mimic and called moves expose their real identity',()=>{
  const ditto=createMatch(132,151,[144],[118,156],714151),[metronome,transform]=ditto.turn(144,118);
  assert.equal(metronome.moveId,118);assert.equal(metronome.meta.calledMoveId,89);
  assert.equal(transform.meta.before.playerSpeciesId,132);assert.equal(transform.playerSpeciesId,151);
  assert.deepEqual(transform.playerTypes,['Psychic']);assert.equal(ditto.view().playerMaxHP,299);
  assert.deepEqual(ditto.view().choices.map(m=>[m.id,m.pp]),[[118,5],[156,5]]);
  const mime=createMatch(122,143,[102],[69],seed);mime.turn(102,69);assert.equal(mime.view().choices[0].id,69);
  const duplicate=createMatch(122,143,[102,69],[69],seed);duplicate.turn(102,69);
  const slots=duplicate.view().choices;assert.deepEqual(slots.map(x=>x.id),[69,69]);
  duplicate.turn(slots[1],69);assert.deepEqual(duplicate.view().choices.map(x=>x.pp),[slots[0].pp,slots[1].pp-1]);
  const mirror=createMatch(22,143,[119],[69],seed);mirror.turn(119,69);
  assert.equal(mirror.turn(119,69)[0].meta.calledMoveId,69);
});

test('Bide storage/release, multi-hit counts and Counter produce actual ordered damage',()=>{
  const b=createMatch(143,113,[117,34],[69],seed);
  for(let i=0;i<3;i++){const e=b.turn(117,69).find(e=>e.side==='player');assert.equal(e.meta.phase,'charge');assert.equal(e.moveId,117);assert.equal(b.view().choices.length,1);}
  const release=b.turn(117,69).find(e=>e.side==='player');
  assert.equal(release.meta.before.rivalHP-release.rivalHP,600);assert.equal(release.meta.phase,'strike');
  const kick=createMatch(135,113,[24],[68],seed);
  const [two,counter]=kick.turn(24,68);
  assert.equal(two.meta.hits,2);assert.equal(counter.moveId,68);
  assert.ok(counter.playerHP<two.playerHP);assert.equal(counter.hit,true);
});

test('all 151 original species load and all 164 equip-able moves resolve',()=>{
  for(const mon of roster)assert.equal(createMatch(mon.id,129,[mon.learnset[0]],[150],1).view().playerSpeciesId,mon.id);
  for(let id=1;id<=164;id++){
    const owner=roster.find(m=>m.learnset.includes(id));
    const a=createMatch(owner.id,129,[id],[150],id),v=a.view();
    assert.equal(v.choices[0].id,id);const e=a.turn(id,150);assert.ok(e.length);
    for(const frame of e){assert.ok(Number.isInteger(frame.playerHP));assert.ok(Number.isInteger(frame.rivalHP));}
    assert.equal(e.at(-1).playerHP,a.view().playerHP);assert.equal(e.at(-1).rivalHP,a.view().rivalHP);
  }
  assert.throws(()=>createMatch(151,151,[165],[1],seed),/cannot learn Struggle/);
  assert.throws(()=>createMatch(129,143,[82,33],[69],seed),/cannot know .*together/);
});

test('a knockout stops pending actions, reports the winner and rejects subsequent turns',()=>{
  const a=createMatch(101,113,[153],[107],seed);
  const events=a.turn(153,107);assert.equal(events.length,1);assert.equal(events[0].playerHP,0);
  assert.equal(a.view().winner,'rival');assert.deepEqual(a.view().choices,[]);
  assert.throws(()=>a.turn(153,107),/ended/);
});
