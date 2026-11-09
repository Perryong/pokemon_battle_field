import test from 'node:test';
import assert from 'node:assert/strict';
import {roster,lookup} from '../src/roster.js';
import {allMoves,moveById,effectiveness,sourceNote,validateLoadout} from '../src/gen1-data.js';

test('all RBY moves and all 151 legal move pools are closed over the original cartridge IDs',()=>{
  assert.deepEqual(allMoves.map(m=>m.id),Array.from({length:165},(_,i)=>i+1));
  const taught=new Set();
  for(const mon of roster){
    assert.deepEqual(Object.keys(mon.stats).sort(),['atk','def','hp','spc','spe']);
    assert(mon.types.length>=1&&mon.types.length<=2);
    assert.deepEqual(mon.learnset,[...new Set(mon.learnset)].sort((a,b)=>a-b));
    for(const id of mon.learnset){assert(moveById(id),mon.name);taught.add(id);}
    assert.equal(validateLoadout(mon,mon.defaultMoves),null,mon.name);
  }
  assert.equal(taught.size,164);assert(!taught.has(165));
  for(const m of allMoves){
    assert(m.description&&m.pp>0);
    assert(m.accuracy===null||m.accuracy>0&&m.accuracy<=100);
    assert(['Physical','Special','Status'].includes(m.category));
  }
});
test('historical stats, types, type chart and cartridge move properties survive import',()=>{
  assert.deepEqual(lookup(81).types,['Electric']);assert.deepEqual(lookup(35).types,['Normal']);
  assert.deepEqual(lookup(122).types,['Psychic']);assert.equal(lookup(65).stats.spc,135);
  assert.equal(lookup(25).stats.def,30);assert.equal(lookup(6).stats.spc,85);
  for(const id of [2,16,28,44])assert.equal(moveById(id).type,'Normal');
  assert.equal(moveById(33).power,35);assert.equal(moveById(59).accuracy,90);
  assert.equal(moveById(85).power,95);assert.equal(moveById(126).power,120);
  assert.equal(moveById(22).pp,10);assert.equal(moveById(129).accuracy,null);
  assert.equal(moveById(101).power,0);assert.equal(moveById(101).damage,'level');
  assert.equal(moveById(90).power,1);assert.equal(moveById(117).type,'Normal');
  assert.equal(moveById(152).category,'Special');assert.equal(moveById(152).delivery,'contact');
  assert.equal(effectiveness('Ghost',['Psychic']),0);
  assert.equal(effectiveness('Ice',['Fire']),1);
  assert.equal(effectiveness('Bug',['Poison']),2);assert.equal(effectiveness('Poison',['Bug']),2);
  assert.equal(effectiveness('Ground',['Fire','Flying']),0);
  assert.equal(effectiveness('Electric',['Water','Flying']),4);
  assert.equal(effectiveness('Grass',['Fire','Flying']),.25);
});
test('learnsets include evolution, machine and Stadium sources and exclude tradebacks',()=>{
  assert.deepEqual(lookup(10).learnset,[33,81]);assert.deepEqual(lookup(11).learnset,[33,81,106]);
  assert.deepEqual(lookup(129).learnset,[33,82,150]);assert.deepEqual(lookup(132).learnset,[144]);
  assert(lookup(12).learnset.includes(16));assert(lookup(6).learnset.includes(19));
  assert(lookup(26).learnset.includes(97));assert(!lookup(65).learnset.includes(7));
  assert(!lookup(150).learnset.includes(93));assert(!lookup(129).learnset.includes(145));
  assert.match(sourceNote(26,19),/Japanese.*Pikachu/);assert.match(sourceNote(26,57),/Stadium/);
  assert.match(sourceNote(55,133),/Psyduck/);assert.match(sourceNote(129,82),/Tamamushi/);
  assert.equal(sourceNote(130,82),'');assert.equal(sourceNote(25,85),'');
});
test('validateLoadout rejects event and evolution conflicts without rejecting compatible rare moves',()=>{
  for(const [species,ids] of [[129,[33,82]],[22,[6,64]],[22,[6,119]],[78,[6,39]],[14,[40,106]],
    [103,[23,79]],[135,[84,116]],[42,[141,103]]])assert.match(validateLoadout(species,ids),/together/);
  assert.equal(validateLoadout(25,[19,57,84,45]),null);
  assert.equal(validateLoadout(129,[150,82]),null);assert.equal(validateLoadout(11,[33,81,106]),null);
  assert.equal(validateLoadout(132,[144]),null);
  assert(validateLoadout(25,[165]));assert(validateLoadout(25,[85,85]));assert(validateLoadout(25,[]));
  assert(validateLoadout(25,[19,57,84,45,85]));assert(validateLoadout(132,[33]));
});

test('every learnset matches the simulator’s no-tradeback validator, including documented Japanese distributions',async()=>{
  const {TeamValidator}=await import('@pkmn/sim');
  const validator=TeamValidator.get('gen1customgame@@@Obtainable');
  assert.equal(validator.ruleTable.has('allowtradeback'),false);
  for(const mon of roster){
    for(const move of allMoves.slice(0,-1)){
      const errors=validator.validateSet({species:mon.name,moves:[move.name],level:100});
      // The International Yellow validator explicitly identifies Japanese-only legal event moves.
      const japaneseOnly=errors?.length===1 && errors[0].includes('Japan-only events') &&
        sourceNote(mon,move.id).includes('Japanese');
      assert.equal(mon.learnset.includes(move.id),!errors||Boolean(japaneseOnly),mon.name+' / '+move.name);
    }
  }
});
