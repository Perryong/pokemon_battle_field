// Check the actual builder and both sides of the friend invite before joining.
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-angle=metal','--disable-renderer-backgrounding']});
const base=process.env.BASE_URL || 'http://127.0.0.1:4181/';
const errors=[];
async function page(url,width=1280) {
  const p=await browser.newPage({viewport:{width,height:830},reducedMotion:'reduce'});
  p.on('pageerror',e=>errors.push(e.message));await p.goto(url);
  await p.waitForFunction(()=>window.__dioramaReady);return p;
}
async function selectMon(p,id) {
  await p.locator('#dexSearch').fill(String(id));await p.locator('[data-dex="'+id+'"]').click();
}
try {
  const host=await page(base,390);await host.locator('#openDex').click();
  await host.locator('#dexFormat').selectOption('gen1ou');await selectMon(host,150);
  await host.locator('#asPlayer').click();assert.match(await host.locator('#formatProblems').innerText(),/Uber/);
  assert.ok(await host.locator('#partyBattle').isDisabled());
  await selectMon(host,128);assert.match(await host.locator('#strategyRole').innerText(),/cleaner/);
  await host.locator('#equipSet').click();await host.locator('#asPlayer').click();
  await host.locator('#partyAdd').click();assert.match(await host.locator('#formatProblems').innerText(),/Species Clause/);
  await host.locator('#partyRemove').click();await host.locator('#partyBattle').click();
  assert.equal(await host.locator('#battleFormat').innerText(),'RBY OU');
  assert.deepEqual(await host.locator('#moves button').evaluateAll(btn=>btn.map(x=>+x.dataset.id)),[34,63,59,89]);
  await host.locator('#moves button').first().click();await host.waitForFunction(()=>document.querySelector('#turnLog').children.length);
  await host.locator('#history summary').click();
  assert.ok((await host.locator('#turnLog').innerText()).includes('Turn 1'));
  assert.match(await host.locator('#ppercent').innerText(),/%/);
  assert.ok(await host.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await host.reload();await host.waitForFunction(()=>window.__dioramaReady);
  assert.equal(await host.locator('#battleFormat').innerText(),'RBY OU');
  await host.locator('#friendOpen').click();await host.locator('#friendConnect').click();
  await host.locator('#friendLink').waitFor({state:'visible'});const invite=await host.locator('#friendLink').inputValue();
  assert.match(invite,/format=gen1ou/);
  const guest=await page(base);
  await guest.evaluate(()=>localStorage.setItem('pokemon-battle-field.parties.v2',JSON.stringify([[{id:150,moves:[94]}],[{id:25,moves:[85]}]])));
  await guest.goto(invite);await guest.reload();await guest.waitForFunction(()=>window.__dioramaReady && document.querySelector('#friendLobby').open);
  assert.ok(await guest.locator('#friendConnect').isDisabled());
  assert.match(await guest.locator('#friendProblems').innerText(),/Uber/);
  await guest.locator('#friendEdit').click();assert.ok(await guest.locator('#dexFormat').isDisabled());
  await selectMon(guest,113);await guest.locator('#strategySelect').selectOption('0');await guest.locator('#equipSet').click();
  await guest.locator('#asPlayer').click();await guest.locator('#partyBattle').click();
  await guest.locator('#friendConnect').click();
  for (const p of [host,guest]) await p.waitForFunction(()=>document.querySelector('#decklabel').textContent==='FRIEND BATTLE');
  assert.equal(await guest.locator('#battleFormat').innerText(),'RBY OU');
  await host.locator('#moves button').first().click();await guest.locator('#moves button').first().click();
  for (const p of [host,guest]) await p.waitForFunction(()=>document.querySelector('#turnLog').children.length);
  assert.equal(await host.locator('#php').innerText(),await guest.locator('#chp').innerText());
  assert.deepEqual(errors,[]);console.log('Verified set equipping, team fixes, OU solo play and reload, compact mobile HUD and a real OU friend turn.');
}finally{await browser.close();}
