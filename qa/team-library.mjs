// Exercise a published Smogon sample through the same editor in solo and friend play.
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';

const base=process.env.BASE_URL || 'http://127.0.0.1:4181/';
const response=await fetch('https://pokepast.es/2c3090c9fe06d6a0/raw');
assert.ok(response.ok);
const sample=await response.text();
const browser=await chromium.launch({
  executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args:['--use-angle=metal','--disable-renderer-backgrounding'],
});
const errors=[];
async function open(url,width) {
  const page=await browser.newPage({viewport:{width,height:830},reducedMotion:'reduce'});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(url);await page.waitForFunction(()=>window.__dioramaReady);
  return page;
}
async function library(p,button) {
  await p.locator(button).click();await p.locator('#teamLibrary summary').click();
}
const ready=p=>p.waitForFunction(()=>document.querySelector('#decklabel').textContent==='FRIEND BATTLE');
const played=p=>p.waitForFunction(()=>document.querySelector('#turnLog').children.length);
try {
  const host=await open(base,390);
  await library(host,'#openDex');
  await host.locator('#dexFormat').selectOption('gen1ou');
  await host.locator('#teamPaste').fill(sample);await host.locator('#importPaste').click();
  assert.equal(await host.locator('#partyCount').textContent(),'6 / 6');
  assert.match(await host.locator('#partySlots button').first().textContent(),/Alakazam/);
  await host.locator('#savedName').fill('Tournament six');await host.locator('#saveNamed').click();
  const titles=host.locator('#savedTeams option');
  assert.equal(await titles.count(),2);
  await host.locator('#teamPaste').fill('Mewtwo\n- Psychic');await host.locator('#importPaste').click();
  assert.match(await host.locator('#libraryMessage').textContent(),/Uber|banned/i);
  assert.equal(await host.locator('#partyCount').textContent(),'6 / 6');
  await host.locator('#teamPaste').fill('Gengar\n- Hypnosis');await host.locator('#importPaste').click();
  await host.locator('#savedName').fill('Gengar lead');await host.locator('#saveNamed').click();
  await host.locator('#dexClose').click();await host.reload();
  await library(host,'#openDex');assert.equal(await titles.count(),3);
  await host.locator('#savedTeams').selectOption('Tournament six');await host.locator('#loadSaved').click();
  assert.equal(await host.locator('#dexFormat').inputValue(),'gen1ou');
  await host.locator('#exportPaste').click();const exported=await host.locator('#teamPaste').inputValue();
  assert.match(exported,/Alakazam/);assert.match(exported,/Tauros/);
  assert.ok(await host.locator('#dex').evaluate(el=>el.scrollWidth<=el.clientWidth));
  await host.locator('#partyBattle').click();await host.locator('#moves button').first().click();await played(host);
  await host.locator('#friendOpen').click();await host.locator('#friendConnect').click();
  await host.locator('#friendLink').waitFor({state:'visible'});
  const guest=await open(await host.locator('#friendLink').inputValue(),1280);
  await library(guest,'#friendEdit');assert.ok(await guest.locator('#dexFormat').isDisabled());
  await guest.locator('#teamPaste').fill(exported);await guest.locator('#importPaste').click();
  assert.equal(await guest.locator('#partyCount').textContent(),'6 / 6');
  await guest.locator('#partyBattle').click();await guest.locator('#friendConnect').click();
  for (const p of [host,guest]) await ready(p);
  for (const p of [host,guest]) await p.locator('#moves button').first().click();
  for (const p of [host,guest]) await played(p);
  assert.equal(await host.locator('#php').textContent(),await guest.locator('#chp').textContent());
  assert.deepEqual(errors,[]);console.log('Verified Smogon six, two named saves, reload, OU validation, export, solo turn and two-browser friend turn.');
} finally {await browser.close();}
