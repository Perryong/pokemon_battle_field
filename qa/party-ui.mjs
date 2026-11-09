import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-angle=metal']});
try{
 for(const offline of [false,true]){
  const page=await browser.newPage({viewport:offline?{width:390,height:844}:{width:1280,height:800},offline,reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  const base=offline?pathToFileURL(resolve('dist/pokemon-battle-field.html')).href:(process.env.BASE_URL||'http://127.0.0.1:4181');
  const loc=id=>page.locator('#'+id);
  const ready=()=>page.waitForFunction(()=>window.__dioramaReady);
  const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('pokemon-battle-field.parties.v2')));
  await page.goto(base);await ready();await loc('buildTeam').click();
  const add=async id=>{await loc('dexSearch').fill(String(id));await page.locator('[data-dex="'+id+'"]').click();await loc('partyAdd').click();};
  for(const id of [131,143,132,1,150])await add(id);
  assert.equal(await loc('partyCount').innerText(),'6 / 6');assert.ok(await loc('partyAdd').isDisabled());
  await page.locator('[data-party-slot="1"]').click();await loc('makeLead').click();
  await loc('setEditor').locator('summary').click();
  const slots=page.locator('#equippedSlots select');
  for(let i=1;i<4;i++)await slots.nth(i).selectOption('');
  await slots.nth(0).selectOption('57');await loc('asPlayer').click();
  await page.locator('[data-party-slot="5"]').click();await loc('partyRemove').click();await add(94);
  await loc('partyBattle').click();const team=await saved();
  assert.deepEqual(team[0].map(p=>p.id),[131,25,143,132,1,94]);assert.deepEqual(team[0][0].moves,[57]);
  assert.equal(new Set(team[1].map(p=>p.id)).size,6);
  assert.equal(await loc('pname').innerText(),'Lapras');assert.deepEqual(await page.locator('#moves button').evaluateAll(a=>a.map(b=>b.dataset.id)),['57']);
  // Reserve slots retain their identity after the simulator reorders its internal party.
  await page.locator('[data-switch-slot="2"]').click();
  await page.waitForFunction(()=>document.querySelector('#turnLog').children.length);
  assert.equal(await loc('pname').innerText(),'Snorlax');assert.match(await loc('turnLog').textContent(),/sent out Snorlax/);
  await loc('show').click();await loc('seek').fill('29');await loc('play').click();assert.equal(await loc('pname').innerText(),'Snorlax');
  await loc('buildTeam').click();await page.locator('[data-party-slot="2"]').click();await loc('partyRemove').click();
  await loc('dexClose').click();assert.deepEqual(await saved(),team);assert.equal(await loc('pname').innerText(),'Snorlax');
  await page.reload();await ready();assert.deepEqual(await saved(),team);assert.equal(await loc('pname').innerText(),'Lapras');
  await loc('buildTeam').click();
  await page.locator('#setEditor summary').click();await page.locator('#equippedSlots select').first().selectOption('58');
  await loc('partyBattle').click();
  assert.deepEqual((await saved())[0][0].moves,[58]);
  // Use a deterministic matchup to force a replacement from the real battle UI.
  const preset=[[{id:101,moves:[153]},{id:143,moves:[69]}],[{id:94,moves:[122]},{id:132,moves:[144]}]];
  await page.evaluate(p=>localStorage.setItem('pokemon-battle-field.parties.v2',JSON.stringify(p)),preset);
  await page.reload();await ready();await loc('moves').locator('button').click();
  await page.waitForFunction(()=>document.querySelector('#prompt').textContent==='Choose a replacement.');
  assert.equal(await page.locator('#moves button').count(),0);assert.ok(await page.locator('[data-switch-slot="0"]').isDisabled());
  const hp=await loc('chp').innerText();await page.locator('[data-switch-slot="1"]').click();
  await page.waitForFunction(()=>document.querySelector('#moves button:enabled'));
  assert.equal(await loc('pname').innerText(),'Snorlax');assert.equal(await loc('chp').innerText(),hp);
  assert.equal(await loc('php').innerText(),(await loc('php').getAttribute('title')).split(' / ')[1].split(' ')[0]);
  assert.ok(await page.locator('[data-switch-slot="0"]').isDisabled());
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);console.log(offline?'Offline mobile':'Desktop','verified six slots, custom moves, lead, removal, matching rival, voluntary switch, forced replacement and saved team.');
  await page.close();
 }
}finally{await browser.close()}
