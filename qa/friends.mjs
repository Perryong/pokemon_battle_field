// Run against the real site and public signaling service with unrelated browser contexts.
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL || 'http://127.0.0.1:4181/';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-angle=metal','--disable-renderer-backgrounding','--disable-background-timer-throttling']});
const errors=[];
async function trainer(home) {
  const page=await browser.newPage({reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(home=>{
    localStorage.setItem('pokemon-battle-field.parties.v2', JSON.stringify([home,home]));
  },home);
  return page;
}
async function ready(page,url) {
  await page.goto(url);
  await page.waitForFunction(()=>window.__dioramaReady);
}
const clickable=p=>p.waitForFunction(()=>document.querySelector('#moves button:enabled') || document.querySelector('#switchChoices button:enabled'));
async function sameField(home,guest) {
  for (const [a,b] of [['pname','cname'],['cname','pname'],['php','chp'],['chp','php']])
    assert.equal(await home.locator('#'+a).innerText(),await guest.locator('#'+b).innerText());
}
try {
  const host=await trainer([{id:101,moves:[153]},{id:143,moves:[69]}]);
  const guest=await trainer([{id:94,moves:[122]},{id:129,moves:[150]}]);
  await ready(host,base);await host.locator('#friendOpen').click();await host.locator('#friendConnect').click();
  await host.locator('#friendLink').waitFor({state:'visible',timeout:40000});
  const invite=await host.locator('#friendLink').inputValue();
  assert.ok(new URL(invite).hash.startsWith('#battle='));
  await ready(guest,invite);assert.equal(await guest.locator('#friendTeam').innerText(),'Gengar · Magikarp');
  await guest.locator('#friendEdit').click();await guest.locator('#partyBattle').click();
  await guest.locator('#friendLobby').waitFor({state:'visible'});
  await guest.locator('#friendConnect').click();
  await Promise.all([host,guest].map(p=>p.waitForFunction(()=>document.querySelector('#decklabel').textContent==='FRIEND BATTLE',{},{timeout:50000})));
  await sameField(host,guest);
  // A third trainer cannot claim the occupied seat.
  const extra=await trainer([{id:25,moves:[85]}]);
  await ready(extra,invite);await extra.locator('#friendConnect').click();
  await extra.waitForFunction(()=>document.querySelector('#friendStatus').textContent.includes('two trainers'));
  await extra.close();
  await guest.locator('#moves button').first().click();
  assert.equal(await guest.locator('#moves button:enabled').count(),0);
  assert.equal(await host.locator('#turnLog li').count(),0);
  await host.locator('#moves button').first().click();
  await host.waitForFunction(()=>document.querySelector('#prompt').textContent==='Choose a replacement.');
  await guest.waitForFunction(()=>document.querySelector('#intel').textContent.includes('replacement'));
  await sameField(host,guest);
  const hp=await guest.locator('#php').innerText();
  await host.locator('[data-switch-slot="1"]').click();
  await Promise.all([host,guest].map(clickable));
  assert.equal(await guest.locator('#php').innerText(),hp);
  await sameField(host,guest);
  await guest.locator('[data-switch-slot="1"]').click();
  await host.locator('#moves button').first().click();
  await Promise.all([host,guest].map(clickable));
  await sameField(host,guest);
  assert.equal(await guest.locator('#pname').innerText(),'Magikarp');
  await guest.locator('#friendOpen').click();await guest.locator('#friendLeave').click();
  await host.waitForFunction(()=>document.querySelector('#prompt').textContent==='Connection closed.');
  assert.equal(await host.locator('#moves button:enabled').count(),0);
  await host.locator('#friendOpen').click();await host.locator('#friendLeave').click();
  assert.equal(await host.locator('#decklabel').innerText(),'TRAINER CONSOLE');
  const retired=await trainer([{id:25,moves:[85]}]);
  await ready(retired,invite);await retired.locator('#friendConnect').click();
  await retired.waitForFunction(()=>document.querySelector('#friendStatus').textContent.includes('expired'));
  await retired.close();
  // A one-turn battle makes the opposite winner labels easy to verify end to end.
  await host.close();await guest.close();
  const a=await trainer([{id:101,moves:[153]}]), b=await trainer([{id:94,moves:[122]}]);
  await ready(a,base);await a.locator('#friendOpen').click();await a.locator('#friendConnect').click();
  await a.locator('#friendLink').waitFor({state:'visible'});
  await ready(b,await a.locator('#friendLink').inputValue());await b.locator('#friendConnect').click();
  await b.waitForFunction(()=>document.querySelector('#decklabel').textContent==='FRIEND BATTLE');
  await a.locator('#moves button').first().click();await b.locator('#moves button').first().click();
  await a.waitForFunction(()=>document.querySelector('#prompt').textContent==='The rival party wins!');
  await b.waitForFunction(()=>document.querySelector('#prompt').textContent==='Your party wins!');
  await sameField(a,b);assert.deepEqual(errors,[]);
  console.log('Two independent trainers used a public invite, private choices, forced replacement and a voluntary switch. A third trainer was rejected, both screens matched, leaving expired the invite, and a complete battle showed the correct winner for both players.');
}finally{await browser.close();}
