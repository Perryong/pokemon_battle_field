import test from 'node:test';
import assert from 'node:assert/strict';
import {roster} from '../src/roster.js';
import {validateLoadout} from '../src/gen1-data.js';
import {strategySets,roleText} from '../src/strategy.js';
import {CASUAL,OU,partyProblem} from '../src/formats.js';
import {generateRival} from '../src/team.js';
import {createPartyMatch} from '../src/gen1-battle.js';

test('all suggested sets are equipable and have a role; local sets are identified',()=>{
  const local=[];
  for (const mon of roster) for (const set of strategySets(mon)) {
    assert.equal(validateLoadout(mon,set.moves),null,mon.name+' / '+set.name);
    assert.ok(roleText(mon,set));if (set.tier==='local') local.push(mon.name);
  }
  assert.deepEqual(local,['Metapod','Kakuna']);
  assert.deepEqual(strategySets(roster[127])[0].moves,[34,63,59,89]);
});
test('OU rejects banned species, moves and duplicates on either side; casual accepts them',()=>{
  const valid=[{id:128,moves:[34]}];
  for (const [party,rule] of [[[{id:150,moves:[94]}],/Uber/],[[...valid,...valid],/Species Clause/],
    [[{id:51,moves:[90]}],/OHKO/],[[{id:6,moves:[19]}],/banned/],[[{id:25,moves:[104]}],/Evasion/]]) {
    assert.equal(partyProblem(party,CASUAL),'');
    assert.match(partyProblem(party,OU),rule);
    assert.throws(()=>createPartyMatch(party,valid,1,OU),rule);
    assert.throws(()=>createPartyMatch(valid,party,1,OU),rule);
  }
  for (let n=1;n<=6;n++) assert.equal(partyProblem(generateRival(n,null,OU),OU),'');
});
test('the OU simulator enforces Sleep Clause after an opponent switches',()=>{
  const match=createPartyMatch([{id:47,moves:[147]}],[{id:129,moves:[150]},{id:130,moves:[150]}],17,OU);
  match.turn(147,150);assert.equal(match.view().rivalStatus,'slp');
  const events=match.turn(147,{switch:1});
  assert.match(events.at(-1).text,/Sleep Clause/);assert.equal(match.view().rivalStatus,'');
});
