import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-angle=metal']});
try{
 for(const offline of [false,true]){
  const page=await browser.newPage({viewport:offline?{width:390,height:844}:{width:1280,height:800},offline,reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  const base=offline?pathToFileURL(resolve('dist/pokemon-battle-field.html')).href:(process.env.BASE_URL||'http://127.0.0.1:4181');
  await page.goto(base+'?dex=106');await page.waitForFunction(()=>window.__dioramaReady && window.__diorama.dex.studio);
  // In reduced-motion mode the idle is truly held. Explicit playback should still kick, then recover.
  await page.evaluate(()=>{window.readPose=()=>{const f=__diorama.dex.studio.fighter;f.root.updateMatrixWorld(true);const pose=[];f.root.traverse(o=>{if(o.isMesh)pose.push(...o.matrixWorld.elements)});return JSON.stringify(pose)}});
  await page.waitForTimeout(120);const rest=await page.evaluate(()=>readPose());await page.locator('#previewMove').selectOption('26');await page.locator('#previewAttack').click();
  await page.waitForFunction(base=>readPose()!==base,rest,{timeout:1500});await page.waitForFunction(base=>readPose()===base,rest,{timeout:3500});
  await page.locator('#asPlayer').click();await page.locator('#partyBattle').click();
  await page.locator('#openDex').click();await page.locator('#dexSearch').fill('Mewtwo');await page.locator('[data-dex="150"]').click();await page.locator('#rivalEditor summary').click();await page.locator('#asRival').click();
  await page.locator('#moves button:enabled').first().click();await page.waitForFunction(()=>document.querySelector('#turnLog').children.length);await page.locator('#history summary').click();assert.ok(await page.locator('#turnLog').innerText());
  await page.locator('#openDex').click();await page.locator('#dexSearch').fill('Onix');await page.locator('[data-dex="95"]').click();await page.locator('#previewAttack').click();await page.keyboard.press('Escape');assert.equal(await page.locator('#dex').isVisible(),false);
  assert.deepEqual(errors,[]);console.log(offline?'Offline phone':'Desktop',': preview motion/recovery, equipped turn, move history, modal close passed');await page.close();
 }
}finally{await browser.close()}
