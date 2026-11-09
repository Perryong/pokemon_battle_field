// Called by import-kanto.py with hash-verified offline data modules.
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

const {Dex} = await import(pathToFileURL(process.argv[2]));
const dex = Dex.forGen(1);
const {species, cartridge, conflicts, sources} = JSON.parse(readFileSync(0, 'utf8'));
const rows = values => '[\n' + values.map(v=>JSON.stringify(v)).join(',\n') + '\n]';
const types = 'Normal Fighting Flying Poison Ground Rock Bug Ghost Fire Water Grass Electric Psychic Ice Dragon'.split(' ');
const table = Object.fromEntries(types.map(attack=>[attack, Object.fromEntries(types.map(defense=>{
  const index = dex.types.get(defense).damageTaken[attack];
  assert(Number.isInteger(index), attack+' vs '+defense);
  return [defense, [1,2,.5,0][index]];
}))]));
const upstreamMoves = dex.moves.all().filter(m=>m.num>=1 && m.num<=165 && m.gen===1).sort((a,b)=>a.num-b.num);
const moves = upstreamMoves.map((m,i)=>{
  assert.equal(m.num,i+1);
  const [, effect, power, type, accuracy, pp] = cartridge[i];
  const cartridgeType = types.find(t=>t.toUpperCase()===type.replace('_TYPE',''));
  assert(cartridgeType,m.name);
  assert.equal(Number(pp),m.pp,m.name);
  const move = {id:m.num,name:m.name,type:cartridgeType,power:Number(power),
    accuracy:m.accuracy===true?null:Number(accuracy),pp:Number(pp),category:m.category,
    delivery:m.category==='Status'?'status':m.flags.contact?'contact':'ranged',
    description:m.shortDesc || m.desc,priority:m.priority,target:m.target,effect};
  // These fields retain the simulator's Gen I effect semantics, e.g. Twineedle's second hit and level damage.
  for(const key of ['boosts','status','volatileStatus','secondary','self','multihit','damage','ohko',
    'drain','recoil','heal','selfdestruct','ignoreImmunity','critRatio']) {
    if(m[key]!==undefined && m[key]!==false && !(key==='critRatio'&&m[key]===1)) move[key]=m[key];
  }
  return move;
});
assert.equal(moves.length,165);

const conflictsBySpecies = {};
for(const [name, ...pair] of conflicts){
  const id=dex.species.get(name).num, ids=pair.map(m=>dex.moves.get(m).num);
  assert.equal(ids.length,2); assert(ids.every(i=>i>=1&&i<=165));
  (conflictsBySpecies[id]??=[]).push(ids);
}
const restricted = new Map([
  ['22/payday','Japanese Pokémon Stamp Fearow distribution'],
  ['25/fly','Japanese CoroCoro Flying Pikachu distribution'],
  ['25/surf','Pokémon Stadium Surf tutor or Surfing Pikachu distribution'],
  ['54/amnesia','Pokémon Stadium Psyduck gift'],
  ['78/payday','Japanese Pokémon Stamp Rapidash distribution'],
  ['129/dragonrage','Japanese Tamamushi University Magikarp distribution'],
]);

// Choose a useful legal set for the initial battle. All other legal moves remain selectable.
function defaults(mon,learned,natural) {
  const chosen=[];
  const fits = id => mon.learnset.includes(id) && !chosen.includes(id) &&
    !(conflictsBySpecies[mon.id]||[]).some(pair=>pair.every(i=>chosen.includes(i)||i===id));
  const add = id => { if(id && chosen.length<4 && fits(id)) chosen.push(id); };
  if(mon.id===25) [85,98,86,129].forEach(add); // Thunderbolt, Quick Attack, Thunder Wave, Swift
  if(mon.id===6) [126,89,163,19].forEach(add); // Fire Blast, Earthquake, Slash, Fly
  const ordinary=mon.learnset.filter(id=>learned.has(id));
  const score=id=>{
    const m=moves[id-1], power=m.damage==='level'?70:Number(m.damage)||m.power;
    const hits=m.multihit===2?2:Array.isArray(m.multihit)?3:1;
    return Math.min(120,power*hits)*(m.accuracy??100)/100 + (natural.has(id)?18:0) +
      (mon.types.includes(m.type)?14:0) - (m.selfdestruct?100:0);
  };
  const attacks=ordinary.filter(id=>moves[id-1].category!=='Status').sort((a,b)=>score(b)-score(a)||a-b);
  for(const type of mon.types) add(attacks.find(id=>moves[id-1].type===type&&fits(id)));
  add(attacks.find(id=>fits(id)&&!chosen.some(j=>moves[j-1].type===moves[id-1].type)));
  const helpful=[79,86,105,14,97,95,77,73,78,109,74,115,113,110,81,150];
  add(helpful.find(id=>natural.has(id)&&fits(id)));
  [...attacks,...ordinary.filter(id=>natural.has(id)),...ordinary].forEach(add);
  return chosen;
}

const speciesByNum = new Map(dex.species.all().filter(s=>s.num<=151 && !s.forme).map(s=>[s.num,s]));
const notes={};
for(const mon of species){
  const s=speciesByNum.get(mon.id), {hp,atk,def,spa,spd,spe}=s.baseStats;
  assert.equal(spa,spd,s.name); mon.stats={hp,atk,def,spc:spa,spe}; mon.types=s.types;
  const pool=new Set(),ordinary=new Set(),natural=new Set(),rare=new Map();
  let evo=s;
  while(evo && evo.gen===1){
    const entry=await dex.learnsets.get(evo.id);
    for(const [key,raw] of Object.entries(entry.learnset||{})){
      const eligible=raw.filter(code=>code.startsWith('1'));
      if(!eligible.length)continue;
      const id=dex.moves.get(key).num;
      assert(Number.isInteger(id)&&id>0&&id<165,evo.name+' '+key);
      pool.add(id);
      if(eligible.some(code=>/^1[LM]/.test(code))) ordinary.add(id);
      if(eligible.some(code=>code.startsWith('1L'))) natural.add(id);
      if(!ordinary.has(id)&&eligible.some(code=>/^1[ST]/.test(code))){
        const note=restricted.get(evo.num+'/'+key);
        assert(note,evo.name+' unknown special source for '+key);
        rare.set(id,note+(evo===s?'':' (evolve '+evo.name+')'));
      }
    }
    evo=evo.prevo ? dex.species.get(evo.prevo) : null;
  }
  mon.learnset=[...pool].sort((a,b)=>a-b);
  mon.defaultMoves=defaults(mon,ordinary,natural);
  assert(mon.defaultMoves.length>0 && mon.defaultMoves.length<=4,mon.name);
  for(const [id,note] of rare)if(!ordinary.has(id))(notes[mon.id]??={})[id]=note;
}
for(const [id,pairs] of Object.entries(conflictsBySpecies))
  for(const pair of pairs) assert(pair.every(move=>species[id-1].learnset.includes(move)),id+' '+pair);
writeFileSync('src/kanto.json',rows(species)+'\n');
writeFileSync('src/gen1-data.json','{\n"sources":'+JSON.stringify(sources)+',\n"moves":'+rows(moves)+
  ',\n"typeChart":'+JSON.stringify(table)+',\n"sourceNotes":'+JSON.stringify(notes)+
  ',\n"incompatible":'+JSON.stringify(conflictsBySpecies)+'\n}\n');
