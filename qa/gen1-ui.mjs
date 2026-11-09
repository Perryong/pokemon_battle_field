// Run against the built site. Verify real selector values, not just catalogue membership.
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {roster} from '../src/roster.js';
import {allMoves} from '../src/gen1-data.js';

const base = process.env.BASE_URL || 'http://127.0.0.1:4181';
const browser = await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-angle=metal']});
try {
  const page = await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'});
  const errors = [];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto(base+'/?dex=1');await page.waitForFunction(()=>window.__dioramaReady);
  assert.equal(await page.title(),'Pokémon Battle Field');
  const visited = new Set();
  let pairs=0;
  for(const mon of roster){
    const samples = [...mon.learnset,165].filter(id=>!visited.has(id));
    const actual = await page.evaluate(({species,samples})=>{
      const dex=__diorama.dex;dex.open(species);
      const select=document.getElementById('previewMove');
      const equipped=document.querySelector('#equippedSlots select');
      const available=[...select.options].map(o=>Number(o.value));
      for(const move of samples){
        select.value=move;select.dispatchEvent(new Event('change'));
        document.getElementById('previewAttack').click();
        dex.studio.sample(move,.55);
        if(!document.getElementById('moveInfo').textContent)throw Error('Missing details '+move);
        dex.studio.cancelPreview();
      }
      return {available,slots:[...equipped.options].map(o=>Number(o.value)).filter(Boolean)};
    },{species:mon.id,samples});
    assert.deepEqual(actual.available.sort((a,b)=>a-b),[...mon.learnset,165].sort((a,b)=>a-b),mon.name);
    assert.deepEqual(actual.slots.sort((a,b)=>a-b),[...mon.learnset].sort((a,b)=>a-b),mon.name);
    samples.forEach(n=>visited.add(n));pairs+=mon.learnset.length;
  }
  assert.equal(visited.size,allMoves.length);
  console.log(pairs+' legal preview and equip pairs checked; all '+visited.size+' move previews played.');
  await page.evaluate(()=>__diorama.dex.open(129));
  await page.locator('#setEditor summary').click();
  const slots=page.locator('#equippedSlots select');
  for(let i=1;i<4;i++)await slots.nth(i).selectOption('');
  await slots.nth(0).selectOption('82');await slots.nth(1).selectOption('33');
  assert.ok(await page.locator('#asPlayer').isDisabled());assert.match(await page.locator('#setError').innerText(),/cannot know/);
  await slots.nth(1).selectOption('');
  await page.locator('#asPlayer').click();await page.locator('#partyBattle').click();
  assert.deepEqual(await page.locator('#moves button').evaluateAll(buttons=>buttons.map(b=>b.dataset.id)),['82']);
  await page.reload();await page.waitForFunction(()=>window.__dioramaReady);
  assert.equal(await page.locator('#pname').innerText(),'Magikarp');
  assert.equal(await page.locator('#moves button').count(),1);
  assert.deepEqual(errors,[]);
  console.log('Incompatible event combination rejected; legal one-move loadout persisted.');
}finally{await browser.close()}
