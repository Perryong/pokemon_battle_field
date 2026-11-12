// Import only set names and move choices. The analysis prose stays on Smogon.
import {writeFile} from 'node:fs/promises';
import {roster} from '../src/roster.js';
import {allMoves,validateLoadout} from '../src/gen1-data.js';

const revision='86f575d661ab180b182e9e9b021fb550f4ade257';
const response=await fetch('https://raw.githubusercontent.com/pkmn/smogon/'+revision+'/data/sets/gen1.json');
if (!response.ok) throw Error('Unable to fetch strategy sets: '+response.status);
const source=await response.json();
const key=name=>name.replace('♀','f').replace('♂','m').toLowerCase().replace(/[^a-z0-9]/g,'');
const species=new Map(Object.entries(source).map(([name,sets])=>[key(name),sets]));
const moves=new Map(allMoves.map(move=>[key(move.name),move.id]));
const catalog={};
for (const mon of roster) {
  const published=species.get(key(mon.name));
  const sets=[], seen=new Set();
  for (const tier of ['ou','uu','nu','pu','zu','ubers','middlecup','lclevel100','lc']) {
    for (const [name,set] of Object.entries(published?.[tier] || {})) {
      // Pick the first complete legal combination among the published alternatives.
      let options=[[]];
      for (const choices of set.moves) {
        options=options.flatMap(previous=>[choices].flat().map(move=>[...previous,moves.get(key(move))]));
      }
      const ids=options.find(ids=>!validateLoadout(mon,ids));
      if (!ids || seen.has(ids.join())) continue;
      sets.push({tier,name,moves:ids});seen.add(ids.join());
    }
  }
  if (sets.length) catalog[mon.id]=sets;
}
await writeFile(new URL('../src/strategy-sets.json',import.meta.url),JSON.stringify(catalog,null,0)+'\n');
console.log(Object.values(catalog).flat().length+' published sets for '+Object.keys(catalog).length+' species');
