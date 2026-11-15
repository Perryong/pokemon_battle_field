import test from 'node:test';
import assert from 'node:assert/strict';
import {CASUAL,OU,simulatorSet} from '../src/formats.js';
import {createPartyMatch} from '../src/gen1-battle.js';
import {importTeam,exportTeam,readTeams,storeTeam,removeTeam} from '../src/team-library.js';

const sample='=== [gen1ou] Tauros offense ===\r\n\r\nCloser (Tauros)\r\n- Body Slam\r\n- Hyper Beam\r\n- Blizzard\r\n- Earthquake\r\n\r\nChansey\r\nAbility: No Ability\r\nLevel: 99\r\nEVs: 200 HP / 252 Def / 252 SpA / 252 SpD / 252 Spe\r\nIVs: 14 HP / 0 Atk\r\n- Ice Beam\r\n- Soft-Boiled';

test('Showdown OU text preserves lead, move order, nickname and battle stats through export and play',()=>{
  const {party,format,name}=importTeam(sample,CASUAL);
  assert.equal(format,OU);assert.equal(name,'Tauros offense');
  assert.deepEqual(party.map(m=>m.id),[128,113]);assert.deepEqual(party[0].moves,[34,63,59,89]);
  const text=exportTeam(party,format);
  assert.match(text,/Closer \(Tauros\)/);assert.match(text,/IVs: /);
  assert.deepEqual(importTeam(text,OU).party,party);
  const set=simulatorSet(party[1]);assert.equal(set.level,99);assert.equal(set.ivs.atk,0);assert.equal(set.evs.hp,200);
  const match=createPartyMatch([party[1]],[{id:113,moves:party[1].moves}],123,OU).view();
  assert.ok(match.playerMaxHP<match.rivalMaxHP);
});

test('invalid, ambiguous and wrong-generation pastes give actionable errors',()=>{
  for(const [paste,pattern] of [
    ['',/paste/i],['Mewtwo\n- Psychic',/Uber|banned/i],['Tauros\n- Thunder Fairy',/Thunder Fairy/i],
    ['Raichu-Alola\n- Thunderbolt',/Raichu-Alola/],['Tauros @ Leftovers\n- Body Slam',/item|Leftovers/i],
    ['Tauros\nLevel: 101\n- Body Slam',/level/i],['Tauros\nIVs: wrong\n- Body Slam',/IVs/i],
    ['Tauros\n- Body Slam\nChansey\n- Ice Beam',/Chansey/],
    [sample+'\n\n'+sample,/one team/i],['=== [gen9ou] Team ===\n\nTauros\n- Body Slam',/gen9ou/i],
    [Array(7).fill('Tauros\n- Body Slam').join('\n\n'),/six/i],
  ]) assert.throws(()=>importTeam(paste,OU),pattern);
  assert.throws(()=>importTeam('=== [gen1customgame] Test ===\n\nMewtwo\n- Psychic',OU,true),/Uber|banned/i);
});

test('library saves independent named snapshots, updates explicitly and persists removal',()=>{
  const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
  const {party}=importTeam(sample,OU);
  storeTeam(storage,'Offense',OU,party);storeTeam(storage,'Bench',CASUAL,[party[1]]);
  assert.throws(()=>storeTeam(storage,'offense',OU,[party[0]]),/already/i);
  storeTeam(storage,'Offense',OU,[party[0]],true);
  assert.deepEqual(readTeams(storage).map(t=>t.party.length),[1,1]);
  removeTeam(storage,'Offense');assert.deepEqual(readTeams(storage).map(t=>t.name),['Bench']);
  assert.throws(()=>storeTeam(null,'A',OU,party),/storage/i);
});

test('empty Showdown move slots and all Kanto species round-trip',async()=>{
  const {roster}=await import('../src/roster.js');
  const partial='Ditto\n- Transform\n- \n- \n- ';
  assert.deepEqual(importTeam(partial,OU).party,[{id:132,moves:[144]}]);
  for (const mon of roster) {
    const party=[{id:mon.id,moves:mon.defaultMoves}];
    assert.deepEqual(importTeam(exportTeam(party,CASUAL),CASUAL).party,party);
  }
});
